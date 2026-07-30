const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const years = [2023, 2024, 2025, 2026];
  for (const year of years) {
    const { count } = await supabase.schema('transparencia').from('contratos_v2').select('*', { count: 'exact', head: true }).eq('ano', year);
    console.log(`Ano ${year}: ${count} contratos na tabela contratos_v2`);
  }
}
check();
