import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  const { count, error } = await supabase.schema('transparencia').from('diarias').select('*', { count: 'exact', head: true });
  console.log("diarias count/error:", count, error?.message);
}
run();
