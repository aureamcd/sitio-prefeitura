import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
  console.log("Missing keys");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.schema('transparencia').from('concursos_processos_seletivos').select('*, documentos:concursos_documentos(*)').limit(1);
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("Success! Data:", data);
  }
}
test();
