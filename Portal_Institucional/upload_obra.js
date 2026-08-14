const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const R2_ACCOUNT_ID = 'ba2e4f21fa0a5632cab85d0b6314bc24';
const R2_ACCESS_KEY_ID = '08246705094cfe277f6fb98616e73051';
const R2_SECRET_ACCESS_KEY = '7c44229029fa9c8ed8b7d479f3122e565698fa4795d4d5ab4c00b2ab46e0ff56';
const R2_BUCKET = 'transparencia';
const PUBLIC_URL = 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev';

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function upload() {
  const filePath = 'C:\\Users\\Áurea Letícia\\Downloads\\medicoes_escola\\MEDIÇÕES - ESCOLA DE 9 SALA (CONVÊNIO 960708-2024 E CONTRATO Nº 137-2025)\\MED 3\\Boletim 3ª Medição.pdf';
  const fileContent = fs.readFileSync(filePath);
  const ano = '2026';
  const fileName = `obras/${ano}/${Date.now()}-boletim-3a-medicao.pdf`;
  
  await S3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileName,
    Body: fileContent,
    ContentType: 'application/pdf'
  }));
  
  const fileUrl = `${PUBLIC_URL}/${fileName}`;
  console.log('UPLOADED URL:', fileUrl);

  const SUPABASE_URL = 'https://cjvyxbblbolkucnbhfvr.supabase.co/rest/v1/obras';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdnl4YmJsYm9sa3VjbmJoZnZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzcyNTQ5NCwiZXhwIjoyMDkzMzAxNDk0fQ.V59Ed7neK85wxWhTdqt3dH1CF3-D3iJFs985OE919KE';
  const HEADERS = {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Accept-Profile': 'transparencia',
      'Content-Profile': 'transparencia'
  };
  
  const params = new URLSearchParams({ id: 'eq.fb29395f-71fc-4c13-abe4-95fb30fcf6eb' });
  const body = JSON.stringify({
      arquivo_r2_url: fileUrl,
      arquivo_nome: 'Boletim 3ª Medição.pdf',
      link_tce: ''
  });
  const r = await fetch(SUPABASE_URL + '?' + params.toString(), {
      method: 'PATCH',
      headers: HEADERS,
      body: body
  });
  console.log('PATCH STATUS:', r.status, await r.text());
}
upload().catch(console.error);
