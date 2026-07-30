import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { data, error } = await supabase.rpc('get_tables_info');
  // If rpc doesn't exist, we can use a raw REST query or another method, but JS client can't query information_schema directly unless exposed.
  // Instead, let's query the table 'aditivos' with select('count') to see if it exists but is empty.
  const { count, error: e1 } = await supabase.schema('transparencia').from('aditivos').select('*', { count: 'exact', head: true });
  console.log("aditivos count/error:", count, e1?.message);

  const { count: c2, error: e2 } = await supabase.schema('transparencia').from('aditivos_v2').select('*', { count: 'exact', head: true });
  console.log("aditivos_v2 count/error:", c2, e2?.message);
}
run();
