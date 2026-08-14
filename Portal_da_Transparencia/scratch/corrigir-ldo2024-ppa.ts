/**
 * Corrige:
 * 1. LDO 2024 → usa o mesmo PDF do LDO 2025 (Lei 769-2024 - LDO 2025.pdf)
 * 2. Alteração do PPA 2022-2025 (exercício 2022) → usa Lei 778-2024
 * 3. PPA 2022-2025 disponível para os exercícios 2023, 2024 e 2025
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
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

const DIR = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch/wa-prestacao";
const PPA_PLAN_R2 = "planejamento/2022/PPA/plano-plurianual-ppa-2022-2025.pdf"; // já existe (5 MB)

async function upload(local: string, r2Path: string) {
  const full = path.join(DIR, local);
  if (!fs.existsSync(full)) {
    console.log(`  ⚠️ LOCAL NÃO ENCONTRADO: ${local}`);
    return;
  }
  const data = fs.readFileSync(full);
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Path,
      Body: data,
      ContentType: "application/pdf",
    })
  );
  console.log(`  ✅ ${local} (${(data.length / 1024 / 1024).toFixed(1)} MB) → ${r2Path}`);
}

async function main() {
  // ── 1) LDO 2024: mesmo PDF do LDO 2025 ──
  console.log("=== 1) LDO 2024 = mesmo PDF do LDO 2025 ===\n");
  await upload("Lei 769-2024 - LDO 2025.pdf", "planejamento/2024/LDO/lei-de-diretrizes-orcamentarias-ldo-2024.pdf");

  // ── 2) Alteração do PPA 2022-2025 (2022): Lei 778-2024 ──
  console.log("\n=== 2) Alteração do PPA 2022-2025 (exercício 2022) ===\n");
  await upload("Lei 778-2024 - Alterao PPA 22-25.pdf", "planejamento/2022/PPA/lei-de-alteracao-do-plano-plurianual-2022-2025.pdf");

  // ── 3) PPA 2022-2025 para exercícios 2023, 2024, 2025 ──
  console.log("\n=== 3) PPA 2022-2025 para anos 2023/2024/2025 ===\n");
  const urlPPA = `${PUBLIC_URL}/${PPA_PLAN_R2}`;
  for (const ano of [2023, 2024, 2025]) {
    const { data: existentes } = await supabase
      .schema("transparencia")
      .from("planejamento_documentos")
      .select("id, titulo")
      .eq("tipo", "PPA")
      .eq("exercicio", ano)
      .eq("ativo", true);
    const jaTemPlano = (existentes || []).some((e: any) => /plurianual/i.test(e.titulo) && !/altera/i.test(e.titulo));
    if (jaTemPlano) {
      console.log(`  ℹ️  ${ano}: já existe Plano Plurianual no banco — ok`);
    } else {
      const { data: ins, error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          titulo: "Plano Plurianual (PPA) 2022–2025",
          descricao: "Plano Plurianual do Município de Padre Marcos para o quadriênio 2022–2025.",
          tipo: "PPA",
          categoria: "PLANEJAMENTO_ORCAMENTARIO",
          exercicio: ano,
          ordem: 1,
          ativo: true,
          data_publicacao: `${ano}-01-01`,
          arquivo_url: urlPPA,
          arquivo_nome: "plano-plurianual-ppa-2022-2025.pdf",
        })
        .select("id, titulo, exercicio, arquivo_url");
      if (error) {
        console.log(`  ❌ ${ano}: ${error.message}`);
      } else {
        console.log(`  ✅ ${ano}: ${JSON.stringify(ins)}`);
      }
    }
  }

  // ── Verificação final ──
  console.log("\n=== VERIFICAÇÃO: registros PPA/LDO anos anteriores ===\n");
  const { data } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio, ordem, ativo, arquivo_url")
    .in("tipo", ["PPA", "LDO", "LOA"])
    .lte("exercicio", 2025)
    .order("exercicio", { ascending: false });
  (data || []).forEach((d: any) => {
    console.log(`${d.exercicio} | ${d.titulo} | ativo=${d.ativo}`);
  });
}

main();
