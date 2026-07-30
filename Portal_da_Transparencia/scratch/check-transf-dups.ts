import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDuplicates() {
  const { data, error } = await s
    .schema('transparencia')
    .from('transferencias_entre_entidades')
    .select('*')
    .eq('exercicio', 2026)
    .eq('mes', 1)
    .eq('entidade_recebedora', 'FUNDO MUNICIPAL DE SAÚDE');

  if (error) console.error(error);
  else console.log(`Found ${data?.length} records for Saúde in Jan 2026:`, data?.map(d => ({ data: d.data_lancamento, repasse: d.repasse, previsto: d.previsto })));
}

checkDuplicates().catch(console.error);
