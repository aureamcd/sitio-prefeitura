import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function test() {
  const { data: recsUniao } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');

  console.log(`Loaded ${recsUniao?.length} rows for uniao`);
  const has1710 = recsUniao?.some(r => r.codigo_contabil.startsWith('1710'));
  console.log(`Has 1710 in recsUniao? ${has1710}`);
  if (has1710) {
    console.log(recsUniao?.filter(r => r.codigo_contabil.startsWith('1710')).map(r => ({ code: r.codigo_contabil, emp: r.empresa, at: r.arrecadado_total })));
  }
}
test().catch(console.error);
