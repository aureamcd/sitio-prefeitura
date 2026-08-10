import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const uploadToR2 = async (filePath: string, fileName: string, year: string) => {
  const fileContent = fs.readFileSync(filePath);
  const key = `planejamento/${year}/rgf/${fileName}`;
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: fileContent,
    ContentType: 'application/pdf',
  });
  await r2.send(command);
  return `${process.env.R2_PUBLIC_URL}/${key}`;
};

async function main() {
  const dirPath = 'C:/Users/Áurea Letícia/Downloads/rgf';
  if (!fs.existsSync(dirPath)) {
    console.error('Directory not found:', dirPath);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDFs to upload...`);

  let count = 0;
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    
    // Extrai ano do nome do arquivo
    // Exemplo: DM_4736_491_Padre_Marcos_LRF_RGF_1_Semestre_2022_ANEXO_05_DISPONIBILIDADE_pag_520.pdf
    const yearMatch = file.match(/(20\d{2})/);
    const year = yearMatch ? yearMatch[1] : '2022';
    
    // Tenta montar um título bonito
    let title = file.replace(/\.pdf$/i, '').replace(/_/g, ' ');
    // Se tiver "LRF RGF", limpa o começo do DM_XXXX...
    if (title.includes('LRF RGF')) {
      title = title.substring(title.indexOf('LRF RGF'));
    }

    console.log(`Uploading ${file} (${count + 1}/${files.length})...`);
    
    try {
      const url = await uploadToR2(filePath, file, year);
      
      const doc = {
        categoria: 'PRESTACAO_CONTAS',
        subcategoria: 'RGF',
        tipo: 'RGF',
        exercicio: parseInt(year, 10),
        periodo: title.includes('1 Semestre') ? '1º Semestre' : (title.includes('2 Semestre') ? '2º Semestre' : null),
        titulo: title,
        descricao: `Relatório de Gestão Fiscal (${year})`,
        arquivo_url: url,
        arquivo_nome: file,
        data_publicacao: `${year}-12-31`,
        ativo: true
      };

      const { error } = await supabase.schema('transparencia').from('planejamento_documentos').insert([doc]);
      if (error) {
        console.error(`Error inserting ${file}:`, error.message);
      } else {
        count++;
      }
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }

  console.log(`Done! Successfully processed ${count} files.`);
}

main().catch(console.error);
