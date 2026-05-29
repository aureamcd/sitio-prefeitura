const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase service role credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.schema('transparencia').from('receitas').select('*').limit(5);
  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Service Role Data count:", data.length);
    console.log("Service Role Sample:", data[0]);
  }
}

test();
