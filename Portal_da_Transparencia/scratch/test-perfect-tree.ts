import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testPerfect() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');
  
  // 1. Dedup repeat imports inside same empresa
  const dedupPerEmpresa = new Map<string, any>();
  recs?.forEach(r => {
    const key = `${r.empresa}_${r.codigo_contabil}`;
    const existing = dedupPerEmpresa.get(key);
    if (!existing || Number(r.arrecadado_total || 0) > Number(existing.arrecadado_total || 0)) {
      dedupPerEmpresa.set(key, r);
    }
  });
  const uniqueRows = Array.from(dedupPerEmpresa.values());

  // 2. Group by codigo_contabil across entities for Consolidado
  const byCode = new Map<string, any[]>();
  uniqueRows.forEach(r => {
    const code = r.codigo_contabil;
    const list = byCode.get(code) || [];
    list.push(r);
    byCode.set(code, list);
  });

  const rootCodes = new Set(['1710.00.0.0.00', '2410.00.0.0.00']);

  let totalRootsPI = 0;
  let totalRootsAT = 0;

  console.log('\n--- CONSOLIDATED ROOTS ---');
  for (const [code, list] of byCode.entries()) {
    if (rootCodes.has(code)) {
      const pi = list.reduce((acc, r) => acc + (Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0), 0);
      const at = list.reduce((acc, r) => acc + (Number(r.arrecadado_total) || 0), 0);
      totalRootsPI += pi;
      totalRootsAT += at;
      console.log(`ROOT: cod=${code} | desc=${list[0].descricao} | PI=${pi} | AT=${at} (across ${list.length} entities)`);
    }
  }
  console.log(`GRAND TOTAL ROOTS PI=${totalRootsPI} | AT=${totalRootsAT}`);

  console.log('\n--- CHECKING NON-ROOT PARENTS AND LEAVES ---');
  const codesToCheck = ['1711.00.0.0.00', '1711.51.1.1.00', '1713.00.0.0.00', '1715.00.0.0.00'];
  for (const code of codesToCheck) {
    const list = byCode.get(code) || [];
    const maxPI = Math.max(...list.map(r => Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0));
    const sumPI = list.reduce((acc, r) => acc + (Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0), 0);
    const sumAT = list.reduce((acc, r) => acc + (Number(r.arrecadado_total) || 0), 0);
    console.log(`CODE: ${code} | desc=${list[0]?.descricao} | maxPI=${maxPI} | sumPI=${sumPI} | sumAT=${sumAT} (across ${list.length} entities)`);
  }
}

testPerfect().catch(console.error);
