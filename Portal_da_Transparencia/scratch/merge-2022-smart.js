const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function extractBaseNumber(numStr) {
  if (!numStr) return null;
  const match = numStr.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return null;
}

// Retorna se dois contratos são variações do mesmo (ex: 058, 058/2022, Termo de contrato 058/2022)
function isSameContract(base, num1, num2) {
  const normalize = (s) => s.toLowerCase().replace(/termo de contrato/g, '').replace(/\/2022/g, '').trim();
  const n1 = normalize(num1);
  const n2 = normalize(num2);
  
  // Se após remover "Termo..." e "/2022" eles ficarem iguais (ex: "058" e "058")
  if (n1 === n2) return true;
  
  // Ex: 58 e 058
  if (parseInt(n1, 10) === parseInt(n2, 10) && parseInt(n1, 10) === base) return true;

  return false;
}

async function mergeContracts(ghostId, realId) {
  const { data: docs } = await supabase.schema('transparencia').from('contratos_documentos').select('*').eq('contrato_id', ghostId);
  if (docs && docs.length > 0) {
    for (const doc of docs) {
      await supabase.schema('transparencia').from('contratos_documentos').update({ contrato_id: realId }).eq('id', doc.id);
    }
  }
  await supabase.schema('transparencia').from('contratos_v2').delete().eq('id', ghostId);
  console.log(` ✅ Mesclado fantasma ${ghostId} no real ${realId}`);
}

async function run() {
  console.log("Iniciando mesclagem inteligente 2022...");
  const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('*, documentos:contratos_documentos(*)').eq('ano', 2022);
  
  const byBase = {};
  for (const c of contratos) {
    const base = extractBaseNumber(c.numero);
    if (base !== null) {
      if (!byBase[base]) byBase[base] = [];
      byBase[base].push(c);
    }
  }

  for (const base in byBase) {
    const group = byBase[base];
    if (group.length > 1) {
      
      // Separar em subgrupos que realmente representam o mesmo contrato
      // Ex: 001-B não deve se juntar com 001.
      const subgroups = [];
      for (const c of group) {
        let placed = false;
        for (const sub of subgroups) {
          if (isSameContract(parseInt(base, 10), c.numero, sub[0].numero)) {
            sub.push(c);
            placed = true;
            break;
          }
        }
        if (!placed) subgroups.push([c]);
      }

      for (const sub of subgroups) {
        if (sub.length > 1) {
          console.log(`\nGrupo Base ${base}:`);
          sub.forEach(c => console.log(`  - [${c.id}] ${c.numero} | R$ ${c.valor} | Anexos: ${c.documentos?.length || 0}`));
          
          // Escolher o "real"
          // Preferimos o que tem `valor > 0` e nome mais curto (ex: 058 em vez de Termo de contrato 058)
          sub.sort((a, b) => {
             const valA = parseFloat(a.valor) || 0;
             const valB = parseFloat(b.valor) || 0;
             if (valA > 0 && valB === 0) return -1;
             if (valB > 0 && valA === 0) return 1;
             
             // Se ambos têm valor ou ambos não têm, prefira o nome mais curto
             return a.numero.length - b.numero.length;
          });

          const real = sub[0];
          const ghosts = sub.slice(1);
          console.log(`  🎯 ESCOLHIDO COMO REAL: ${real.numero}`);
          
          for (const ghost of ghosts) {
             console.log(`  👻 FANTASMA A MESCLAR: ${ghost.numero}`);
             await mergeContracts(ghost.id, real.id);
          }
        }
      }
    }
  }
}
run();
