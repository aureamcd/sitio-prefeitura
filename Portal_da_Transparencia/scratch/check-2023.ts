import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check2023() {
  const { data: recs, error } = await s
    .schema('transparencia')
    .from('receitas')
    .select('codigo_contabil, descricao, previsto_inicial, arrecadado_total, empresa')
    .eq('ano', 2023)
    .eq('codigo_contabil', '1710.00.0.0.00');

  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Rows for 1710.00.0.0.00 in 2023:");
  recs?.forEach(r => console.log(`Empresa: ${r.empresa} | PI: ${r.previsto_inicial} | AT: ${r.arrecadado_total}`));
  
  const totalPI = recs?.reduce((acc, r) => acc + Number(r.previsto_inicial), 0) || 0;
  console.log("Total PI for 1710:", totalPI);
}

check2023().catch(console.error);
