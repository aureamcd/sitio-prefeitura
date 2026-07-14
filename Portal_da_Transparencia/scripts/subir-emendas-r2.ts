import "dotenv/config";
import fs from "fs";
import path from "path";
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

const EXTRACTED_DIR = "C:\\Users\\Áurea Letícia\\Downloads\\WhatsApp_Emendas_Extracted";

async function main() {
  if (!fs.existsSync(EXTRACTED_DIR)) {
    console.error("❌ Pasta não encontrada:", EXTRACTED_DIR);
    return;
  }

  const files = fs.readdirSync(EXTRACTED_DIR).filter(f => f.toLowerCase().endsWith(".pdf"));
  console.log(`📁 Encontrados ${files.length} arquivos PDF para subir ao R2...`);

  // Buscar todas as emendas de 2025 no banco para fazer o vinculo
  const { data: emendas, error } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .select("*")
    .eq("ano", 2025);

  if (error || !emendas) {
    console.error("❌ Erro ao buscar emendas do banco:", error?.message);
    return;
  }

  for (const file of files) {
    const filePath = path.join(EXTRACTED_DIR, file);
    const fileBuffer = fs.readFileSync(filePath);
    
    // Nome limpo para o R2 (sem espaços estranhos)
    const cleanName = file
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_\-\.]/g, "");
    
    const r2Key = `emendas/2025/${cleanName}`;
    const fileUrl = `${PUBLIC_URL}/${r2Key}`;

    console.log(`\n📤 Subindo: ${file} -> ${r2Key}...`);
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: "application/pdf",
        })
      );
      console.log(`✅ Sucesso R2: ${fileUrl}`);

      // Identificar qual emenda corresponde a esse PDF
      // Checamos se algum numero_emenda do banco está contido no nome do arquivo
      const matchedEmenda = emendas.find(e => {
        if (!e.numero_emenda) return false;
        // ex: "36000665322202500" contido em "proposta-36000665322202500 PADRE MARCOS 500.pdf"
        // ou "09032025-077849" contido em "tes-plano-acao-09032025-077849.pdf"
        return file.includes(e.numero_emenda) || cleanName.includes(e.numero_emenda);
      });

      if (matchedEmenda) {
        console.log(`🔗 Vinculando à emenda nº ${matchedEmenda.numero_emenda} (${matchedEmenda.parlamentar})...`);
        const { error: updateErr } = await supabase
          .schema("transparencia")
          .from("cadastro_emendas")
          .update({ pdf_url: fileUrl })
          .eq("id", matchedEmenda.id);

        if (updateErr) {
          console.error(`❌ Erro no update do banco para ${matchedEmenda.numero_emenda}:`, updateErr.message);
        } else {
          console.log(`✅ Banco atualizado com sucesso para emenda nº ${matchedEmenda.numero_emenda}!`);
        }
      } else {
        console.log(`ℹ️ Arquivo ${file} não tem número exato no nome (ex: resumo ou geral), salvo no R2.`);
      }
    } catch (err: any) {
      console.error(`❌ Erro no upload de ${file}:`, err.message);
    }
  }

  console.log("\n🚀 Processo concluído com sucesso!");
}

main();
