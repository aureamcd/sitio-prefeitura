import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/.env' });

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const uploadToR2 = async (filePath: string, fileName: string) => {
  const fileContent = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: `renuncias/${fileName}`,
    Body: fileContent,
    ContentType: 'application/pdf',
  });
  await r2.send(command);
  return `${process.env.R2_PUBLIC_URL}/renuncias/${fileName}`;
};

async function main() {
  const folder = 'C:\\Users\\Áurea Letícia\\Downloads\\WhatsApp_Unknown_20260808';
  const files = fs.readdirSync(folder).filter(f => f.endsWith('.pdf'));
  
  const results = [];
  for (const file of files) {
    console.log(`Uploading ${file}...`);
    const url = await uploadToR2(path.join(folder, file), file);
    
    // Determine year from filename
    let year = 2026;
    if (file.includes('001-20') || file.includes('02-20') || file.includes('03-20')) year = 2020;
    if (file.includes('001-22')) year = 2022;
    if (file.includes('001-25')) year = 2025;

    results.push({
      id: `whatsapp-${file.replace('.pdf', '')}`,
      projeto: file.replace(/_/g, ' ').replace('.pdf', ''),
      area: 'cultura',
      beneficiario: 'Agentes Culturais',
      tipo_incentivo: 'patrocinio_abatimento',
      valor_beneficio: 0,
      fundamento_legal: 'Lei Aldir Blanc / Cultura',
      ano: year,
      arquivo: url
    });
  }

  console.log('Uploads complete. JSON:', JSON.stringify(results, null, 2));
}

main().catch(console.error);
