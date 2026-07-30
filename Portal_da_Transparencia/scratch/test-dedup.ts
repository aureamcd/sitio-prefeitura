import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testDedup() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');
  
  console.log('Total raw rows for uniao 2026 (excluding camara):', recs?.length);

  // Check unique entities for 171/241
  const empresas = new Set(recs?.map(r => r.empresa));
  console.log('Empresas present:', Array.from(empresas));

  // If we take only empresa '1' (Prefeitura) or if we take distinct by codigo_contabil per empresa:
  const byCode = new Map<string, any[]>();
  recs?.forEach(r => {
    const list = byCode.get(r.codigo_contabil) || [];
    list.push(r);
    byCode.set(r.codigo_contabil, list);
  });

  console.log('\n--- Checking codes present in multiple empresas vs duplicate in same empresa ---');
  let sumPI_all = 0;
  let sumAT_all = 0;
  
  // If we deduplicate exact duplicate rows within the SAME empresa:
  const dedupPerEmpresa = new Map<string, any>();
  recs?.forEach(r => {
    const key = `${r.empresa}_${r.codigo_contabil}`;
    const existing = dedupPerEmpresa.get(key);
    if (!existing || Number(r.arrecadado_total || 0) > Number(existing.arrecadado_total || 0)) {
      dedupPerEmpresa.set(key, r);
    }
  });

  const uniqueRows = Array.from(dedupPerEmpresa.values());
  console.log('Rows after deduplicating exact repeats inside same empresa:', uniqueRows.length);

  // Now let's check: if we filter by entity 1 vs consolidado
  const rootRows = uniqueRows.filter(r => r.codigo_contabil === '1710.00.0.0.00' || r.codigo_contabil === '2410.00.0.0.00');
  console.log('\nRoot rows in uniqueRows:');
  rootRows.forEach(r => {
    console.log(`   emp=${r.empresa} | cod=${r.codigo_contabil} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`);
  });

  // Let's sum PI and AT across all root rows for 1710 and 2410:
  const totalRootPI = rootRows.reduce((sum, r) => sum + Number(r.previsto_inicial || 0), 0);
  const totalRootAT = rootRows.reduce((sum, r) => sum + Number(r.arrecadado_total || 0), 0);
  console.log(`\nSUM OF ROOTS ACROSS ALL EMPRESAS (EXCEPT CAMARA): PI=${totalRootPI} | AT=${totalRootAT}`);

  // What about for ONLY empresa 1?
  const emp1Roots = rootRows.filter(r => String(r.empresa) === '1');
  const emp1PI = emp1Roots.reduce((sum, r) => sum + Number(r.previsto_inicial || 0), 0);
  const emp1AT = emp1Roots.reduce((sum, r) => sum + Number(r.arrecadado_total || 0), 0);
  console.log(`SUM OF ROOTS FOR EMPRESA 1 ONLY: PI=${emp1PI} | AT=${emp1AT}`);
}

testDedup().catch(console.error);
