const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFilters() {
  const buildQuery = (field) => {
    return supabase.schema('transparencia').from('despesas').select(field).not(field, 'is', null).order(field, { ascending: true }).limit(1);
  };

  const [orgRes, natRes, funRes, proRes, fonRes] = await Promise.all([
    buildQuery('orgao_nome'),
    buildQuery('natureza_nome'),
    buildQuery('funcao_nome'),
    buildQuery('programa_nome'),
    buildQuery('fonte_nome'),
  ]);

  console.log("orgRes:", orgRes.error?.message || "OK");
  console.log("natRes:", natRes.error?.message || "OK");
  console.log("funRes:", funRes.error?.message || "OK");
  console.log("proRes:", proRes.error?.message || "OK");
  console.log("fonRes:", fonRes.error?.message || "OK");
}

testFilters();
