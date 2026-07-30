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

async function findDups(year) {
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

  let dupCount = 0;
  for (const base in byBase) {
    const group = byBase[base];
    if (group.length > 1) {
      // Filtrar falsos positivos: se os objetos ou valores forem muito diferentes, podem ser contratos distintos com mesmo número (?)
      // Mas geralmente é duplicação. Vamos só listar.
      console.log(`\n--- Possível duplicata no ano ${year} - Número Base: ${base} ---`);
      for (const c of group) {
        console.log(` ID: ${c.id} | Nº: ${c.numero} | Valor: ${c.valor} | Objeto: ${c.objeto?.substring(0,40)}`);
      }
      dupCount++;
    }
  }
  
  if (dupCount === 0) {
    console.log(`\nNenhuma duplicata de número base encontrada em ${year}.`);
  } else {
    console.log(`\nEncontrados ${dupCount} grupos de possíveis duplicatas em ${year}.`);
  }
}

async function run() {
  await findDups(2023);
  await findDups(2024);
  await findDups(2025);
  await findDups(2026);
}
run();
