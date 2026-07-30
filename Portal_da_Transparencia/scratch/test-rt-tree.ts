import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Inline simple buildTree call or check exact rows
async function testRT() {
  const { data: rt } = await s
    .schema('transparencia')
    .from('receitas_transferencias')
    .select('*')
    .eq('exercicio', 2026)
    .ilike('tipo', 'uniao');
  
  console.log('RT uniao rows 2026:', rt?.length);

  const roots = rt?.filter(r => r.codigo === '1710.00.0.0.00' || r.codigo === '2410.00.0.0.00');
  console.log('\nROOTS in receitas_transferencias:');
  roots?.forEach(r => {
    console.log(`   cod=${r.codigo} | desc=${r.especificacao} | PI=${r.previsao_inicial} | AT=${r.arrecadado_total}`);
  });

  const sumPI = roots?.reduce((acc, r) => acc + Number(r.previsao_inicial || 0), 0);
  const sumAT = roots?.reduce((acc, r) => acc + Number(r.arrecadado_total || 0), 0);
  console.log(`\nSUM OF ROOTS IN RECEITAS_TRANSFERENCIAS (UNIAO 2026): PI=${sumPI} | AT=${sumAT}`);

  console.log('\nWhat about level 2/3 under 1710 in receitas_transferencias?');
  rt?.filter(r => r.codigo !== '1710.00.0.0.00' && r.codigo !== '2410.00.0.0.00').slice(0, 8).forEach(r => {
    console.log(`   cod=${r.codigo} | desc=${r.especificacao} | PI=${r.previsao_inicial} | AT=${r.arrecadado_total}`);
  });
}

testRT().catch(console.error);
