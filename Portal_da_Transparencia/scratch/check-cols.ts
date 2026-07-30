import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  const { data } = await s
    .schema('transparencia')
    .from('receitas_transferencias')
    .select('*')
    .limit(1);
  console.log('Sample row from receitas_transferencias keys:', Object.keys(data?.[0] || {}));
}

check();
