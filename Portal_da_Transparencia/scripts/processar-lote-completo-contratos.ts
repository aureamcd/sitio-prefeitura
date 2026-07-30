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
const R2_PREFIX = "backup contratos";
const RELATORIO_FILE = path.join(process.cwd(), "relatorio-contratos-pendentes.txt");

function detectarTipoDocumentoContrato(nome: string): string {
  const n = nome.toUpperCase();
  if (n.includes("ADITIVO") || n.includes("PRORROGA")) return "Termo Aditivo";
  if (n.includes("RESCIS") || n.includes("DISTRATO")) return "Termo de Rescisão";
  if (n.includes("AVISO") || n.includes("PUBLICA")) return "Aviso";
  if (n.includes("APOSTILA")) return "Apostilamento";
  return "Contrato Original";
}

function extrairNumeroAnoContrato(nomeArquivo: string, caminhoRelativo: string, textoPdf?: string): { numero: string; ano: number } | null {
  const texto = `${caminhoRelativo} ${nomeArquivo} ${textoPdf || ""}`.toUpperCase();

  let m = texto.match(/(?:CONTRATO|CT|ADITIVO[\s\S]{0,25}?CONTRATO|RESCIS[ÃA]O[\s\S]{0,25}?CONTRATO)\s*(?:ADM[^\d]{0,10})?(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d|\d{2})/);
  if (!m) m = texto.match(/CONTRATO\s*(?:ADM[^\d]{0,10})?(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d|\d{2})/);
  if (!m) m = texto.match(/CT\s*(?:N[º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d|\d{2})/);
  if (!m) m = texto.match(/(201\d|202\d)\s*[\-\/\_]\s*(\d{1,4})/);

  if (m) {
    let numRaw: number, anoRaw: number;
    if (m[1].startsWith("201") || m[1].startsWith("202")) {
      anoRaw = parseInt(m[1], 10);
      numRaw = parseInt(m[2], 10);
    } else {
      numRaw = parseInt(m[1], 10);
      anoRaw = parseInt(m[2], 10);
      if (anoRaw < 100) anoRaw += 2000;
    }
    if (anoRaw >= 2010 && anoRaw <= 2030 && numRaw > 0 && numRaw < 10000) {
      return {
        numero: `${numRaw.toString().padStart(3, "0")}/${anoRaw}`,
        ano: anoRaw,
      };
    }
  }

  const mSimple = nomeArquivo.match(/^(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d)/);
  if (mSimple) {
    const numRaw = parseInt(mSimple[1], 10);
    const anoRaw = parseInt(mSimple[2], 10);
    return {
      numero: `${numRaw.toString().padStart(3, "0")}/${anoRaw}`,
      ano: anoRaw,
    };
  }

  return null;
}

async function varrerArquivos(dir: string): Promise<string[]> {
  const lista: string[] = [];
  const itens = fs.readdirSync(dir);
  for (const item of itens) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      lista.push(...(await varrerArquivos(full)));
    } else {
      const low = item.toLowerCase();
      if (low.endsWith(".pdf")) lista.push(full);
    }
  }
  return lista;
}

async function processarArquivoContrato(absPath: string, pastaBase: string, nomeLote: string, contsMap: Map<string, any>, docsR2Set: Set<string>, idx: number, total: number) {
  const relPath = path.relative(pastaBase, absPath).replace(/\\/g, "/");
  const nomeArquivo = path.basename(absPath);
  const r2Key = `${R2_PREFIX}/${nomeLote.replace(".zip", "")}/${relPath}`;
  const publicUrl = `${PUBLIC_URL}/${r2Key}`;

  let info = extrairNumeroAnoContrato(nomeArquivo, relPath);
  if (!info) {
    try {
      const buffer = fs.readFileSync(absPath);
      const pdfData = await pdfParse(buffer);
      info = extrairNumeroAnoContrato(nomeArquivo, relPath, pdfData.text.slice(0, 4000));
      if (info) console.log(`   📖 [Resgatado via texto PDF] ${relPath} -> Contrato nº ${info.numero}`);
    } catch (e) {}
  }

  if (!docsR2Set.has(r2Key)) {
    try {
      const fileBuffer = fs.readFileSync(absPath);
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: "application/pdf",
      }));
    } catch (e) {
      console.error(`❌ [${idx + 1}/${total}] Erro no upload R2 (${relPath}):`, e);
      return;
    }
  } else {
    console.log(`⏩ [${idx + 1}/${total}] Já no R2: ${relPath}`);
  }

  if (!info) {
    console.log(`⚠️ [${idx + 1}/${total}] R2 OK | NÃO IDENTIFICADO: ${relPath}`);
    fs.appendFileSync(RELATORIO_FILE, `[${nomeLote}] NÃO IDENTIFICADO: ${relPath}\n`, "utf-8");
    return;
  }

  const chave = `${info.numero}___${info.ano}`.toUpperCase();
  let contAlvo = contsMap.get(chave);

  if (!contAlvo) {
    const nClean = info.numero.replace(/^0+/, "");
    for (const [k, c] of contsMap.entries()) {
      if (c.ano === info.ano && (c.numero === info.numero || c.numero.replace(/^0+/, "") === nClean)) {
        contAlvo = c;
        contsMap.set(chave, contAlvo);
        break;
      }
    }
  }

  if (!contAlvo) {
    const novoCont = {
      numero: info.numero,
      ano: info.ano,
      origem: "HISTORICO_DRIVE",
      objeto: `Contrato Administrativo nº ${info.numero} - Município de Padre Marcos/PI.`,
      situacao: info.ano >= 2025 ? "Vigente" : "Concluído",
    };
    const { data: resIns, error: errIns } = await supabase.schema("transparencia").from("contratos_v2").insert(novoCont).select().single();
    if (resIns) {
      contAlvo = resIns;
      contsMap.set(chave, contAlvo);
    } else {
      fs.appendFileSync(RELATORIO_FILE, `[${nomeLote}] FALHA AO CRIAR CONTRATO: ${relPath} -> ${errIns?.message}\n`, "utf-8");
      return;
    }
  }

  const tipoDoc = detectarTipoDocumentoContrato(nomeArquivo);
  const { error: errDoc } = await supabase.schema("transparencia").from("contratos_documentos").insert({
    contrato_id: contAlvo.id,
    nome_arquivo: nomeArquivo,
    url_arquivo: publicUrl,
    caminho_r2: r2Key,
    tipo_documento: tipoDoc,
    origem: "R2_BACKUP",
  });

  if (errDoc) {
    console.log(`❌ [${idx + 1}/${total}] Falha ao linkar: ${relPath} (${errDoc.message})`);
    fs.appendFileSync(RELATORIO_FILE, `[${nomeLote}] FALHA AO LINKAR: ${relPath} -> ${errDoc.message}\n`, "utf-8");
  } else {
    docsR2Set.add(r2Key);
    console.log(`✅ [${idx + 1}/${total}] R2 + Banco OK: ${relPath} -> Contrato ${info.numero} (${tipoDoc})`);
  }
}

