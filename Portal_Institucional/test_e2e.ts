import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

async function runTests() {
  console.log("=== INICIANDO TESTE E2E (Licitações e Contratos) ===");

  const bucket = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET;

  // ---------------------------------------------------------
  // TESTE 1: LICITAÇÕES (Adicionar, Arquivo R2, Supabase, Apagar)
  // ---------------------------------------------------------
  console.log("\n-> Criando Licitação manual...");
  const { data: lic, error: errLic } = await supabase.schema("transparencia").from("licitacoes_v2").insert([{
    ano: 2026,
    numero: "TESTE-001/2026",
    objeto: "Objeto de Teste E2E",
    modalidade: "Pregão",
    situacao: "Em Andamento"
  }]).select().single();
  if (errLic) throw errLic;
  console.log("✅ Licitação criada:", lic.id);

  console.log("-> Fazendo upload de documento para R2...");
  const caminhoR2 = `licitacoes/2026/teste_e2e_${Date.now()}.pdf`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: caminhoR2,
    Body: Buffer.from("PDF Falso de Teste"),
    ContentType: "application/pdf"
  }));
  console.log("✅ Arquivo upado pro R2:", caminhoR2);

  console.log("-> Inserindo documento no Supabase...");
  const { data: docLic, error: errDocLic } = await supabase.schema("transparencia").from("licitacoes_documentos").insert([{
    licitacao_id: lic.id,
    tipo_documento: "Edital Teste",
    nome_arquivo: "teste.pdf",
    url_arquivo: `https://fake.url/${caminhoR2}`,
    caminho_r2: caminhoR2,
    tamanho: 1024
  }]).select().single();
  if (errDocLic) throw errDocLic;
  console.log("✅ Documento salvo no banco:", docLic.id);

  console.log("-> Apagando documento do R2 e do banco...");
  await supabase.schema("transparencia").from("licitacoes_documentos").delete().eq("id", docLic.id);
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: caminhoR2 }));
  console.log("✅ Documento excluído do R2 e do Supabase");

  console.log("-> Apagando Licitação...");
  await supabase.schema("transparencia").from("licitacoes_v2").delete().eq("id", lic.id);
  console.log("✅ Licitação apagada");

  // ---------------------------------------------------------
  // TESTE 2: CONTRATOS (Adicionar, Arquivo R2, Supabase, Apagar)
  // ---------------------------------------------------------
  console.log("\n-> Criando Contrato manual...");
  const { data: con, error: errCon } = await supabase.schema("transparencia").from("contratos_v2").insert([{
    ano: 2026,
    numero: "CT-TESTE-001/2026",
    contratado: "Empresa Teste E2E",
    objeto: "Objeto do contrato de teste",
    valor: 1500.00
  }]).select().single();
  if (errCon) throw errCon;
  console.log("✅ Contrato criado:", con.id);

  console.log("-> Fazendo upload de documento para R2...");
  const caminhoR2Con = `contratos/2026/teste_e2e_${Date.now()}.pdf`;
  await s3Client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: caminhoR2Con,
    Body: Buffer.from("PDF Falso de Teste Contrato"),
    ContentType: "application/pdf"
  }));
  console.log("✅ Arquivo upado pro R2:", caminhoR2Con);

  console.log("-> Inserindo documento no Supabase...");
  const { data: docCon, error: errDocCon } = await supabase.schema("transparencia").from("contratos_documentos").insert([{
    contrato_id: con.id,
    tipo_documento: "Contrato Teste",
    nome_arquivo: "teste_contrato.pdf",
    url_arquivo: `https://fake.url/${caminhoR2Con}`,
    caminho_r2: caminhoR2Con,
    tamanho: 2048
  }]).select().single();
  if (errDocCon) throw errDocCon;
  console.log("✅ Documento salvo no banco:", docCon.id);

  console.log("-> Apagando documento do R2 e do banco...");
  await supabase.schema("transparencia").from("contratos_documentos").delete().eq("id", docCon.id);
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: caminhoR2Con }));
  console.log("✅ Documento excluído do R2 e do Supabase");

  console.log("-> Apagando Contrato...");
  await supabase.schema("transparencia").from("contratos_v2").delete().eq("id", con.id);
  console.log("✅ Contrato apagado");

  console.log("\n🎉 TODOS OS TESTES E2E PASSARAM COM SUCESSO!");
}

runTests().catch(e => {
  console.error("❌ FALHA NO TESTE:", e);
  process.exit(1);
});
