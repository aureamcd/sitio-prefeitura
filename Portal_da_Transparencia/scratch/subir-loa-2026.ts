/**
 * Sobe a Lei 795-2025 LOA 2026 (dos Downloads) para o R2 e atualiza o
 * registro ativo da LOA 2026 no banco para apontar para o novo arquivo.
 */
import "dotenv/config";
import fs from "fs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const r2 = new S3Client({
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

const ARQUIVO_LOCAL = "C:/Users/Áurea Letícia/Downloads/Lei 795-2025 LOA 2026.pdf";
const R2_PATH = "planejamento/2026/LOA/lei-795-2025-loa-2026.pdf";
const RECORD_ID = "1b49bf81-82d9-4355-9d62-9a49eb58a52c"; // registro ativo da LOA 2026

async function main() {
  // 1) Upload
  console.log("=== 1) Subindo Lei 795-2025 LOA 2026 para o R2 ===\n");
  const data = fs.readFileSync(ARQUIVO_LOCAL);
  console.log(`Local: ${(data.length / 1024 / 1024).toFixed(1)} MB`);
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: R2_PATH,
      Body: data,
      ContentType: "application/pdf",
    })
  );
  console.log(`✅ Upload: ${R2_PATH}`);

  const novaUrl = `${PUBLIC_URL}/${R2_PATH}`;

  // 2) Atualizar registro ativo
  console.log("\n=== 2) Atualizando registro ativo da LOA 2026 ===\n");
  const { data: upd, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .update({
      arquivo_url: novaUrl,
      arquivo_nome: "Lei 795-2025 LOA 2026.pdf",
      titulo: "Lei Orçamentária Anual (LOA) 2026",
      descricao: "Lei nº 795/2025 — Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2026.",
    })
    .eq("id", RECORD_ID)
    .select("id, titulo, arquivo_url");
  if (error) {
    console.log("❌ ERRO:", error.message);
  } else {
    console.log("✅ Atualizado:", JSON.stringify(upd));
  }

  // 3) Verificação
  console.log("\n=== 3) Verificação no R2 ===\n");
  const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: R2_PATH }));
  console.log(`R2: ${head.ContentLength} bytes`);
  const cl = (await fetch(novaUrl, { method: "HEAD" })).headers.get("content-length");
  console.log(`URL pública: ${cl} bytes`);
}

main();
