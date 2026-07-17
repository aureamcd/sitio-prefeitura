import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function clean() {
  const { data: all, error } = await supabase
    .schema('transparencia')
    .from('receitas')
    .select('id, codigo_contabil, previsto_atualizado, arrecadado_total')
    .eq('ano', 2026);

  if (error || !all) {
    console.error('Erro ao buscar receitas:', error);
    return;
  }

  const toDelete = all.filter((d) => 
    !d.codigo_contabil.includes('.') && 
    d.codigo_contabil.length <= 4 && 
    Number(d.previsto_atualizado) === 0 && 
    Number(d.arrecadado_total) === 0
  );

  console.log(`🗑️ Total de registros lixo/órfãos (sem pontos e zerados) encontrados em 2026: ${toDelete.length}`);

  if (toDelete.length > 0) {
    const ids = toDelete.map((d) => d.id);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      await supabase.schema('transparencia').from('receitas').delete().in('id', batch);
    }
    console.log('✅ Todos os registros lixo/órfãos zerados foram removidos do banco com sucesso!');
  }
}

clean().then(() => process.exit(0));
