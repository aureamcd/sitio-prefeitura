import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDespesasExtra() {
  const { data, error } = await s
    .schema('transparencia')
    .from('despesas_extra_orcamentarias')
    .select('*')
    .limit(1);

  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Success:", data);
  }
}

checkDespesasExtra().catch(console.error);
