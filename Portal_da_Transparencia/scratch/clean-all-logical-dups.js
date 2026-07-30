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

function getAditivoOrdinal(name) {
  const n = name.toLowerCase();
  if (n.match(/\b1\b|1º|1°|1o|primeiro/)) return 1;
  if (n.match(/\b2\b|2º|2°|2o|segundo/)) return 2;
  if (n.match(/\b3\b|3º|3°|3o|terceiro/)) return 3;
  if (n.match(/\b4\b|4º|4°|4o|quarto/)) return 4;
  if (n.match(/\b5\b|5º|5°|5o|quinto/)) return 5;
  if (n.match(/\b6\b|6º|6°|6o|sexto/)) return 6;
  if (n.match(/\b7\b|7º|7°|7o|s[ée]timo/)) return 7;
  if (n.match(/\b8\b|8º|8°|8o|oitavo/)) return 8;
  if (n.match(/\b9\b|9º|9°|9o|nono/)) return 9;
  if (n.match(/\b10\b|10º|10°|10o|d[ée]cimo/)) return 10;
  return 'unknown';
}

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
  n = n.replace(/contratos?-?/g, '');
  n = n.replace(/n[º°o]\s*/g, '');
  n = n.replace(/administrativo/g, '');
  n = n.replace(/_|-| /g, '');
  
  if (n.length < 3) return name.toLowerCase().replace(/\(\d+\)/g, '');
  return n;
}

async function run() {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  let deletedCountContrato = 0;
  let deletedCountAditivo = 0;
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, numero, documentos:contratos_documentos(*)')
      .eq('ano', year);
      
    if (!contratos) continue;

    for (const c of contratos) {
      if (c.documentos && c.documentos.length > 1) {
        const byType = {};
        for (const doc of c.documentos) {
          const type = getDocumentType(doc.nome_arquivo);
          if (!byType[type]) byType[type] = [];
          byType[type].push(doc);
        }
        
        // --- LIMPEZA DE CONTRATOS ---
        if (byType['contrato'] && byType['contrato'].length > 1) {
           const coreGroups = {};
           for (const doc of byType['contrato']) {
             const core = normalizeName(doc.nome_arquivo);
             let match = doc.nome_arquivo.match(/0*(\d+)(?:\s*-?\s*([a-c]))?/i);
             let ultraCore = match ? `${match[1]}${match[2] ? match[2].toLowerCase() : ''}` : core;
             if (!coreGroups[ultraCore]) coreGroups[ultraCore] = [];
             coreGroups[ultraCore].push(doc);
           }
           
           for (const [core, docs] of Object.entries(coreGroups)) {
             if (docs.length > 1) {
               console.log(`\nContrato [${c.numero}] tem ${docs.length} PDFs duplicados de CONTRATO (Base: ${core})`);
               
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
                   await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', d.id);
                   if (d.caminho_r2) {
                     await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: d.caminho_r2 })).catch(e => console.log('S3 erro:', e));
                   }
                   deletedCountContrato++;
                 }
               }
             }
           }
        }
        
        // --- LIMPEZA DE ADITIVOS ---
        if (byType['aditivo'] && byType['aditivo'].length > 1) {
           const ordGroups = {};
           for (const doc of byType['aditivo']) {
             const ord = getAditivoOrdinal(doc.nome_arquivo);
             if (!ordGroups[ord]) ordGroups[ord] = [];
             ordGroups[ord].push(doc);
           }
           
           for (const [ord, docs] of Object.entries(ordGroups)) {
             // Só deletamos se o ordinal for conhecido. Se for 'unknown', evitamos deletar pra não correr risco.
             if (ord !== 'unknown' && docs.length > 1) {
               console.log(`\nContrato [${c.numero}] tem ${docs.length} PDFs duplicados de ADITIVO (Ordinal: ${ord})`);
               
               let best = docs[0];
               let bestScore = -1;
               
               for (const d of docs) {
                 let score = 0;
                 if (!d.nome_arquivo.includes('(')) score += 5;
                 if (d.nome_arquivo.includes('PA') || d.nome_arquivo.includes('ADM')) score -= 2; // Nomes curtos costumam ser os originais limpos
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
                   await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', d.id);
                   if (d.caminho_r2) {
                     await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: d.caminho_r2 })).catch(e => console.log('S3 erro:', e));
                   }
                   deletedCountAditivo++;
                 }
               }
             }
           }
        }
      }
    }
  }
  
  console.log(`\nResumo Lógico:`);
  console.log(`Contratos deletados: ${deletedCountContrato}`);
  console.log(`Aditivos deletados: ${deletedCountAditivo}`);
}
run();
