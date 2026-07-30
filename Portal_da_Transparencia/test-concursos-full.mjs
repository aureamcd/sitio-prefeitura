import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data } = await supabase.schema('transparencia').from('concursos_processos_seletivos').select('*, documentos:concursos_documentos(*)').limit(1);
  console.log(JSON.stringify(data, null, 2));
}
test();
