import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";
import pdfParse from "pdf-parse";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DOWNLOADS_DIR = "C:\\Users\\Áurea Letícia\\Downloads";
const R2_PREFIX = "backup licitações final";
const RELATORIO_FILE = path.join(process.cwd(), "relatorio-pendencias-remessa-final.txt");

function detectarTipoDocumento(nome: string): string {
  const n = nome.toUpperCase();
  if (n.includes("EDITAL") || n.includes("TERMO DE REFER")) return "Edital";
  if (n.includes("ATA")) return "Ata de Registro de Preços";
  if (n.includes("HOMOLOGA") || n.includes("ADJUDICA") || n.includes("RESULTADO")) return "Homologação/Adjudicação";
  if (n.includes("CONTRATO") || n.includes("EMPENHO") || n.includes("EXTRATO CONTRATO")) return "Contrato";
  if (n.includes("AVISO") || n.includes("EXTRATO PUBLICA")) return "Aviso";
  if (n.includes("HABILITA") || n.includes("PROPOSTA") || n.includes("CND") || n.includes("CERTID")) return "Proposta/Habilitação";
  return "Outros";
}

function normalizarModalidade(mod: string): string {
  const m = mod.toUpperCase();
  if (m.includes("DISPENSA")) return "Dispensa";
  if (m.includes("PREG")) return "Pregão";
  if (m.includes("CONCORR")) return "Concorrência";
  if (m.includes("INEX")) return "Inexigibilidade";
  if (m.includes("LEIL")) return "Leilão";
  if (m.includes("TOMADA")) return "Tomada de Preços";
  if (m.includes("CONVITE")) return "Convite";
  if (m.includes("CHAMADA")) return "Chamada Pública";
  if (m.includes("CREDENCIAMENTO")) return "Credenciamento";
  return mod;
}

function extrairNumeroAnoModalidade(nomeArquivo: string, caminhoRelativo: string, textoPdf?: string): { numero: string; ano: number; modalidade: string } | null {
  const texto = `${caminhoRelativo} ${nomeArquivo} ${textoPdf || ""}`.toUpperCase();

  let modalidade = "Pregão";
  if (texto.includes("CONCORR")) modalidade = "Concorrência";
  else if (texto.includes("DISPENSA")) modalidade = "Dispensa";
  else if (texto.includes("INEX")) modalidade = "Inexigibilidade";
  else if (texto.includes("LEIL")) modalidade = "Leilão";
  else if (texto.includes("TOMADA") || texto.includes("TP")) modalidade = "Tomada de Preços";
  else if (texto.includes("CONVITE")) modalidade = "Convite";
  else if (texto.includes("CHAMADA")) modalidade = "Chamada Pública";

  let m = texto.match(/(?:PE|PREG[ÃA]O|DL|DISPENSA|INEX|INEXIGIBILIDADE|CE|CONCORR[ÊE]NCIA|LEIL[ÃA]O|TP|TOMADA|CONVITE|CHAMADA)\s*(?:PRESENCIAL|ELETR[ÔO]NICO|P[ÚU]BLICA)?\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d|\d{2})/);
  if (!m) {
    m = texto.match(/(201\d|202\d)\s*[\-\/\_]\s*(\d{1,4})/);
    if (m) {
      return {
        numero: `${parseInt(m[2], 10).toString().padStart(3, "0")}/${m[1]}`,
        ano: parseInt(m[1], 10),
        modalidade: normalizarModalidade(modalidade),
      };
    }
  }
  if (!m) m = texto.match(/(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (!m) m = texto.match(/(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(1[789]|2[0123456])/);

  if (m) {
    const numRaw = parseInt(m[1], 10);
    let anoRaw = parseInt(m[2], 10);
    if (anoRaw < 100) anoRaw += 2000;
    return {
      numero: `${numRaw.toString().padStart(3, "0")}/${anoRaw}`,
      ano: anoRaw,
      modalidade: normalizarModalidade(modalidade),
    };
  }
  return null;
}

async function varrerArquivos(dir: string): Promise<string[]> {
  const lista: string[] = [];
  if (!fs.existsSync(dir)) return lista;
  const itens = fs.readdirSync(dir);
  for (const item of itens) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      lista.push(...(await varrerArquivos(full)));
    } else {
      const low = item.toLowerCase();
      if (low !== "desktop.ini" && low !== ".ds_store") lista.push(full);
    }
  }
  return lista;
}

