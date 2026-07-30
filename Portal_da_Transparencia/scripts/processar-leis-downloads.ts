import "dotenv/config";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

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
const TEMP_DIR = path.join(DOWNLOADS_DIR, "_temp_leis_zip");
const R2_PREFIX = "legislacoes";

function detectarTipoLei(nome: string): string {
  const n = nome.toUpperCase();
  if (n.includes("DECRETO")) return "Decreto";
  if (n.includes("PORTARIA")) return "Portaria";
  if (n.includes("RESOLU")) return "Resolução";
  if (n.includes("INSTRU")) return "Instrução Normativa";
  if (n.includes("REGIMENTO")) return "Regimento";
  return "Lei";
}

function extrairInfoLei(nomeArquivo: string, relPath: string): { numero: string; ano: number; tipo: string; titulo: string } {
  const tipo = detectarTipoLei(nomeArquivo);
  const limpo = nomeArquivo.replace(/\.pdf$/i, "").trim();

  // Tentar extrair número e ano (ex: "Lei 788-2025" ou "Lei nº 833-2026" ou "788-2025")
  const m = limpo.match(/(?:LEI|DECRETO|PORTARIA|RESOLU[ÇC][ÃA]O)?\s*(?:[Nn][º°.]?\s*)?(\d{1,4})\s*[\-\/\_]\s*(201\d|202\d|\d{2})/i);
  let ano = 2026;
  let numero = "";

  if (m) {
    numero = m[1];
    let a = parseInt(m[2], 10);
    if (a < 100) a += 2000;
    ano = a;
  } else {
    // Tentar achar ano no caminho ou nome
    const mAno = `${relPath} ${nomeArquivo}`.match(/(201\d|202\d)/);
    if (mAno) ano = parseInt(mAno[1], 10);
  }

  let titulo = limpo.replace(/_/g, " ");
  if (!titulo.toLowerCase().startsWith(tipo.toLowerCase())) {
    titulo = `${tipo} ${titulo}`;
  }

  return { numero, ano, tipo, titulo };
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
      if (item.toLowerCase().endsWith(".pdf")) lista.push(full);
    }
  }
  return lista;
}

