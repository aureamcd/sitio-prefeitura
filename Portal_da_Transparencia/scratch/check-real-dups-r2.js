const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;

async function checkDups(year) {
  console.log(`\nVerificando duplicatas reais no R2 para o ano ${year}...`);
  const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero').eq('ano', year);
  const cIds = contratos.map(c => c.id);

  const { data: documentos } = await supabase.schema('transparencia')
      .from('contratos_documentos')
      .select('*')
      .in('contrato_id', cIds);

  const byContract = {};
  for (const doc of documentos) {
      if (!byContract[doc.contrato_id]) byContract[doc.contrato_id] = [];
      byContract[doc.contrato_id].push(doc);
  }

  let dupCount = 0;

  for (const contractId of Object.keys(byContract)) {
      const docs = byContract[contractId];
      if (docs.length > 1) {
          
          for (const doc of docs) {
              if (doc.caminho_r2) {
                  try {
                      const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: doc.caminho_r2 }));
                      doc.realSize = head.ContentLength;
                  } catch (e) {
                      doc.realSize = -1; 
                  }
              } else {
                  doc.realSize = -2;
              }
          }

          const bySize = {};
          for (const doc of docs) {
              if (doc.realSize > 0) {
                  if (!bySize[doc.realSize]) bySize[doc.realSize] = [];
                  bySize[doc.realSize].push(doc);
              }
          }

          for (const size in bySize) {
              const dupGroup = bySize[size];
              if (dupGroup.length > 1) {
                  console.log(`\n⚠️ Contrato ${contractId} tem anexos idênticos (Tamanho: ${size} bytes) com nomes:`);
                  dupGroup.forEach(d => console.log(`  - ${d.nome_arquivo}`));
                  dupCount++;
              }
          }
      }
  }
  
  if (dupCount === 0) {
      console.log(`✅ Nenhum anexo com conteúdo idêntico encontrado para ${year}!`);
  }
}

async function run() {
  await checkDups(2017);
  await checkDups(2018);
}
run();
