import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkMonths() {
    const { data, error } = await s.schema('transparencia').from('remuneracoes').select('mes, ano');
    if (error) {
        console.error(error);
        return;
    }
    const counts: any = {};
    for (const row of data) {
        const key = `${row.ano}-${row.mes}`;
        counts[key] = (counts[key] || 0) + 1;
    }
    console.log("Remuneracoes in DB:");
    console.table(counts);
}
checkMonths();