async function processarLote(pastaAbsoluta: string, nomeLote: string, licsMap: Map<string, any>, docsR2Set: Set<string>, nomesExistentesSet: Set<string>) {
  console.log(`\n======================================================`);
  console.log(`📂 PROCESSANDO LOTE / PASTA: ${nomeLote}`);
  console.log(`======================================================`);

  const arquivos = await varrerArquivos(pastaAbsoluta);
  console.log(`📄 Total de arquivos encontrados em ${nomeLote}: ${arquivos.length}`);

  let sucessos = 0;
  let duplicados = 0;
  let naoIdentificados = 0;

  for (let idx = 0; idx < arquivos.length; idx++) {
    const absPath = arquivos[idx];
    const relPath = path.relative(pastaAbsoluta, absPath).replace(/\\/g, "/");
    const nomeArquivo = path.basename(absPath);

    // Checar duplicata por nome de arquivo já no banco ou no R2
    if (nomesExistentesSet.has(nomeArquivo.toLowerCase())) {
      console.log(`⏩ [${idx + 1}/${arquivos.length}] Duplicata evitada (já cadastrado): ${relPath}`);
      duplicados++;
      continue;
    }

    const r2Key = `${R2_PREFIX}/${nomeLote.replace(".zip", "")}/${relPath}`;
    const publicUrl = `${PUBLIC_URL}/${r2Key}`;

    let info = extrairNumeroAnoModalidade(nomeArquivo, relPath);
    if (!info && absPath.toLowerCase().endsWith(".pdf")) {
      try {
        const buffer = fs.readFileSync(absPath);
        const pdfData = await pdfParse(buffer);
        info = extrairNumeroAnoModalidade(nomeArquivo, relPath, pdfData.text.slice(0, 3000));
        if (info) console.log(`   📖 [Resgatado lendo PDF] ${relPath} -> ${info.numero} (${info.modalidade})`);
      } catch (e) {}
    }

    if (!docsR2Set.has(r2Key)) {
      try {
        const fileBuffer = fs.readFileSync(absPath);
        await s3.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: nomeArquivo.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream",
        }));
      } catch (e: any) {
        console.error(`❌ [${idx + 1}/${arquivos.length}] Erro no upload pro R2 (${relPath}):`, e.message);
        continue;
      }
    }

    if (!info) {
      console.log(`⚠️ [${idx + 1}/${arquivos.length}] Subiu R2 mas NÃO IDENTIFICADO: ${relPath}`);
      fs.appendFileSync(RELATORIO_FILE, `[${nomeLote}] NÃO IDENTIFICADO: ${relPath}\n`, "utf-8");
      naoIdentificados++;
      continue;
    }

    const chave = `${info.numero}___${info.ano}___${info.modalidade}`.toUpperCase();
    let licAlvo = licsMap.get(chave);

    if (!licAlvo) {
      const novaLic = {
        numero: info.numero,
        ano: info.ano,
        modalidade: info.modalidade,
        origem: "HISTORICO_DRIVE",
        objeto: `Processo Licitatório nº ${info.numero} (${info.modalidade}) - Município de Padre Marcos/PI.`,
        data_abertura: `${info.ano}-01-01`,
        possui_edital: false,
        possui_ata: false,
        possui_homologacao: false,
      };
      const { data: resIns, error: errIns } = await supabase.schema("transparencia").from("licitacoes_v2").insert(novaLic).select().single();
      if (resIns) {
        licAlvo = resIns;
        licsMap.set(chave, licAlvo);
      } else {
        fs.appendFileSync(RELATORIO_FILE, `[${nomeLote}] FALHA AO CRIAR LICITAÇÃO: ${relPath} -> ${errIns?.message}\n`, "utf-8");
        continue;
      }
    }

    const tipoDoc = detectarTipoDocumento(nomeArquivo);
    const { error: errDoc } = await supabase.schema("transparencia").from("licitacoes_documentos").insert({
      licitacao_id: licAlvo.id,
      nome_arquivo: nomeArquivo,
      url_arquivo: publicUrl,
      caminho_r2: r2Key,
      tipo_documento: tipoDoc,
      origem: "R2_BACKUP_FINAL",
    });

    if (errDoc) {
      console.log(`❌ [${idx + 1}/${arquivos.length}] Falha ao vincular: ${relPath} (${errDoc.message})`);
      fs.appendFileSync(RELATORIO_FILE, `[${nomeLote}] FALHA AO LINKAR NO BANCO: ${relPath} -> ${errDoc.message}\n`, "utf-8");
    } else {
      docsR2Set.add(r2Key);
      nomesExistentesSet.add(nomeArquivo.toLowerCase());
      sucessos++;
      console.log(`✅ [${idx + 1}/${arquivos.length}] Sucesso: ${relPath} -> Licitação ${info.numero} (${info.modalidade}) [${tipoDoc}]`);

      const updates: any = {};
      if (tipoDoc === "Edital" && !licAlvo.possui_edital) updates.possui_edital = true;
      if (tipoDoc === "Ata de Registro de Preços" && !licAlvo.possui_ata) updates.possui_ata = true;
      if (tipoDoc === "Homologação/Adjudicação" && !licAlvo.possui_homologacao) updates.possui_homologacao = true;
      if (Object.keys(updates).length > 0) {
        await supabase.schema("transparencia").from("licitacoes_v2").update(updates).eq("id", licAlvo.id);
        Object.assign(licAlvo, updates);
      }
    }
  }

  console.log(`📊 Resumo ${nomeLote} -> Sucessos: ${sucessos} | Duplicados evitados: ${duplicados} | Não Identificados: ${naoIdentificados}`);
}

