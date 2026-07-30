const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_tables_in_schema', { schema_name: 'transparencia' });
  if (error) {
     console.log("No RPC. Let's just try to query information_schema");
     const { data: cols, error: err2 } = await supabase.from('information_schema.tables').select('*').eq('table_schema', 'transparencia');
     console.log(cols || err2);
  } else {
     console.log(data);
  }
}

check();
