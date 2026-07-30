import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkEstado2023() {
  const { data: recs, error } = await s
    .schema('transparencia')
    .from('receitas')
    .select('codigo_contabil, descricao, previsto_inicial, arrecadado_total, empresa')
    .eq('ano', 2023)
    .neq('empresa', '2')
    .or('codigo_contabil.eq.1720.00.0.0.00,codigo_contabil.eq.2420.00.0.0.00');

  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Rows for 1720 and 2420 in 2023:");
  recs?.forEach(r => console.log(`${r.codigo_contabil} | Empresa: ${r.empresa} | PI: ${r.previsto_inicial} | AT: ${r.arrecadado_total}`));
  
  const totalPI1720 = recs?.filter(r => r.codigo_contabil === '1720.00.0.0.00').reduce((acc, r) => acc + Number(r.previsto_inicial), 0) || 0;
  const totalPI2420 = recs?.filter(r => r.codigo_contabil === '2420.00.0.0.00').reduce((acc, r) => acc + Number(r.previsto_inicial), 0) || 0;
  
  const totalAT1720 = recs?.filter(r => r.codigo_contabil === '1720.00.0.0.00').reduce((acc, r) => acc + Number(r.arrecadado_total), 0) || 0;
  const totalAT2420 = recs?.filter(r => r.codigo_contabil === '2420.00.0.0.00').reduce((acc, r) => acc + Number(r.arrecadado_total), 0) || 0;

  console.log(`\nTotal 1720 -> PI: ${totalPI1720} | AT: ${totalAT1720}`);
  console.log(`Total 2420 -> PI: ${totalPI2420} | AT: ${totalAT2420}`);
  console.log(`GRAND TOTAL -> PI: ${totalPI1720 + totalPI2420} | AT: ${totalAT1720 + totalAT2420}`);
}

checkEstado2023().catch(console.error);