async function main() {
  console.log("🚀 INICIANDO PROCESSAMENTO DA ÚLTIMA REMESSA DE LICITAÇÕES...");
  fs.writeFileSync(RELATORIO_FILE, "=== RELATÓRIO DE PENDÊNCIAS - REMESSA FINAL DE LICITAÇÕES ===\n\n", "utf-8");

  const { data: todasLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  const licsMap = new Map<string, any>();
  (todasLics || []).forEach(l => {
    const k = `${l.numero}___${l.ano}___${normalizarModalidade(l.modalidade || "")}`.toUpperCase();
    if (!licsMap.has(k) || l.origem === "TCE-PI") licsMap.set(k, l);
  });

  const { data: todosDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("caminho_r2, nome_arquivo");
  const docsR2Set = new Set((todosDocs || []).map(d => d.caminho_r2));
  const nomesExistentesSet = new Set((todosDocs || []).map(d => (d.nome_arquivo || "").toLowerCase()).filter(Boolean));

  console.log(`📚 Banco atual: ${licsMap.size} licitações cadastradas e ${nomesExistentesSet.size} documentos existentes.`);

  const pastasAlvo = [
    "concorrencia",
    "dispensa",
    "inexigibilidade",
    "pregao",
    "chamada publica",
    "carta convite",
    "leilao",
    "LICITAÇÕES 2025-2026 - CONTREINA"
  ];

  for (const pasta of pastasAlvo) {
    const caminho = path.join(DOWNLOADS_DIR, pasta);
    if (fs.existsSync(caminho)) {
      await processarLote(caminho, pasta, licsMap, docsR2Set, nomesExistentesSet);
    }
  }

  console.log("\n🏁 REMESSA FINAL DE LICITAÇÕES PROCESSADA COM SUCESSO!");
  console.log(`📝 Relatório gerado em: ${RELATORIO_FILE}`);
}

main().catch(console.error);
