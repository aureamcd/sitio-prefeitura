import "dotenv/config";
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Credenciais do Supabase não encontradas no .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizarModalidade(modRaw: string): string {
  if (!modRaw) return "Pregão";
  const mod = modRaw.trim();
  if (mod.ilike("Dispensa") || mod.toLowerCase().includes("dispensa")) return "Dispensa";
  if (mod.toLowerCase().includes("pregão") || mod.toLowerCase().includes("pregao")) return "Pregão";
  if (mod.toLowerCase().includes("concorrência") || mod.toLowerCase().includes("concorrencia")) return "Concorrência";
  if (mod.toLowerCase().includes("inexigibilidade")) return "Inexigibilidade";
  if (mod.toLowerCase().includes("chamada")) return "Chamada Pública";
  if (mod.toLowerCase().includes("leilão") || mod.toLowerCase().includes("leilao")) return "Leilão";
  if (mod.toLowerCase().includes("tomada")) return "Tomada de Preços";
  if (mod.toLowerCase().includes("convite")) return "Convite";
  if (mod.toLowerCase().includes("credenciamento")) return "Credenciamento";
  if (mod.toLowerCase().includes("adesão") || mod.toLowerCase().includes("adesao")) return "Adesão";
  return modRaw;
}

// Substituto seguro para .ilike em string nativa do JS
String.prototype.ilike = function(target: string) {
  return this.toLowerCase().includes(target.toLowerCase());
};

declare global {
  interface String {
    ilike(target: string): boolean;
  }
}

function extrairNumAnoProc(procRaw: string, dtCadastro?: string): { numero: string; ano: number } {
  if (!procRaw) return { numero: "000/2026", ano: 2026 };
  
  // Tenta extrair NNN/AAAA ou NNN-A/AAAA
  let match = procRaw.match(/(\d{1,4}(?:-[A-Z]+|\.ELE)?)\s*[\-\/\_]\s*(\d{4})/i);
  if (!match) {
    match = procRaw.match(/(\d{1,4})\s*[\-\/\_]\s*(\d{2,3})/);
    if (match) {
      let a = parseInt(match[2], 10);
      if (a < 100) a += 2000;
      else if (a === 200) a = 2009; // Fix do convite 015/200
      return { numero: `${parseInt(match[1], 10).toString().padStart(3, '0')}/${a}`, ano: a };
    }
  }

  if (match) {
    let n = match[1];
    if (/^\d+$/.test(n)) {
      n = parseInt(n, 10).toString().padStart(3, '0');
    }
    const a = parseInt(match[2], 10);
    return { numero: `${n}/${a}`, ano: a };
  }

  // Fallback pelo ano da data de cadastro
  let anoFallback = 2026;
  if (dtCadastro) {
    const mAno = dtCadastro.match(/\d{4}/);
    if (mAno) anoFallback = parseInt(mAno[0], 10);
  }

  const mNum = procRaw.match(/\d+/);
  const numFinal = mNum ? parseInt(mNum[0], 10).toString().padStart(3, '0') : "001";
  return { numero: `${numFinal}/${anoFallback}`, ano: anoFallback };
}

