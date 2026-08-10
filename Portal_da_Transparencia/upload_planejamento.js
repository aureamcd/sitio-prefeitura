require('dotenv').config({ path: '.env' });
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadFile(filePath, destPath) {
  const fileStream = fs.createReadStream(filePath);
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: destPath,
    Body: fileStream,
    ContentType: 'application/pdf',
  });
  await s3.send(command);
  return `${process.env.R2_PUBLIC_URL}/${destPath}`;
}

async function run() {
  const files = [
    {
      tipo: 'PPA',
      titulo: 'Plano Plurianual (PPA) 2026–2029',
      descricao: 'Plano Plurianual do Município de Padre Marcos para o quadriênio 2026–2029.',
      local: 'C:\\Users\\Áurea Letícia\\Downloads\\PPA\\ppa-2026-2029-completo.pdf',
      r2Path: 'planejamento/2026/PPA/ppa-2026-2029-completo.pdf'
    },
    {
      tipo: 'LDO',
      titulo: 'Lei de Diretrizes Orçamentárias (LDO) 2026',
      descricao: 'Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2026.',
      local: 'C:\\Users\\Áurea Letícia\\Downloads\\ldo\\lei-ldo-2026.pdf',
      r2Path: 'planejamento/2026/LDO/lei-ldo-2026.pdf'
    },
    {
      tipo: 'LOA',
      titulo: 'Lei Orçamentária Anual (LOA) 2026',
      descricao: 'Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2026.',
      local: 'C:\\Users\\Áurea Letícia\\Downloads\\loa\\lei-loa-2026.pdf',
      r2Path: 'planejamento/2026/LOA/lei-loa-2026.pdf'
    }
  ];

  for (const f of files) {
    console.log(`Uploading ${f.tipo}...`);
    try {
      // const publicUrl = await uploadFile(f.local, f.r2Path);
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${f.r2Path}`;
      console.log(`URL: ${publicUrl}`);
      
      // Insert na tabela
      const { data, error } = await supabase.schema('transparencia').from('planejamento_documentos').insert({
        categoria: 'PLANEJAMENTO_ORCAMENTARIO',
        tipo: f.tipo,
        exercicio: 2026,
        titulo: f.titulo,
        descricao: f.descricao,
        arquivo_url: publicUrl,
        arquivo_nome: path.basename(f.local),
        data_publicacao: '2026-06-16', // Mesma data do PPA anterior
        ordem: 1,
        ativo: true
      });
      
      if (error) {
        console.error(`Error saving to DB for ${f.tipo}:`, error);
      } else {
        console.log(`Saved to DB for ${f.tipo}!`);
      }
    } catch (e) {
      console.error(`Failed to process ${f.tipo}:`, e);
    }
  }
}

run();
