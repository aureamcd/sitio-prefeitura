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
const TEMP_DIR = path.join(DOWNLOADS_DIR, "_temp_zip_licitacoes");
const R2_PREFIX = "backup licitações remessa zips";
const RELATORIO_FILE = path.join(process.cwd(), "relatorio-pendencias-zips-licitacoes.txt");

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

async function processarLoteZip(nomeZip: string, licsMap: Map<string, any>, docsR2Set: Set<string>, nomesExistentesSet: Set<string>) {
  console.log(`\n======================================================`);
  console.log(`📦 PROCESSANDO ZIP: ${nomeZip}`);
  console.log(`======================================================`);

  const zipPath = path.join(DOWNLOADS_DIR, nomeZip);
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log(`⏳ Descompactando ${nomeZip} para pasta temporária...`);
  try {
    execSync(`powershell -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${TEMP_DIR}' -Force"`, { stdio: "inherit" });
  } catch (e: any) {
    console.error(`❌ Erro ao descompactar ${nomeZip}:`, e.message);
    return;
  }

  const arquivos = await varrerArquivos(TEMP_DIR);
  console.log(`📄 Total de arquivos no zip ${nomeZip}: ${arquivos.length}`);

  let sucessos = 0;
  let duplicados = 0;
  let naoIdentificados = 0;

  for (let idx = 0; idx < arquivos.length; idx++) {
    const absPath = arquivos[idx];
    const relPath = path.relative(TEMP_DIR, absPath).replace(/\\/g, "/");
    const nomeArquivo = path.basename(absPath);

    if (nomesExistentesSet.has(nomeArquivo.toLowerCase())) {
      duplicados++;
      if (idx % 20 === 0 || idx === arquivos.length - 1) {
        console.log(`⏩ [${idx + 1}/${arquivos.length}] Duplicatas evitadas no zip: ${relPath}`);
      }
      continue;
    }

    const r2Key = `${R2_PREFIX}/${nomeZip.replace(".zip", "")}/${relPath}`;
    const publicUrl = `${PUBLIC_URL}/${r2Key}`;

    let info = extrairNumeroAnoModalidade(nomeArquivo, relPath);
    if (!info && absPath.toLowerCase().endsWith(".pdf")) {
      try {
        const buffer = fs.readFileSync(absPath);
        const pdfData = await pdfParse(buffer);
        info = extrairNumeroAnoModalidade(nomeArquivo, relPath, pdfData.text.slice(0, 3000));
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
        console.error(`❌ Erro no upload R2 (${relPath}):`, e.message);
        continue;
      }
    }

    if (!info) {
      console.log(`⚠️ [${idx + 1}/${arquivos.length}] Subiu R2 mas NÃO IDENTIFICADO: ${relPath}`);
      fs.appendFileSync(RELATORIO_FILE, `[${nomeZip}] NÃO IDENTIFICADO: ${relPath}\n`, "utf-8");
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
      origem: "R2_BACKUP_ZIP",
    });

    if (!errDoc) {
      docsR2Set.add(r2Key);
      nomesExistentesSet.add(nomeArquivo.toLowerCase());
      sucessos++;
      console.log(`✅ [${idx + 1}/${arquivos.length}] Novo catalogado: ${relPath} -> Licitação ${info.numero} (${info.modalidade})`);

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

  // Limpar pasta temporária do zip para liberar espaço em disco
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  console.log(`📊 Resumo ${nomeZip} -> Sucessos: ${sucessos} | Duplicados evitados: ${duplicados} | Não Identificados: ${naoIdentificados}`);
}

async function main() {
  console.log("🚀 INICIANDO PROCESSAMENTO DE TODOS OS 23 ARQUIVOS ZIP DE LICITAÇÕES...");
  fs.writeFileSync(RELATORIO_FILE, "=== RELATÓRIO DE PENDÊNCIAS - ZIPS REMESSA LICITAÇÕES ===\n\n", "utf-8");

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

  const zips = fs.readdirSync(DOWNLOADS_DIR)
    .filter(f => f.startsWith("LICITAÇOES-20260701") && f.endsWith(".zip"))
    .sort();

  for (const zip of zips) {
    await processarLoteZip(zip, licsMap, docsR2Set, nomesExistentesSet);
  }

  console.log("\n🏁 TODOS OS 23 ZIPS DE LICITAÇÕES FORAM PROCESSADOS!");
  console.log(`📝 Relatório gerado em: ${RELATORIO_FILE}`);
}

main().catch(console.error);
