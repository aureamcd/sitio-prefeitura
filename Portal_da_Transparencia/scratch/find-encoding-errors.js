const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const years = [2018, 2019, 2020];
  const words = new Set();
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, objeto, contratado')
      .eq('ano', year)
      .ilike('objeto', '%%');
      
    if (contratos && contratos.length > 0) {
      for (const c of contratos) {
        if (c.objeto) {
           const tokens = c.objeto.split(/\s+/);
           for (const t of tokens) {
             if (t.includes('')) {
               words.add(t);
             }
           }
        }
      }
    }
  }
  
  console.log(Array.from(words));
}
run();
