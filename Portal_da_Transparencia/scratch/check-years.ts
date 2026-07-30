import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkYear(year: number) {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('codigo_contabil, previsto_inicial, arrecadado_total, previsto_atualizado')
    .eq('ano', year)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');

  let pi1710 = 0; let at1710 = 0;
  let pi2410 = 0; let at2410 = 0;

  if (recs) {
    const roots1710 = recs.filter(r => r.codigo_contabil.startsWith('1710.00.0.0.00'));
    const roots2410 = recs.filter(r => r.codigo_contabil.startsWith('2410.00.0.0.00'));

    pi1710 = roots1710.reduce((acc, r) => acc + (Number(r.previsto_inicial) || 0), 0);
    at1710 = roots1710.reduce((acc, r) => acc + (Number(r.arrecadado_total) || 0), 0);

    pi2410 = roots2410.reduce((acc, r) => acc + (Number(r.previsto_inicial) || 0), 0);
    at2410 = roots2410.reduce((acc, r) => acc + (Number(r.arrecadado_total) || 0), 0);
  }

  const totalPI = pi1710 + pi2410;
  const totalAT = at1710 + at2410;

  console.log(`--- YEAR ${year} (União Total) ---`);
  console.log(`PI: ${totalPI.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`);
  console.log(`AT: ${totalAT.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2})}`);
  console.log(`(1710 -> PI: ${pi1710}, AT: ${at1710}) | (2410 -> PI: ${pi2410}, AT: ${at2410})\n`);
}

async function main() {
  await checkYear(2023);
  await checkYear(2024);
  await checkYear(2025);
  await checkYear(2026);
}

main().catch(console.error);
