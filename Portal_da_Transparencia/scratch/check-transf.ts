import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkTransf() {
  const { data, error } = await s
    .schema('transparencia')
    .from('transferencias_entre_entidades')
    .select('*')
    .eq('exercicio', 2026)
    .limit(3);

  if (error) console.error(error);
  else console.log("Sample Data:", data);
}

checkTransf().catch(console.error);
