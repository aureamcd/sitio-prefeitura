const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, numero, descricao')
      .eq('ano', year);
      
    if (!contratos) continue;

    for (const c of contratos) {
      if (c.descricao && c.descricao.includes('')) {
        console.log(`[${year}] [${c.numero}] Desc: ${c.descricao}`);
        // print out char codes around the 
        let idx = c.descricao.indexOf('');
        console.log('Codes:', Array.from(c.descricao.slice(Math.max(0, idx - 5), idx + 5)).map(char => char.charCodeAt(0).toString(16)));
      }
    }
  }
}
run();