function parseValor(valRaw: any): number | null {
  if (valRaw === undefined || valRaw === null || valRaw === '') return null;
  if (typeof valRaw === 'number') return valRaw;
  const str = String(valRaw).replace(/[^\d,\.]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseDataISO(dtRaw: string): string | null {
  if (!dtRaw) return null;
  // Formato DD/MM/YYYY HH:MM ou DD/MM/YYYY
  const m = dtRaw.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
  if (m) {
    const dia = m[1];
    const mes = m[2];
    const ano = m[3];
    const hr = m[4] || "09";
    const min = m[5] || "00";
    return `${ano}-${mes}-${dia}T${hr}:${min}:00.000Z`;
  }
  return null;
}

async function main() {
  console.log("🚀 Iniciando importação limpa e oficial da planilha do TCE-PI...");

  // Localizar arquivo da planilha em Downloads ou na pasta atual
  const caminhoDownloads = "C:/Users/Áurea Letícia/Downloads/licitações (3).xlsx";
  let caminhoPlanilha = caminhoDownloads;
  if (!fs.existsSync(caminhoPlanilha)) {
    console.error(`❌ Planilha não encontrada em ${caminhoPlanilha}`);
    return;
  }

  console.log(`📄 Lendo planilha: ${caminhoPlanilha}...`);
  const wb = xlsx.readFile(caminhoPlanilha);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const linhas: any[] = xlsx.utils.sheet_to_json(sheet);

  console.log(`📊 Total de processos na planilha do TCE: ${linhas.length}`);

  // Carregar licitações existentes no Supabase para atualizar em vez de duplicar
  const { data: existentes } = await supabase.schema("transparencia").from("licitacoes_v2").select("id, numero, ano, modalidade");
  const mapaExistentes = new Map<string, string>();
  (existentes || []).forEach(e => {
    const k = `${(e.numero || '').trim()}___${e.ano}___${(e.modalidade || '').trim()}`.toUpperCase();
    mapaExistentes.set(k, e.id);
  });

  let inseridos = 0;
  let atualizados = 0;

  for (const row of linhas) {
    const mod = normalizarModalidade(row["Modalidade"] || "");
    const numAno = extrairNumAnoProc(row["Nº Procedimento"] || "", row["Dt Cadastro"]);
    const val = parseValor(row["Valor"]);
    const dtAbertura = parseDataISO(row["Dt Abert/Julg"] || row["Dt Cadastro"]);

    const dadosLic: any = {
      numero: numAno.numero,
      ano: numAno.ano,
      modalidade: mod,
      processo: row["N° proc. TCE"] || null,
      objeto: row["Objeto"] || `${mod.toUpperCase()} Nº ${numAno.numero} - Processo Licitatório de Padre Marcos - PI.`,
      situacao: row["Status"] || "Finalizada",
      valor_estimado: val,
      data_abertura: dtAbertura,
      link_tce: row["Caminho detalhamento licitação"] || null,
      origem: "TCE-PI"
    };

    const chave = `${numAno.numero}___${numAno.ano}___${mod}`.toUpperCase();
    const idExistente = mapaExistentes.get(chave);

    if (idExistente) {
      await supabase.schema("transparencia").from("licitacoes_v2").update(dadosLic).eq("id", idExistente);
      atualizados++;
    } else {
      const { data: criada, error } = await supabase.schema("transparencia").from("licitacoes_v2").insert([dadosLic]).select("id").single();
      if (!error && criada) {
        mapaExistentes.set(chave, criada.id);
        inseridos++;
      } else if (error) {
        console.error(`Erro ao inserir ${chave}:`, error.message);
      }
    }
  }

  console.log(`✅ Sincronização com o TCE concluída! Inseridos: ${inseridos} | Atualizados com dados oficiais: ${atualizados}`);

  // Passo 2: Re-vincular todos os documentos do R2 com base na base oficial recém-populada
  console.log("\n🔗 Re-vinculando todos os documentos do R2 às licitações oficiais...");
  const { data: todasLicsOficiais } = await supabase.schema("transparencia").from("licitacoes_v2").select("id, numero, ano, modalidade");
  const { data: todosDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("*");

  const mapaOficial = new Map<string, string>();
  (todasLicsOficiais || []).forEach(l => {
    const k = `${(l.numero || '').trim()}___${l.ano}___${(l.modalidade || '').trim()}`.toUpperCase();
    mapaOficial.set(k, l.id);
  });

  let docsVinculados = 0;
  for (const doc of todosDocs || []) {
    const textoFull = `${doc.caminho_r2 || ''} ${doc.nome_arquivo || ''}`;
    let mod = normalizarModalidade(doc.modalidade || "");
    if (textoFull.toUpperCase().includes("CONCORR")) mod = "Concorrência";
    else if (textoFull.toUpperCase().includes("DISPENSA")) mod = "Dispensa";
    else if (textoFull.toUpperCase().includes("INEXIGIBILIDADE")) mod = "Inexigibilidade";
    else if (textoFull.toUpperCase().includes("PREG")) mod = "Pregão";
    else if (textoFull.toUpperCase().includes("LEIL")) mod = "Leilão";

    let numMatch = textoFull.match(/(\d{1,4})\s*[\-\/\_\.]\s*(201\d|202\d)/);
    if (!numMatch) numMatch = textoFull.match(/(?:N[º°]?\s*|\b)(\d{1,4})\b.*?(201\d|202\d)/i);

    if (numMatch) {
      const n = parseInt(numMatch[1], 10).toString().padStart(3, '0') + '/' + numMatch[2];
      const a = parseInt(numMatch[2], 10);
      const chaveDoc = `${n}___${a}___${mod}`.toUpperCase();

      const licIdOficial = mapaOficial.get(chaveDoc);
      if (licIdOficial && licIdOficial !== doc.licitacao_id) {
        await supabase.schema("transparencia").from("licitacoes_documentos").update({ licitacao_id: licIdOficial, modalidade: mod }).eq("id", doc.id);
        docsVinculados++;
      }
    }
  }

  console.log(`✨ Re-vinculação finalizada! Documentos reconectados com precisão: ${docsVinculados}`);
}

main().catch(console.error);
