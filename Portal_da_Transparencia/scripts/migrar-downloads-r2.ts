import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────────────────────────
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
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Caminhos ───────────────────────────────────────────────────────────────
const DOWNLOADS = "C:\\Users\\Áurea Letícia\\Downloads";

// ─── Main ───────────────────────────────────────────────────────────────────
interface ItemMigracao {
  filePath: string;
  tipo: string;
  titulo: string;
  exercicio: number;
  ordem: number;
  categoria: string;
}

async function main() {
  const itens: ItemMigracao[] = [];

  // ── RREO-2026 ──────────────────────────────────────────────────────────
  const rreoDir = path.join(DOWNLOADS, "RREO-2026");
  if (fs.existsSync(rreoDir)) {
    const files = fs.readdirSync(rreoDir).filter(f => f.endsWith(".pdf"));
    console.log(`📁 RREO-2026: ${files.length} arquivos`);
    for (const file of files) {
      const titulo = file.replace(".pdf", "");
      itens.push({
        filePath: path.join(rreoDir, file),
        tipo: "RREO",
        titulo: `RREO — ${titulo}`,
        exercicio: 2026,
        ordem: 1,
        categoria: "PRESTACAO_CONTAS",
      });
    }
  }

  // ── Balanço Geral 2023 ─────────────────────────────────────────────────
  const balancoDir = path.join(DOWNLOADS, "balanço geral", "2023");
  if (fs.existsSync(balancoDir)) {
    const files = fs.readdirSync(balancoDir).filter(f => f.endsWith(".pdf"));
    console.log(`📁 Balanço Geral 2023: ${files.length} arquivos`);
    for (const file of files) {
      const titulo = file.replace(".pdf", "");
      itens.push({
        filePath: path.join(balancoDir, file),
        tipo: "BALANCO_GERAL",
        titulo: `Balanço Geral 2023 — ${titulo}`,
        exercicio: 2023,
        ordem: 1,
        categoria: "PRESTACAO_CONTAS",
      });
    }
  }

  if (itens.length === 0) {
    console.log("❌ Nenhum arquivo encontrado para migrar.");
    return;
  }

  console.log(`\n🚀 Iniciando migração de ${itens.length} arquivos...\n`);

  let enviados = 0;
  let cadastrados = 0;
  let erros = 0;

  for (const item of itens) {
    const fileName = path.basename(item.filePath);
    const safeName = fileName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const r2Key = `planejamento/${item.exercicio}/${item.tipo}/${safeName}`;
    const arquivoUrl = `${PUBLIC_URL}/${r2Key}`;

    console.log(`📄 ${item.titulo}`);

    // 1. Upload para R2
    try {
      const fileBuffer = fs.readFileSync(item.filePath);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: "application/pdf",
        })
      );
      console.log(`   ☁️  R2 OK (${(fileBuffer.length / 1024).toFixed(0)} KB)`);
      enviados++;
    } catch (err: any) {
      console.error(`   ❌ Erro R2: ${err.message}`);
      erros++;
      continue;
    }

    // 2. Cadastro no Supabase
    try {
      const { error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          categoria: item.categoria,
          tipo: item.tipo,
          titulo: item.titulo,
          exercicio: item.exercicio,
          descricao: `Documento de prestação de contas do exercício ${item.exercicio}.`,
          data_publicacao: `${item.exercicio}-01-01`,
          arquivo_url: arquivoUrl,
          arquivo_nome: safeName,
          ativo: true,
          ordem: item.ordem,
        });

      if (error) {
        console.error(`   ❌ Supabase: ${error.message}`);
        if (error.message.includes("chk_tipo")) {
          console.error(`   ⚠️  Constraint chk_tipo — tipo '${item.tipo}' não permitido`);
        }
        erros++;
      } else {
        console.log(`   🗄️  Supabase OK`);
        cadastrados++;
      }
    } catch (err: any) {
      console.error(`   ❌ Erro Supabase: ${err.message}`);
      erros++;
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("📊 RESUMO DA MIGRAÇÃO:");
  console.log(`   ☁️  Enviados p/ R2: ${enviados}`);
  console.log(`   🗄️  Cadastrados no BD: ${cadastrados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log("═══════════════════════════════════════\n");
}

main().catch(console.error);