async function processarArquivoLei(absPath: string, relPath: string, leisExistentesSet: Set<string>, nomesExistentesSet: Set<string>): Promise<boolean> {
  const nomeArquivo = path.basename(absPath);
  const lowNome = nomeArquivo.toLowerCase();

  // Evitar duplicata por nome exato do arquivo
  if (nomesExistentesSet.has(lowNome)) {
    return false;
  }

  const info = extrairInfoLei(nomeArquivo, relPath);
  
  // Chave anti-duplicata no banco por Tipo + Número + Ano
  if (info.numero) {
    const chave = `${info.tipo}___${info.numero}___${info.ano}`.toLowerCase();
    if (leisExistentesSet.has(chave)) {
      return false;
    }
  }

  const r2Key = `${R2_PREFIX}/${info.ano}/${Date.now()}-${nomeArquivo.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const publicUrl = `${PUBLIC_URL}/${r2Key}`;

  try {
    const buffer = fs.readFileSync(absPath);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: "application/pdf",
    }));

    const { error } = await supabase.from("legislacoes").insert([{
      titulo: info.titulo,
      numero: info.numero || null,
      ano: info.ano,
      tipo: info.tipo,
      data_publicacao: `${info.ano}-01-01`,
      arquivo_r2_url: publicUrl,
      arquivo_nome: nomeArquivo,
      arquivo_tamanho: buffer.length,
      arquivo_extensao: "pdf",
      publicado: true,
      slug: `lei-${Date.now()}-${Math.floor(Math.random()*1000)}`
    }]);

    if (!error) {
      nomesExistentesSet.add(lowNome);
      if (info.numero) {
        leisExistentesSet.add(`${info.tipo}___${info.numero}___${info.ano}`.toLowerCase());
      }
      console.log(`✅ Sucesso: [${info.tipo} ${info.numero || ""}/${info.ano}] ${info.titulo}`);
      return true;
    } else {
      console.error(`❌ Erro banco (${nomeArquivo}):`, error.message);
    }
  } catch (e: any) {
    console.error(`❌ Erro upload R2 (${nomeArquivo}):`, e.message);
  }
  return false;
}

async function main() {
  console.log("🚀 INICIANDO IMPORTAÇÃO DE LEIS (COM PROTEÇÃO ANTI-DUPLICATA)...");

  const { data: todasLeis } = await supabase.from("legislacoes").select("numero, ano, tipo, arquivo_nome, titulo");
  const leisExistentesSet = new Set<string>();
  const nomesExistentesSet = new Set<string>();

  (todasLeis || []).forEach(l => {
    if (l.arquivo_nome) nomesExistentesSet.add(l.arquivo_nome.toLowerCase());
    if (l.titulo) nomesExistentesSet.add(l.titulo.toLowerCase() + ".pdf");
    if (l.numero && l.ano && l.tipo) {
      leisExistentesSet.add(`${l.tipo}___${l.numero}___${l.ano}`.toLowerCase());
    }
  });

  console.log(`📚 Banco atual: ${todasLeis?.length || 0} legislações cadastradas.`);

  let sucessos = 0;
  let duplicados = 0;

  // 1. Processar pasta "LEIS QUE AINDA FALTAM"
  const pastaFaltam = path.join(DOWNLOADS_DIR, "LEIS", "LEIS QUE AINDA FALTAM");
  if (fs.existsSync(pastaFaltam)) {
    console.log(`\n📂 Varrindo pasta 'LEIS QUE AINDA FALTAM'...`);
    const arquivos = await varrerArquivos(pastaFaltam);
    for (const arq of arquivos) {
      const res = await processarArquivoLei(arq, path.basename(arq), leisExistentesSet, nomesExistentesSet);
      if (res) sucessos++; else duplicados++;
    }
  }

  // 2. Processar arquivos soltos de leis em Downloads
  const itensDownloads = fs.readdirSync(DOWNLOADS_DIR);
  for (const item of itensDownloads) {
    const low = item.toLowerCase();
    if ((low.startsWith("lei") || low.startsWith("decreto")) && low.endsWith(".pdf")) {
      const absPath = path.join(DOWNLOADS_DIR, item);
      const res = await processarArquivoLei(absPath, item, leisExistentesSet, nomesExistentesSet);
      if (res) sucessos++; else duplicados++;
    }
  }

  // 3. Processar ZIP "LEIS-20260702T203700Z-3-001.zip" ou similares
  const zipsLeis = fs.readdirSync(DOWNLOADS_DIR).filter(f => f.startsWith("LEIS-") && f.endsWith(".zip"));
  for (const zip of zipsLeis) {
    console.log(`\n📦 Varrindo arquivo ZIP: ${zip}...`);
    const zipPath = path.join(DOWNLOADS_DIR, zip);
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    
    try {
      execSync(`powershell -Command "Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${TEMP_DIR}' -Force"`, { stdio: "inherit" });
      const arqZip = await varrerArquivos(TEMP_DIR);
      console.log(`📄 Encontrados ${arqZip.length} PDFs no zip.`);
      for (const arq of arqZip) {
        const rel = path.relative(TEMP_DIR, arq).replace(/\\/g, "/");
        const res = await processarArquivoLei(arq, rel, leisExistentesSet, nomesExistentesSet);
        if (res) sucessos++; else duplicados++;
      }
    } catch (e: any) {
      console.error(`Erro ao descompactar ${zip}:`, e.message);
    } finally {
      if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  }

  console.log(`\n🏁 IMPORTAÇÃO DE LEIS CONCLUÍDA!`);
  console.log(`📊 Novas Leis adicionadas: ${sucessos} | Duplicatas evitadas: ${duplicados}`);
}

main().catch(console.error);
