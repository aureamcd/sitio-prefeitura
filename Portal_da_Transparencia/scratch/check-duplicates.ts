import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function checkDupes() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('id, codigo_contabil, descricao, previsto_inicial, previsto_atualizado, arrecadado_total, empresa, ano, data_importacao, mes_importacao, data_lancamento')
    .eq('ano', 2026)
    .ilike('codigo_contabil', '171%');
  
  console.log('Total 171 rows in receitas 2026:', recs?.length);
  
  const byCodeEmp = new Map<string, any[]>();
  recs?.forEach(r => {
    const key = `${r.empresa}_${r.codigo_contabil}`;
    const list = byCodeEmp.get(key) || [];
    list.push(r);
    byCodeEmp.set(key, list);
  });

  for (const [key, list] of byCodeEmp.entries()) {
    if (list.length > 1) {
      console.log(`Duplicate key: ${key} (${list.length} rows):`);
      list.forEach(r => console.log(`   id=${r.id} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total} | data_imp=${r.data_importacao} | mes_imp=${r.mes_importacao} | dt_lanc=${r.data_lancamento}`));
    }
  }

  console.log('\nLet us see what happens if we sum ALL rows with code 1711.00.0.0.00 right now across all rows:');
  const c1711 = recs?.filter(r => r.codigo_contabil === '1711.00.0.0.00' || r.codigo_contabil.includes('1711.00'));
  console.log('c1711 count:', c1711?.length);
  c1711?.forEach(r => console.log(`   emp=${r.empresa} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`));

  console.log('\nLet us see what happens if we sum ALL rows with code 1710.00.0.0.00 right now across all rows:');
  const c1710 = recs?.filter(r => r.codigo_contabil === '1710.00.0.0.00' || r.codigo_contabil.includes('1710.00'));
  console.log('c1710 count:', c1710?.length);
  c1710?.forEach(r => console.log(`   emp=${r.empresa} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`));
}

checkDupes().catch(console.error);
