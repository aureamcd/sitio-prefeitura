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
    const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, valor, objeto').eq('ano', year).range(offset, offset + limit - 1);
    if (!data || data.length === 0) break;
    contratos = contratos.concat(data);
    offset += limit;
  }
  
  const byBase = {};
  for (const c of contratos) {
    const base = extractBaseNumber(c.numero);
    if (base !== null) {
      if (!byBase[base]) byBase[base] = [];
      byBase[base].push(c);
    }
  }

  let mergedCount = 0;
  for (const base in byBase) {
    const group = byBase[base];
    if (group.length > 1) {
      // Ordenar para encontrar o "real"
      // Prioridade:
      // 1. valor > 0
      // 2. tamanho do objeto maior
      group.sort((a, b) => {
        const aVal = parseFloat(a.valor) || 0;
        const bVal = parseFloat(b.valor) || 0;
        if (aVal > 0 && bVal === 0) return -1;
        if (bVal > 0 && aVal === 0) return 1;
        
        const aObjLen = (a.objeto || '').length;
        const bObjLen = (b.objeto || '').length;
        return bObjLen - aObjLen;
      });

      const real = group[0];
      const ghosts = group.slice(1);
      
      console.log(`\n--- Ano ${year} Base ${base} ---`);
      console.log(` 🟢 REAL: ${real.numero} | Valor: ${real.valor} | Objeto Len: ${(real.objeto||'').length}`);
      
      for (const ghost of ghosts) {
        console.log(` 🔴 GHOST (Mesclando e Apagando): ${ghost.numero} | Valor: ${ghost.valor}`);
        await mergeContracts(ghost.id, real.id);
        mergedCount++;
      }
    }
  }
  console.log(`Ano ${year}: ${mergedCount} linhas mescladas/excluídas.`);
}

async function run() {
  await processYear(2023);
  await processYear(2024);
  await processYear(2025);
  await processYear(2026);
}
run();
