import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  console.log('=== RECEITAS_TRANSFERENCIAS ===');
  const { data: rt } = await s
    .schema('transparencia')
    .from('receitas_transferencias')
    .select('*')
    .eq('exercicio', 2026);
  
  console.log('RT 2026 columns:', rt && rt[0] ? Object.keys(rt[0]) : 'no data');
  const uniaoRT = rt?.filter(r => r.tipo?.toLowerCase() === 'uniao');
  console.log('RT 2026 Uniao count:', uniaoRT?.length);
  
  // Check if RT has empresa
  const rtEmpresas = new Set(rt?.map(r => r.empresa));
  console.log('RT 2026 empresas set:', Array.from(rtEmpresas));

  console.log('\n=== RECEITAS TABLE ===');
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('id, codigo_contabil, descricao, previsto_inicial, previsto_atualizado, arrecadado_total, empresa, ano')
    .eq('ano', 2026)
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');
  
  console.log('Receitas 2026 uniao count:', recs?.length);
  // Group by codigo_contabil and see why they duplicate
  const byCode = new Map<string, any[]>();
  recs?.forEach(r => {
    const list = byCode.get(r.codigo_contabil) || [];
    list.push(r);
    byCode.set(r.codigo_contabil, list);
  });

  console.log('\nChecking duplicate codes in receitas table:');
  for (const [code, list] of byCode.entries()) {
    if (list.length > 1 && code.startsWith('1711')) {
      console.log(`Code ${code} (${list.length} rows):`);
      list.forEach(r => console.log(`   emp=${r.empresa} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total} | desc=${r.descricao}`));
    }
  }
}

check().catch(console.error);
