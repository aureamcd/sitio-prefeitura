import fs from "fs";
import path from "path";
import "dotenv/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// Configuração R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET || "transparencia";
const PUBLIC_DOMAIN = process.env.R2_PUBLIC_URL || "https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev";

// Configuração Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function uploadToR2(localPath: string, r2Key: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    })
  );
  const publicUrl = `${PUBLIC_DOMAIN}/${r2Key}`;
  console.log(` 🚀 Uploaded R2: ${publicUrl}`);
  return publicUrl;
}

async function run() {
  const folder = "C:/Users/Áurea Letícia/Downloads/Emendas_2024_2026_Extracted";
  console.log("=== SUBINDO E CADASTRANDO EMENDAS 2024 E 2026 ===");

  // 1. Upload dos arquivos de 2024
  console.log("\n--- UPLOAD R2: 2024 ---");
  const pdfEmenda2024 = await uploadToR2(path.join(folder, "EMENDA 2024 PADRE MARCOS.pdf"), "emendas/2024/emenda-202444960001-jussara-lima.pdf");
  const pdfExtrato2024 = await uploadToR2(path.join(folder, "EXTRATO EMENDA 2024.pdf"), "emendas/2024/extrato-emenda-202444960001.pdf");
  const pdfPlano2024 = await uploadToR2(path.join(folder, "PLANO DE TRABALHO.pdf"), "emendas/2024/plano-trabalho-202444960001.pdf");
  const pdfDados2024 = await uploadToR2(path.join(folder, "DADOS ORAMENTARIOS.pdf"), "emendas/2024/dados-orcamentarios-202444960001.pdf");

  // 2. Upload dos arquivos de 2026
  console.log("\n--- UPLOAD R2: 2026 ---");
  const pdfEmenda2026 = await uploadToR2(path.join(folder, "EMENDA 2026 PADRE MARCOS.pdf"), "emendas/2026/emenda-202641830004-marcelo-castro.pdf");
  const pdfExtrato2026 = await uploadToR2(path.join(folder, "EXTRATO 2026.pdf"), "emendas/2026/extrato-emenda-202641830004.pdf");
  const pdfPlano2026 = await uploadToR2(path.join(folder, "PLANO DE TRABALHO 2026.pdf"), "emendas/2026/plano-trabalho-202641830004.pdf");
  const pdfDados2026 = await uploadToR2(path.join(folder, "DADOS ORAMENTARIOS 2026.pdf"), "emendas/2026/dados-orcamentarios-202641830004.pdf");

  // 3. Cadastrar ou Atualizar Emenda 2024 no Supabase (apenas colunas existentes na tabela)
  console.log("\n--- CADASTRANDO EMENDA 2024 NO BANCO ---");
  const emenda2024Data = {
    ano: 2024,
    numero_emenda: "202444960001",
    parlamentar: "JUSSARA LIMA",
    beneficiario: "PREFEITURA MUNICIPAL DE PADRE MARCOS (CNPJ 06.553.788/0001-40)",
    valor_previsto: 250000,
    objeto: "Transferência Especial (Emenda PIX) - Contratação de atração artística / Despesa Corrente (Plano de Ação 09032024-064520)",
    pdf_url: pdfEmenda2024,
    raw_json: {
      plano_acao: "09032024-064520",
      modalidade: "Transferência Especial (Emenda PIX)",
      tipo: "Transferência Especial Federal (Emenda PIX)",
      esfera: "Federal",
      situacao: "Ciente",
      custeio: 250000,
      investimento: 0,
      valor_repassado: 250000,
      anexos: [
        { title: "Extrato da Emenda 2024", url: pdfExtrato2024 },
        { title: "Plano de Trabalho 2024", url: pdfPlano2024 },
        { title: "Dados Orçamentários 2024", url: pdfDados2024 },
      ]
    }
  };

  const { data: ex2024, error: err2024Sel } = await supabase.schema("transparencia").from("cadastro_emendas").select("id").eq("numero_emenda", "202444960001");
  if (ex2024 && ex2024.length > 0) {
    const { error } = await supabase.schema("transparencia").from("cadastro_emendas").update(emenda2024Data).eq("id", ex2024[0].id);
    if (error) console.error(" ❌ Erro ao atualizar 2024:", error.message);
    else console.log(" ✅ Emenda 2024 (Jussara Lima) atualizada!");
  } else {
    const { error } = await supabase.schema("transparencia").from("cadastro_emendas").insert([emenda2024Data]);
    if (error) console.error(" ❌ Erro ao inserir 2024:", error.message);
    else console.log(" ✅ Emenda 2024 (Jussara Lima) inserida com sucesso!");
  }

  // 4. Cadastrar ou Atualizar Emenda 2026 no Supabase (apenas colunas existentes na tabela)
  console.log("\n--- CADASTRANDO EMENDA 2026 NO BANCO ---");
  const emenda2026Data = {
    ano: 2026,
    numero_emenda: "202641830004",
    parlamentar: "MARCELO CASTRO",
    beneficiario: "PREFEITURA MUNICIPAL DE PADRE MARCOS (CNPJ 06.553.788/0001-40)",
    valor_previsto: 398000,
    objeto: "Transferência Especial (Emenda PIX) - Áreas de Lazer e Estruturas para Atividades Físicas em Espaços Públicos (Plano de Ação 09032026-096726)",
    pdf_url: pdfEmenda2026,
    raw_json: {
      plano_acao: "09032026-096726",
      modalidade: "Transferência Especial (Emenda PIX)",
      tipo: "Transferência Especial Federal (Emenda PIX)",
      esfera: "Federal",
      situacao: "Ciente",
      custeio: 0,
      investimento: 398000,
      valor_repassado: null,
      anexos: [
        { title: "Extrato da Emenda 2026", url: pdfExtrato2026 },
        { title: "Plano de Trabalho 2026", url: pdfPlano2026 },
        { title: "Dados Orçamentários 2026", url: pdfDados2026 },
      ]
    }
  };

  const { data: ex2026, error: err2026Sel } = await supabase.schema("transparencia").from("cadastro_emendas").select("id").eq("numero_emenda", "202641830004");
  if (ex2026 && ex2026.length > 0) {
    const { error } = await supabase.schema("transparencia").from("cadastro_emendas").update(emenda2026Data).eq("id", ex2026[0].id);
    if (error) console.error(" ❌ Erro ao atualizar 2026:", error.message);
    else console.log(" ✅ Emenda 2026 (Marcelo Castro) atualizada!");
  } else {
    const { error } = await supabase.schema("transparencia").from("cadastro_emendas").insert([emenda2026Data]);
    if (error) console.error(" ❌ Erro ao inserir 2026:", error.message);
    else console.log(" ✅ Emenda 2026 (Marcelo Castro) inserida com sucesso!");
  }

  console.log("\n✅ TODO O PROCESSO FOI CONCLUÍDO COM PERFEIÇÃO!");
}

run().catch(console.error);
