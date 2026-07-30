import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testEstado() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.172%,codigo_contabil.ilike.242%');
  
  // Dedup exact repeats inside same empresa:
  const dedupPerEmpresa = new Map<string, any>();
  recs?.forEach(r => {
    const key = `${r.empresa}_${r.codigo_contabil}`;
    const existing = dedupPerEmpresa.get(key);
    if (!existing || Number(r.arrecadado_total || 0) > Number(existing.arrecadado_total || 0)) {
      dedupPerEmpresa.set(key, r);
    }
  });

  const uniqueRows = Array.from(dedupPerEmpresa.values());
  console.log('Unique rows for ESTADO across all empresas:', uniqueRows.length);

  const rootRows = uniqueRows.filter(r => r.codigo_contabil === '1720.00.0.0.00' || r.codigo_contabil === '2420.00.0.0.00');
  console.log('\nRoot rows for ESTADO:');
  rootRows.forEach(r => {
    console.log(`   emp=${r.empresa} | cod=${r.codigo_contabil} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`);
  });

  const totalRootPI = rootRows.reduce((sum, r) => sum + Number(r.previsto_inicial || 0), 0);
  const totalRootAT = rootRows.reduce((sum, r) => sum + Number(r.arrecadado_total || 0), 0);
  console.log(`\nSUM OF ESTADO ROOTS ACROSS ALL EMPRESAS (EXCEPT CAMARA): PI=${totalRootPI} | AT=${totalRootAT}`);
}

testEstado().catch(console.error);
