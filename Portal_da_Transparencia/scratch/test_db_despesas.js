const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const q1 = await supabase.schema('transparencia').from('despesas').select('id').limit(1);
  console.log("Despesas error:", q1.error?.message || "OK");

  const q2 = await supabase.schema('transparencia').from('restos_pagar').select('id').limit(1);
  console.log("Restos a pagar error:", q2.error?.message || "OK");

  const q3 = await supabase.schema('transparencia').from('despesas_extra_orcamentarias').select('id').limit(1);
  console.log("Despesas extra error:", q3.error?.message || "OK");
}

test();
