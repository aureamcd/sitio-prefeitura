const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

async function run() {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, numero, documentos:contratos_documentos(*)')
      .eq('ano', year);
      
    if (!contratos) continue;

    for (const c of contratos) {
      if (c.documentos && c.documentos.length > 1) {
        const aditivos = c.documentos.filter(d => getDocumentType(d.nome_arquivo) === 'aditivo');
        if (aditivos.length > 1) {
          const byOrdinal = {};
          for (const a of aditivos) {
            const ord = getAditivoOrdinal(a.nome_arquivo);
            if (!byOrdinal[ord]) byOrdinal[ord] = [];
            byOrdinal[ord].push(a);
          }
          
          for (const [ord, docs] of Object.entries(byOrdinal)) {
            if (docs.length > 1) {
              console.log(`\nContrato [${c.numero}] tem ${docs.length} aditivos duplicados (Ordinal: ${ord})`);
              for (const d of docs) {
                console.log(`  - ${d.nome_arquivo} (${d.tamanho_bytes} bytes)`);
              }
            }
          }
        }
      }
    }
  }
}
run();
