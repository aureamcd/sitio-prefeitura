import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
import { buildTree } from '../lib/receitas/receitasTree';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
  const { data } = await s
    .schema('transparencia')
    .from('receitas_transferencias')
    .select('*')
    .eq('tipo', 'ESTADO')
    .eq('exercicio', 2026);

  const raw = (data || []).map((r: any) => ({
    id: r.id,
    codigo_contabil: r.codigo,
    descricao: r.especificacao,
    previsto_inicial: Number(r.previsao_inicial) || 0,
    previsto_atualizado: Number(r.previsao_atualizada) || 0,
    arrecadado_periodo: Number(r.arrecadado_periodo) || 0,
    arrecadado_total: Number(r.arrecadado_total) || 0,
    nivel: r.nivel,
    tipo_nivel: r.tipo_nivel,
    codigo_pai: r.codigo_pai,
  }));

  const tree = buildTree(raw);
  console.log('ESTADO Roots count:', tree.length);
  tree.forEach((r: any) => console.log('Root:', r.codigo, r.descricao, 'prev:', r.previsto, 'arr:', r.arrecadado, 'children:', r.filhos.length));
  let prevInicial = 0, prevAtualizado = 0, arrPeriodo = 0, arrTotal = 0;
  for (const root of tree) {
    prevInicial += root.previstoInicial || 0;
    prevAtualizado += root.previsto || 0;
    arrPeriodo += root.arrecadadoPeriodo || 0;
    arrTotal += root.arrecadado || 0;
  }
  console.log('ESTADO Totals summed from tree roots:', { prevInicial, prevAtualizado, arrPeriodo, arrTotal });
}

run();
