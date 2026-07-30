const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeNumero(num) {
    if (!num) return '';
    let n = num.toUpperCase();
    
    n = n.replace(/TERMO DE CONTRATO/g, '');
    n = n.replace(/CONTRATO ADMINISTRATIVO/g, '');
    n = n.replace(/CONTRATO/g, '');
    n = n.replace(/N[º°]/g, '');
    n = n.replace(/[\/\-]202[0-9]/g, '');
    n = n.replace(/[^0-9A-Z]/g, '');
    n = n.replace(/^0+/, '');
    
    return n;
}

async function mergeContracts(ghostId, realId) {
  const { data: docs } = await supabase.schema('transparencia').from('contratos_documentos').select('*').eq('contrato_id', ghostId);
  if (docs && docs.length > 0) {
    for (const doc of docs) {
      await supabase.schema('transparencia').from('contratos_documentos').update({ contrato_id: realId }).eq('id', doc.id);
    }
  }
  await supabase.schema('transparencia').from('contratos_v2').delete().eq('id', ghostId);
}

async function processYear(year) {
  let offset = 0;
  let limit = 1000;
  let contratos = [];
  while (true) {
    const { data } = await supabase.schema('transparencia').from('contratos_v2').select('*').eq('ano', year).range(offset, offset + limit - 1);
    if (!data || data.length === 0) break;
    contratos = contratos.concat(data);
    offset += limit;
  }
  
  const byNorm = {};
  for (const c of contratos) {
    const norm = normalizeNumero(c.numero);
    if (norm) {
      if (!byNorm[norm]) byNorm[norm] = [];
      byNorm[norm].push(c);
    }
  }

  let mergedCount = 0;
  let skippedGroups = 0;
  for (const norm in byNorm) {
    const group = byNorm[norm];
    if (group.length > 1) {
      group.sort((a, b) => {
        const aVal = parseFloat(a.valor) || 0;
        const bVal = parseFloat(b.valor) || 0;
        if (aVal > 0 && bVal === 0) return -1;
        if (bVal > 0 && aVal === 0) return 1;
        
        const aObjLen = (a.objeto || '').length;
        const bObjLen = (b.objeto || '').length;
        if (aObjLen !== bObjLen) return bObjLen - aObjLen;
        
        // Tie breaker: Keep the one with proper formatting if any
        if (a.numero.includes('Termo') && !b.numero.includes('Termo')) return -1;
        if (b.numero.includes('Termo') && !a.numero.includes('Termo')) return 1;
        
        return 0;
      });

      const real = group[0];
      const ghosts = group.slice(1);
      
      console.log(`\n--- Ano ${year} Norm ${norm} ---`);
      console.log(` 🟢 REAL: ${real.numero} | Valor: ${real.valor} | Objeto Len: ${(real.objeto||'').length}`);
      
      let safeToMerge = true;
      for (const ghost of ghosts) {
          const gVal = parseFloat(ghost.valor) || 0;
          const rVal = parseFloat(real.valor) || 0;
          if (gVal > 0 && rVal > 0 && gVal !== rVal) {
              console.log(` ⚠️ ALERTA: Conflito de valores (${gVal} vs ${rVal}). Ignorando este grupo.`);
              safeToMerge = false;
              break;
          }
      }
      
      if (!safeToMerge) {
          skippedGroups++;
          continue;
      }
      
      for (const ghost of ghosts) {
        console.log(` 🔴 GHOST (Mesclando e Apagando): ${ghost.numero} | Valor: ${ghost.valor}`);
        await mergeContracts(ghost.id, real.id);
        mergedCount++;
      }
    }
  }
  console.log(`Ano ${year}: ${mergedCount} linhas fantasmas excluídas. ${skippedGroups} grupos ignorados por conflito.`);
}

async function run() {
  await processYear(2023);
  await processYear(2024);
  await processYear(2025);
  await processYear(2026);
}
run();
