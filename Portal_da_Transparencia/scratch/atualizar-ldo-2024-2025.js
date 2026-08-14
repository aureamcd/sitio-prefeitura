require('dotenv').config({ path: '.env' });
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const localFile = 'C:\\Users\\Áurea Letícia\\Downloads\\Lei 769-2024 - LDO 2025.pdf';
const pdfBuffer = fs.readFileSync(localFile);

async function uploadR2(key) {
  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: pdfBuffer,
    ContentType: 'application/pdf',
  }));
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

async function ensureDoc(year, titulo, descricao) {
  const r2Key = `planejamento/${year}/LDO/lei-de-diretrizes-orcamentarias-ldo-${year}.pdf`;
  const url = await uploadR2(r2Key);

  const { data: existing, error: findError } = await supabase
    .schema('transparencia')
    .from('planejamento_documentos')
    .select('id, tipo, exercicio, ativo, arquivo_url')
    .eq('tipo', 'LDO')
    .eq('exercicio', year)
    .limit(20);

  if (findError) {
    throw findError;
  }

  const payload = {
    categoria: 'PLANEJAMENTO_ORCAMENTARIO',
    tipo: 'LDO',
    exercicio: year,
    titulo: titulo,
    descricao: descricao,
    arquivo_url: url,
    arquivo_nome: 'Lei 769-2024 - LDO 2025.pdf',
    data_publicacao: `${year}-01-01`,
    ordem: 1,
    ativo: true,
  };

  if (existing && existing.length) {
    const row = existing[0];
    const { data, error } = await supabase
      .schema('transparencia')
      .from('planejamento_documentos')
      .update(payload)
      .eq('id', row.id)
      .select('id, exercicio, tipo, arquivo_url, arquivo_nome');

    if (error) throw error;
    console.log(`ATUALIZADO ${year}:`, JSON.stringify(data, null, 2));
    return;
  }

  const { data, error } = await supabase
    .schema('transparencia')
    .from('planejamento_documentos')
    .insert(payload)
    .select('id, exercicio, tipo, arquivo_url, arquivo_nome');

  if (error) throw error;
  console.log(`INSERIDO ${year}:`, JSON.stringify(data, null, 2));
}

async function main() {
  console.log('Arquivo local:', localFile);
  await ensureDoc(
    2025,
    'Lei de Diretrizes Orçamentárias (LDO) 2025',
    'Lei n° 769/2024 — Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2025.'
  );
  await ensureDoc(
    2024,
    'Lei de Diretrizes Orçamentárias (LDO) 2024',
    'Lei n° 769/2024 — Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2024.'
  );
  console.log('Verificação final:');
  const { data, error } = await supabase
    .schema('transparencia')
    .from('planejamento_documentos')
    .select('id, tipo, exercicio, titulo, arquivo_url, ativo, arquivo_nome')
    .eq('tipo', 'LDO')
    .in('exercicio', [2024, 2025])
    .order('exercicio', { ascending: true });

  if (error) throw error;
  console.log(JSON.stringify(data, null, 2));
}

main().catch((e) => {
  console.error('ERRO:', e);
  process.exit(1);
});
