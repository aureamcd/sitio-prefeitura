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
  const files = [
    'C:/Users/Áurea Letícia/Downloads/DM_4915_278_Padre_Marcos_Edital_Chamamento_Publico_002-23_SEMCULT_pag_73.pdf',
    'C:/Users/Áurea Letícia/Downloads/DM_4916_241_Padre_Marcos_Edital_Chamamento_Publico_001-23_SEMCULT_pag_188.pdf',
    'C:/Users/Áurea Letícia/Downloads/DM_5536_440_Padre_Marcos_Edital_Chamamento_Publico_001-26_pag_307.pdf',
    'C:/Users/Áurea Letícia/Downloads/DM_5558_469_Padre_Marcos_Edital_Chamamento_Publico_002-26_PNAB_pag_67.pdf'
  ];
  
  const results = [];
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    console.log(`Uploading ${fileName}...`);
    const url = await uploadToR2(filePath, fileName);
    
    results.push({
      fileName,
      url
    });
  }

  console.log('Uploads complete. JSON:', JSON.stringify(results, null, 2));
}

main().catch(console.error);
