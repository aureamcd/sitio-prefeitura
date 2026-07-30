import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkLeaves() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('empresa, codigo_contabil, descricao, previsto_inicial, arrecadado_total, nivel')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .ilike('codigo_contabil', '1711%');
  
  // Dedup exact repeats inside same empresa:
  const dedup = new Map<string, any>();
  recs?.forEach(r => {
    const key = `${r.empresa}_${r.codigo_contabil}`;
    dedup.set(key, r);
  });

  console.log('Unique 1711 rows across all companies:');
  Array.from(dedup.values()).forEach(r => {
    console.log(`   emp=${r.empresa} | cod=${r.codigo_contabil} | desc=${r.descricao} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`);
  });
}

checkLeaves().catch(console.error);
