import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Credenciais do Supabase não encontradas no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizarMod(mod: string, obj: string): string {
  if (!mod) return "Pregão";
  let m = mod.trim();
  const o = (obj || "").toUpperCase();

  if (m === "Outras" || m.includes("Aviso de Dispensa")) {
    if (o.includes("DISPENSA")) return "Dispensa";
    if (o.includes("PREGÃO") || o.includes("PREGAO")) return "Pregão";
    if (o.includes("CONCORR")) return "Concorrência";
    if (o.includes("INEXIGIBILIDADE")) return "Inexigibilidade";
  }

  if (m.toLowerCase().includes("dispensa")) return "Dispensa";
  if (m.toLowerCase().includes("pregão") || m.toLowerCase().includes("pregao")) return "Pregão";
  if (m.toLowerCase().includes("concorr")) return "Concorrência";
  if (m.toLowerCase().includes("inexigibilidade")) return "Inexigibilidade";
  if (m.toLowerCase().includes("chamada")) return "Chamada Pública";
  if (m.toLowerCase().includes("leil")) return "Leilão";
  if (m.toLowerCase().includes("tomada")) return "Tomada de Preços";
  if (m.toLowerCase().includes("convite")) return "Convite";
  if (m.toLowerCase().includes("credenciamento")) return "Credenciamento";
  if (m.toLowerCase().includes("adesão") || m.toLowerCase().includes("adesao")) return "Adesão";

  return m;
}

// Similaridade simples entre strings para comparar objetos
function stringsSimilares(a: string, b: string): boolean {
  if (!a || !b) return false;
  const sA = a.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
  const sB = b.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
  if (sA.length < 15 || sB.length < 15) return sA === sB;
  return sA.includes(sB.slice(0, 20)) || sB.includes(sA.slice(0, 20));
}

async function main() {
  console.log("🚀 Iniciando consolidação e unificação definitiva de licitações...");

  // 1. Carregar todas as licitações
  const { data: todasLics, error } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  if (error || !todasLics) {
    console.error("Erro ao buscar licitacoes_v2:", error);
    return;
  }
  console.log(`📊 Total de registros atuais em licitacoes_v2: ${todasLics.length}`);

  // 2. Normalizar modalidades soltas como "Outras" antes de unificar
  for (const l of todasLics) {
    const modNorm = normalizarMod(l.modalidade || "", l.objeto || "");
    if (modNorm !== l.modalidade) {
      l.modalidade = modNorm;
      await supabase.schema("transparencia").from("licitacoes_v2").update({ modalidade: modNorm }).eq("id", l.id);
    }
  }

  // 3. Agrupar por (numero + ano + modalidade) ou por (numero + ano + objeto similar)
  const grupos = new Map<string, any[]>();
  for (const l of todasLics) {
    const num = (l.numero || "").trim();
    const ano = l.ano;
    const mod = (l.modalidade || "").trim();

    // Procura se já existe um grupo para esse num + ano que tenha a mesma modalidade ou objeto muito similar
    let grupoKeyEncontrado: string | null = null;
    for (const [key, lista] of grupos.entries()) {
      const primeiro = lista[0];
      if (primeiro.numero === num && primeiro.ano === ano) {
        if (primeiro.modalidade === mod || stringsSimilares(primeiro.objeto, l.objeto)) {
          grupoKeyEncontrado = key;
          break;
        }
      }
    }

    if (grupoKeyEncontrado) {
      grupos.get(grupoKeyEncontrado)!.push(l);
    } else {
      const newKey = `${num}___${ano}___${mod}___${l.id}`;
      grupos.set(newKey, [l]);
    }
  }

  let gruposUnificados = 0;
  let duplicatasRemovidas = 0;

  for (const [_, lista] of grupos.entries()) {
    if (lista.length > 1) {
      // Ordena para escolher a Principal: prioriza ter link_tce, depois tamanho do objeto, depois ter valor estimado
      lista.sort((a, b) => {
        const scoreA = (a.link_tce ? 1000 : 0) + (a.origem === "TCE-PI" ? 500 : 0) + (a.objeto?.length || 0) + (a.valor_estimado ? 50 : 0);
        const scoreB = (b.link_tce ? 1000 : 0) + (b.origem === "TCE-PI" ? 500 : 0) + (b.objeto?.length || 0) + (b.valor_estimado ? 50 : 0);
        return scoreB - scoreA;
      });

      const principal = lista[0];
      const duplicadas = lista.slice(1);
      const dupIds = duplicadas.map(d => d.id);

      // Mover TODOS os documentos das duplicadas para a Principal
      await supabase.schema("transparencia").from("licitacoes_documentos").update({ licitacao_id: principal.id }).in("licitacao_id", dupIds);

      // Combinar flags booleanas e dados que possam faltar na Principal
      const edital = lista.some(l => l.possui_edital === true);
      const ata = lista.some(l => l.possui_ata === true);
      const hom = lista.some(l => l.possui_homologacao === true);
      const contr = lista.some(l => l.possui_contrato === true);

      const updateData: any = {
        possui_edital: edital,
        possui_ata: ata,
        possui_homologacao: hom,
        possui_contrato: contr
      };

      if (!principal.link_tce) {
        const comLink = lista.find(l => l.link_tce);
        if (comLink) updateData.link_tce = comLink.link_tce;
      }
      if (!principal.valor_estimado) {
        const comVal = lista.find(l => l.valor_estimado > 0);
        if (comVal) updateData.valor_estimado = comVal.valor_estimado;
      }

      await supabase.schema("transparencia").from("licitacoes_v2").update(updateData).eq("id", principal.id);

      // Excluir as linhas duplicadas
      await supabase.schema("transparencia").from("licitacoes_v2").delete().in("id", dupIds);

      gruposUnificados++;
      duplicatasRemovidas += duplicadas.length;
    }
  }

  console.log(`✨ Consolidação finalizada! Grupos unificados: ${gruposUnificados} | Duplicatas removidas: ${duplicatasRemovidas}`);

  // 4. Verificação final: quantas licitações únicas restaram no banco
  const { data: finais } = await supabase.schema("transparencia").from("licitacoes_v2").select("id");
  console.log(`🏆 Total final de licitações únicas e consolidadas: ${finais?.length || 0}`);
}

main().catch(console.error);
