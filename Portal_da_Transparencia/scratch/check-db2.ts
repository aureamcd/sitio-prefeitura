import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function check() {
  console.log('--- Checking receitas_transferencias for 2026 ---');
  const { data: rt } = await s
    .schema('transparencia')
    .from('receitas_transferencias')
    .select('*')
    .eq('exercicio', 2026);
  
  console.log('receitas_transferencias total 2026:', rt?.length);
  rt?.filter(r => r.codigo?.includes('1711')).forEach(r => {
    console.log(`[RT] id=${r.id} | cod=${r.codigo} | espec=${r.especificacao} | PI=${r.previsao_inicial} | AT=${r.arrecadado_total}`);
  });

  console.log('\n--- Checking receitas for 1711 in 2026 ---');
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .ilike('codigo_contabil', '1711%');
  
  console.log('receitas total for 1711 in 2026:', recs?.length);
  recs?.forEach(r => {
    console.log(`[REC] emp=${r.empresa} | cod=${r.codigo_contabil} | desc=${r.descricao} | PI=${r.previsto_inicial} | AT=${r.arrecadado_total}`);
  });
}

check().catch(console.error);
