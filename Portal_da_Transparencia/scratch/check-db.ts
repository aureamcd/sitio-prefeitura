import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  const { data: recs, error } = await s
    .schema('transparencia')
    .from('receitas')
    .select('codigo_contabil, descricao, previsto_inicial, previsto_atualizado, arrecadado_total, empresa, ano')
    .eq('ano', 2026)
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.172%,codigo_contabil.ilike.241%,codigo_contabil.ilike.242%');
  
  console.log('Error:', error);
  console.log('Count matching 171/172/241/242 in receitas table:', recs?.length);
  recs?.forEach(r => {
    if (r.codigo_contabil.endsWith('.00.0.0.00') || r.codigo_contabil.includes('1713') || r.codigo_contabil.includes('1715') || r.codigo_contabil.includes('1723')) {
      console.log(`[receitas] ${r.empresa} | ${r.codigo_contabil} | ${r.descricao} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`);
    }
  });

  // Also check distinct empresas inside receitas for these codes
  const empresasSet = new Set(recs?.map(r => r.empresa));
  console.log('Distinct empresas for transferencias codes in receitas table:', Array.from(empresasSet));
}

run().catch(console.error);
