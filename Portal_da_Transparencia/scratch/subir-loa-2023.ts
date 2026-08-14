/**
 * Sobe a LOA 2023 (Lei 736/2022) para o R2 e atualiza o registro vazio.
 * Também confirma que a LDO 2025/2024 estão apontando para o arquivo correto.
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

async function main() {
  // ── 1) LOA 2023: upload + link ──
  console.log("=== 1) LOA 2023 (Lei 736/2022) ===\n");
  const localLOA = "C:/Users/Áurea Letícia/Downloads/LEI Nº 736-2022 LOA 2023 (1).pdf";
  const r2PathLOA = "planejamento/2023/LOA/lei-736-2022-loa-2023.pdf";
  const data = fs.readFileSync(localLOA);
  console.log(`Local: ${(data.length / 1024 / 1024).toFixed(1)} MB`);
  await r2.send(
    new PutObjectCommand({ Bucket: BUCKET, Key: r2PathLOA, Body: data, ContentType: "application/pdf" })
  );
  console.log(`✅ Upload: ${r2PathLOA}`);
  const urlLOA = `${PUBLIC_URL}/${r2PathLOA}`;

  // Atualiza o registro da LOA 2023 (id 8e0f9ae7)
  const { data: upd, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .update({
      arquivo_url: urlLOA,
      arquivo_nome: "LEI Nº 736-2022 LOA 2023.pdf",
      titulo: "Lei Orçamentária Anual (LOA) 2023",
      descricao: "Lei nº 736/2022 — Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2023.",
      ativo: true,
    })
    .eq("id", "8e0f9ae7-5645-49c6-9d85-6884eeddacea")
    .select("id, titulo, ativo, arquivo_url");
  if (error) {
    console.log("❌ ERRO ao atualizar:", error.message);
  } else {
    console.log("✅ Registro atualizado:", JSON.stringify(upd));
  }

  // ── 2) Confirma LDO 2025/2024 ──
  console.log("\n=== 2) LDO 2025 e 2024 (Lei 769/2024) ===\n");
  const { data: ldos } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, exercicio, ativo, arquivo_url")
    .eq("tipo", "LDO")
    .in("exercicio", [2024, 2025])
    .eq("ativo", true);
  (ldos || []).forEach((d: any) => {
    console.log(`${d.exercicio} | ${d.titulo} | ${d.arquivo_url}`);
  });

  // ── 3) Verificação no R2 ──
  console.log("\n=== 3) Verificação no R2 ===\n");
  for (const [label, path] of [["LOA 2023", r2PathLOA], ["LDO 2025", "planejamento/2025/LDO/lei-de-diretrizes-orcamentarias-ldo-2025.pdf"], ["LDO 2024", "planejamento/2024/LDO/lei-de-diretrizes-orcamentarias-ldo-2024.pdf"]] as [string, string][]) {
    try {
      const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: path }));
      console.log(`✅ ${label}: ${head.ContentLength} bytes`);
    } catch (e: any) {
      console.log(`❌ ${label}: ${e.message}`);
    }
  }
}

main();
