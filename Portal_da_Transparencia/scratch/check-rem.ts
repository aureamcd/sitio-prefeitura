import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkRem() {
  const { data, error } = await s.schema('transparencia').from('remuneracoes').select('*').limit(2);
  console.log("Remuneracoes:", data);
  if (error) console.error(error);
}

checkRem().catch(console.error);