async function main() {
  console.log("🚀 INICIANDO PROCESSAMENTO EM LOTE DE CONTRATOS E ADITIVOS...");
  if (!fs.existsSync(DOWNLOADS_DIR)) return;

  fs.writeFileSync(RELATORIO_FILE, "=== RELATÓRIO GERAL DE PENDÊNCIAS E NÃO IDENTIFICADOS (CONTRATOS) ===\n\n", "utf-8");

  const { data: todosConts } = await supabase.schema("transparencia").from("contratos_v2").select("*");
  const contsMap = new Map<string, any>();
  (todosConts || []).forEach(c => {
    if (c.numero && c.ano) {
      const k = `${c.numero}___${c.ano}`.toUpperCase();
      contsMap.set(k, c);
    }
  });

  const { data: todosDocs } = await supabase.schema("transparencia").from("contratos_documentos").select("caminho_r2");
  const docsR2Set = new Set((todosDocs || []).map(d => d.caminho_r2));

  const itens = fs.readdirSync(DOWNLOADS_DIR).sort();

  for (const item of itens) {
    const absPath = path.join(DOWNLOADS_DIR, item);
    const low = item.toLowerCase();

    if (low.startsWith("contratos-20260701") && low.endsWith(".zip")) {
      const pastaExtraida = path.join(DOWNLOADS_DIR, item.replace(".zip", ""));
      if (!fs.existsSync(pastaExtraida)) {
        console.log(`\n📦 Descompactando ${item}... Aguarde...`);
        try {
          execSync(`powershell -Command "Expand-Archive -LiteralPath '${absPath}' -DestinationPath '${pastaExtraida}' -Force"`, { stdio: "inherit" });
        } catch (e) {
          console.error(`Erro ao descompactar ${item}:`, e);
          continue;
        }
      }
      console.log(`\n======================================================`);
      console.log(`📂 PROCESSANDO PASTA EXTRAÍDA: ${item}`);
      console.log(`======================================================`);
      const arquivos = await varrerArquivos(pastaExtraida);
      console.log(`📄 Total PDFs encontrados: ${arquivos.length}`);
      for (let i = 0; i < arquivos.length; i++) {
        await processarArquivoContrato(arquivos[i], pastaExtraida, item, contsMap, docsR2Set, i, arquivos.length);
      }
    } else if (fs.statSync(absPath).isDirectory() && (low.includes("contrato") || low.includes("aditivo"))) {
      console.log(`\n======================================================`);
      console.log(`📂 PROCESSANDO PASTA SOLTA: ${item}`);
      console.log(`======================================================`);
      const arquivos = await varrerArquivos(absPath);
      console.log(`📄 Total PDFs encontrados: ${arquivos.length}`);
      for (let i = 0; i < arquivos.length; i++) {
        await processarArquivoContrato(arquivos[i], absPath, item, contsMap, docsR2Set, i, arquivos.length);
      }
    } else if (low.endsWith(".pdf") && (low.includes("contrato") || low.includes("aditivo") || low.includes("rescis"))) {
      console.log(`\n📄 Processando PDF solto em Downloads: ${item}`);
      await processarArquivoContrato(absPath, DOWNLOADS_DIR, "Arquivos Soltos Downloads", contsMap, docsR2Set, 0, 1);
    }
  }

  console.log("\n🏁 PROCESSAMENTO DE CONTRATOS FINALIZADO COM SUCESSO!");
}

main().catch(console.error);
