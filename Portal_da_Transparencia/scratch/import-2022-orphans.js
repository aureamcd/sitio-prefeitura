const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require('crypto');

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

const DIR = 'C:\\Users\\Áurea Letícia\\Desktop\\contratos\\Contratos\\2022';
const BUCKET = process.env.R2_BUCKET;

function extractNumber(name) {
  const n = name.toLowerCase();
  if (n.includes('aditivo') || n.includes('rescisão') || n.includes('dispensa') || n.includes('errata') || n.includes('extrato')) return null;
  
  // Pegar números no começo: "35-2022...", "018-A-2022...", "40 A - 2022"
  let m = name.match(/^0*(\d+)(?:\s*-?\s*[a-z])?(?:\s*-?\s*2022)/i);
  if (m) return m[1];
  
  // "CONTRATO Nº 05-2022" -> 5
  m = name.match(/Nº\s*0*(\d+)-2022/i);
  if (m) return m[1];
  
  return null;
}

async function run() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.pdf'));
  const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('*').eq('ano', 2022);
  
  for (const file of files) {
    const num = extractNumber(file);
    if (num) {
      const base = parseInt(num, 10);
      const possible = contratos.filter(c => {
        const cm = c.numero.match(/\d+/);
        return cm && parseInt(cm[0], 10) === base;
      });
      
      if (possible.length === 1) {
        const contrato = possible[0];
        console.log(`✅ Associando "${file}" ao contrato ${contrato.numero} (ID: ${contrato.id})`);
        
        const fileContent = fs.readFileSync(path.join(DIR, file));
        const ext = path.extname(file);
        const fileNameToSave = `${crypto.randomUUID()}${ext}`;
        const caminhoR2 = `contratos/2022/${fileNameToSave}`;
        
        await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: caminhoR2, Body: fileContent, ContentType: 'application/pdf' }));
        await supabase.schema('transparencia').from('contratos_documentos').insert({ contrato_id: contrato.id, nome_arquivo: file, caminho_r2: caminhoR2 });
        
        fs.unlinkSync(path.join(DIR, file));
        console.log(`   -> Upload OK e arquivo apagado.`);
      } else if (possible.length > 1) {
        console.log(`⚠️ Múltiplos contratos encontrados para base ${base} no arquivo "${file}". Ignorando para segurança.`);
      } else {
        console.log(`❌ Nenhum contrato encontrado para base ${base} no arquivo "${file}".`);
      }
    }
  }
}
run();
