import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function extrairNumeroReal(nomeArquivo: string, caminhoR2: string, mod: string): { numero: string; ano: number } | null {
  const texto = `${caminhoR2} ${nomeArquivo}`.toUpperCase();

  // 1. Procura padrões específicos de modalidade (PE, DL, INEX, CP, CC)
  // Ex: PE N. 035-2024, DL N. 004-2024, INEXIGIBILIDADE N. 002-2024
  let m = texto.match(/(?:PE|PREG[ÃA]O)\s*(?:PRESENCIAL|ELETR[ÔO]NICO)?\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (m) return { numero: `${parseInt(m[1], 10).toString().padStart(3, '0')}/${m[2]}`, ano: parseInt(m[2], 10) };

  m = texto.match(/(?:DL|DISPENSA)\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (m) return { numero: `${parseInt(m[1], 10).toString().padStart(3, '0')}/${m[2]}`, ano: parseInt(m[2], 10) };

  m = texto.match(/(?:INEX|INEXIGIBILIDADE)\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (m) return { numero: `${parseInt(m[1], 10).toString().padStart(3, '0')}/${m[2]}`, ano: parseInt(m[2], 10) };

  m = texto.match(/(?:CONCORR[ÊE]NCIA)\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (m) return { numero: `${parseInt(m[1], 10).toString().padStart(3, '0')}/${m[2]}`, ano: parseInt(m[2], 10) };

  m = texto.match(/(?:CONVITE|CARTA CONVITE)\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (m) return { numero: `${parseInt(m[1], 10).toString().padStart(3, '0')}/${m[2]}`, ano: parseInt(m[2], 10) };

  // 2. Se não encontrou prefixo de modalidade, tenta ver se tem Nº XXX/AAAA ou XXX-AAAA
  // Mas ignora se tiver prefixo "PA " (Processo Administrativo) logo antes, a menos que seja o único número
  const matches = Array.from(texto.matchAll(/(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/g));
  if (matches.length > 0) {
    // Se tem mais de 1 número, tenta pegar o que não começa com PA
    for (const match of matches) {
      const idx = match.index || 0;
      const prefixo = texto.slice(Math.max(0, idx - 5), idx);
      if (!prefixo.includes("PA") && !prefixo.includes("PROC")) {
        return { numero: `${parseInt(match[1], 10).toString().padStart(3, '0')}/${match[2]}`, ano: parseInt(match[2], 10) };
      }
    }
    // Se todos ou só tem 1, pega o último
    const ultimo = matches[matches.length - 1];
    return { numero: `${parseInt(ultimo[1], 10).toString().padStart(3, '0')}/${ultimo[2]}`, ano: parseInt(ultimo[2], 10) };
  }

  return null;
}

function normalizarMod(mod: string): string {
  if (!mod) return "Pregão";
  const m = mod.toUpperCase();
  if (m.includes("DISPENSA")) return "Dispensa";
  if (m.includes("PREG")) return "Pregão";
  if (m.includes("CONCORR")) return "Concorrência";
  if (m.includes("INEX")) return "Inexigibilidade";
  if (m.includes("CHAMADA")) return "Chamada Pública";
  if (m.includes("LEIL")) return "Leilão";
  if (m.includes("TOMADA")) return "Tomada de Preços";
  if (m.includes("CONVITE")) return "Convite";
  if (m.includes("CREDENCIAMENTO")) return "Credenciamento";
  if (m.includes("ADES")) return "Adesão";
  return mod;
}

async function main() {
  console.log("🚀 Iniciando realinhamento inteligente de documentos com as licitações oficiais do TCE...");

  // 1. Carregar todas as licitações oficiais
  const { data: todasLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  if (!todasLics) return;

  const oficiaisMap = new Map<string, any>();
  todasLics.forEach(l => {
    const modNorm = normalizarMod(l.modalidade || "");
    const k = `${(l.numero || "").trim()}___${l.ano}___${modNorm}`.toUpperCase();
    // Prioriza manter no mapa a licitação oficial do TCE
    if (!oficiaisMap.has(k) || l.origem === "TCE-PI") {
      oficiaisMap.set(k, l);
    }
  });

  // 2. Carregar todos os documentos
  const { data: todosDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("*");
  if (!todosDocs) return;
  console.log(`📂 Analisando ${todosDocs.length} documentos...`);

  let reconectados = 0;

  for (const doc of todosDocs) {
    const modNorm = normalizarMod(doc.modalidade || "");
    const numAno = extrairNumeroReal(doc.nome_arquivo || "", doc.caminho_r2 || "", modNorm);

    if (numAno) {
      const chaveBusca = `${numAno.numero}___${numAno.ano}___${modNorm}`.toUpperCase();
      const licAlvo = oficiaisMap.get(chaveBusca);

      if (licAlvo && licAlvo.id !== doc.licitacao_id) {
        await supabase
          .schema("transparencia")
          .from("licitacoes_documentos")
          .update({ licitacao_id: licAlvo.id })
          .eq("id", doc.id);
        reconectados++;

        // Atualiza flags booleanas
        const updateFlags: any = {};
        const nomeUpper = (doc.nome_arquivo || "").toUpperCase();
        if (nomeUpper.includes("EDITAL") && !licAlvo.possui_edital) updateFlags.possui_edital = true;
        if (nomeUpper.includes("ATA") && !licAlvo.possui_ata) updateFlags.possui_ata = true;
        if (nomeUpper.includes("HOMOLOGA") && !licAlvo.possui_homologacao) updateFlags.possui_homologacao = true;
        if (Object.keys(updateFlags).length > 0) {
          await supabase.schema("transparencia").from("licitacoes_v2").update(updateFlags).eq("id", licAlvo.id);
        }
      }
    }
  }

  console.log(`✨ Re-vinculação concluída! Documentos redirecionados para a licitação oficial exata: ${reconectados}`);

  // 3. Excluir licitações sintéticas/duplicadas que ficaram vazias ou não são oficiais do TCE
  console.log("🧹 Limpando licitações sintéticas e genéricas que não são do TCE...");
  const { data: docsAtuais } = await supabase.schema("transparencia").from("licitacoes_documentos").select("licitacao_id");
  const licComDocs = new Set((docsAtuais || []).map(d => d.licitacao_id));

  // Acha licitações sintéticas ou sem origem TCE que não têm documentos ou que são repetidas/genéricas
  const paraExcluir = todasLics.filter(l => {
    if (l.origem === "TCE-PI") return false; // Nunca exclui linha oficial do TCE
    const objetoGenerico = (l.objeto || "").includes("Processo Licitatório do Município de Padre Marcos - PI.");
    const semDoc = !licComDocs.has(l.id);
    return objetoGenerico || semDoc;
  });

  if (paraExcluir.length > 0) {
    const idsExcluir = paraExcluir.map(l => l.id);
    // Mas antes garante que se tiver algum doc ainda apontando pra elas, não exclui pra não dar erro de FK
    const idsSeguros = idsExcluir.filter(id => !licComDocs.has(id));
    if (idsSeguros.length > 0) {
      await supabase.schema("transparencia").from("licitacoes_v2").delete().in("id", idsSeguros);
      console.log(`🗑️ Licitações sintéticas/duplicadas removidas: ${idsSeguros.length}`);
    }
  }

  // 4. Se ainda restaram licitações genéricas com documentos (porque o doc não achou par no TCE), limpa as repetidas 001/2026
  const { data: licsFinais } = await supabase.schema("transparencia").from("licitacoes_v2").select("id, numero, ano, modalidade, origem, objeto");
  const unicos = new Set<string>();
  const duplicadasGenericas: string[] = [];

  (licsFinais || []).forEach(l => {
    const k = `${l.numero}___${l.ano}___${l.modalidade}`;
    if (unicos.has(k)) {
      if (l.origem !== "TCE-PI") duplicadasGenericas.push(l.id);
    } else {
      unicos.add(k);
    }
  });

  if (duplicadasGenericas.length > 0) {
    await supabase.schema("transparencia").from("licitacoes_v2").delete().in("id", duplicadasGenericas);
    console.log(`🗑️ Duplicatas genéricas residuais eliminadas: ${duplicadasGenericas.length}`);
  }

  console.log("🏆 Limpeza e realinhamento finalizados com sucesso!");
}

main().catch(console.error);
