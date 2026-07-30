const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, valor').eq('ano', 2023);
  const byBase = {};
  for(const c of data) {
    const m = c.numero.match(/\d+/);
    if(m) {
      const b = parseInt(m[0], 10);
      if(b >= 1 && b <= 8) {
        if(!byBase[b]) byBase[b] = [];
        byBase[b].push(c);
      }
    }
  }
  for(let i=1; i<=8; i++) {
    console.log(`\nBase ${i}:`);
    for(const c of byBase[i] || []) {
      console.log(`  ${c.numero} (R$ ${c.valor})`);
    }
  }
}
check();
