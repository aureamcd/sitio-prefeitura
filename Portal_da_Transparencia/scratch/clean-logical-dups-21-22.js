const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = process.env.R2_BUCKET;

function getDocumentType(name) {
  const n = name.toLowerCase();
  if (n.includes('aditivo')) return 'aditivo';
  if (n.includes('rescis') || n.includes('resis')) return 'rescisao';
  if (n.includes('errata') || n.includes('extrato')) return 'extrato';
  if (n.includes('dispensa')) return 'dispensa';
  if (n.includes('ata')) return 'ata';
  if (n.includes('termo')) return 'termo_outros';
  if (n.includes('contrato') || n.includes('ct')) return 'contrato';
  return 'outro';
}

function normalizeName(name) {
  let n = name.toLowerCase();
  n = n.replace(/\.pdf$/, '');
  n = n.replace(/\(\d+\)/g, ''); // remove (1), (2), etc
  n = n.replace(/contratos?-?/g, ''); // remove contrato, contratos, contrato-
  n = n.replace(/n[º°o]\s*/g, ''); // remove nº, n°
  n = n.replace(/administrativo/g, ''); // remove administrativo
  n = n.replace(/_|-| /g, ''); // remove spaces and dashes
  
  // se ficou vazio ou bizarro, retorna o original limpo de ()
  if (n.length < 3) return name.toLowerCase().replace(/\(\d+\)/g, '');
  
  return n;
}

async function run() {
  const years = [2021, 2022];
  let deletedCount = 0;
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, numero, documentos:contratos_documentos(*)')
      .eq('ano', year);
      
    for (const c of contratos) {
      if (c.documentos && c.documentos.length > 1) {
        const byType = {};
        for (const doc of c.documentos) {
          const type = getDocumentType(doc.nome_arquivo);
          if (!byType[type]) byType[type] = [];
          byType[type].push(doc);
        }
        
        if (byType['contrato'] && byType['contrato'].length > 1) {
           // Agrupar por core identifier
           const coreGroups = {};
           for (const doc of byType['contrato']) {
             const core = normalizeName(doc.nome_arquivo);
             // Tratamento especial para "003-2019-DIGTEC21022019.pdf" -> vai virar "0032019digtec21022019"
             // A gente quer agrupar se o número base for o mesmo, mas vamos manter simples por enquanto
             
             // Melhor aproximação: Extrair apenas os dígitos e letras soltas como A, B, C logo apos os digitos
             let match = doc.nome_arquivo.match(/0*(\d+)(?:\s*-?\s*([a-c]))?/i);
             let ultraCore = match ? `${match[1]}${match[2] ? match[2].toLowerCase() : ''}` : core;
             
             if (!coreGroups[ultraCore]) coreGroups[ultraCore] = [];
             coreGroups[ultraCore].push(doc);
           }
           
           for (const [core, docs] of Object.entries(coreGroups)) {
             if (docs.length > 1) {
               console.log(`\nContrato [${c.numero}] tem ${docs.length} PDFs duplicados lógicos (Base: ${core})`);
               
               // Escolher qual manter: 
               // 1. Preferir nomes sem (1), (2)
               // 2. Preferir 'contratos-...' (que vieram da nossa migração local limpa)
               let best = docs[0];
               let bestScore = -1;
               
               for (const d of docs) {
                 let score = 0;
                 if (!d.nome_arquivo.includes('(')) score += 5;
                 if (d.nome_arquivo.startsWith('contratos-')) score += 10;
                 if (score > bestScore) {
                   bestScore = score;
                   best = d;
                 }
               }
               
               for (const d of docs) {
                 if (d.id === best.id) {
                   console.log(`  🟢 MANTENDO: ${d.nome_arquivo}`);
                 } else {
                   console.log(`  🔴 DELETANDO: ${d.nome_arquivo}`);
                   // Deletar do banco
                   await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', d.id);
                   // Deletar do S3
                   if (d.caminho_r2) {
                     await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: d.caminho_r2 }));
                   }
                   deletedCount++;
                 }
               }
             }
           }
        }
      }
    }
  }
  console.log(`\nTotal de anexos repetidos lógicos apagados: ${deletedCount}`);
}
run();
