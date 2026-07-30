const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data } = await supabase.schema('transparencia').from('contratos_v2').select('origem').eq('ano', 2023);
  const origens = {};
  for(const c of data) {
    origens[c.origem] = (origens[c.origem] || 0) + 1;
  }
  console.log(origens);
}
check();
