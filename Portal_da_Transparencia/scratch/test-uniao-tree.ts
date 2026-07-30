import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { buildTree } from '../lib/receitas/receitasTree';
import { normalizeCodigo } from '../lib/receitas/receitasTree';
import type { RawReceita } from '../lib/receitas/types';

dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function testUniao(ano: number, entidade?: string) {
  let query = s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', ano);

  if (entidade) {
    query = query.eq('empresa', entidade);
  }

  const { data: rawData, error } = await query;
  if (error) {
    console.error('DB Error:', error);
    return;
  }

  // Filter uniao (171 or 241)
  const uniaoRaw = (rawData || []).filter(r => {
    const code = normalizeCodigo(r.codigo_contabil || '');
    return code.startsWith('171') || code.startsWith('241');
  });

  console.log(`[Ano ${ano}] [Entidade ${entidade || 'Consolidado'}] uniaoRaw rows count:`, uniaoRaw.length);

  // Totals calculated like in receitas page:
  // Root nodes in this filtered subset: either level === 1 OR their parent doesn't exist in uniaoRaw
  const codesSet = new Set(uniaoRaw.map(r => normalizeCodigo(r.codigo_contabil)));
  
  // Let's check roots of uniaoRaw
  let sumInicial = 0;
  let sumAtual = 0;
  let sumPeriodo = 0;
  let sumTotal = 0;

  // In uniao, the top-level categories of transfers are 1710.00.0.0.00 and 2410.00.0.0.00
  uniaoRaw.forEach(r => {
    const code = normalizeCodigo(r.codigo_contabil);
    if (code === '1710.00.0.0.00' || code === '2410.00.0.0.00') {
      sumInicial += Number(r.previsto_inicial) || 0;
      sumAtual += Number(r.previsto_atualizado) || 0;
      sumPeriodo += Number(r.arrecadado_periodo) || 0;
      sumTotal += Number(r.arrecadado_total) || 0;
    }
  });

  console.log(`UNIAO Totals (1710 + 2410 roots): PI=${sumInicial}, PA=${sumAtual}, AP=${sumPeriodo}, AT=${sumTotal}`);

  const tree = buildTree(uniaoRaw as RawReceita[]);
  console.log(`UNIAO buildTree top nodes count:`, tree.length);
  tree.forEach(node => {
    console.log(`  Top Node: ${node.codigo} | ${node.descricao} | PI: ${node.previsto} | AT: ${node.arrecadado}`);
  });
}

async function testEstado(ano: number, entidade?: string) {
  let query = s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', ano);

  if (entidade) {
    query = query.eq('empresa', entidade);
  }

  const { data: rawData, error } = await query;
  if (error) return;

  const estadoRaw = (rawData || []).filter(r => {
    const code = normalizeCodigo(r.codigo_contabil || '');
    return code.startsWith('172') || code.startsWith('242');
  });

  let sumInicial = 0;
  let sumAtual = 0;
  let sumPeriodo = 0;
  let sumTotal = 0;

  estadoRaw.forEach(r => {
    const code = normalizeCodigo(r.codigo_contabil);
    if (code === '1720.00.0.0.00' || code === '2420.00.0.0.00') {
      sumInicial += Number(r.previsto_inicial) || 0;
      sumAtual += Number(r.previsto_atualizado) || 0;
      sumPeriodo += Number(r.arrecadado_periodo) || 0;
      sumTotal += Number(r.arrecadado_total) || 0;
    }
  });

  console.log(`ESTADO Totals (1720 + 2420 roots): PI=${sumInicial}, PA=${sumAtual}, AP=${sumPeriodo}, AT=${sumTotal}`);
  const tree = buildTree(estadoRaw as RawReceita[]);
  console.log(`ESTADO buildTree top nodes count:`, tree.length);
  tree.forEach(node => {
    console.log(`  Top Node: ${node.codigo} | ${node.descricao} | PI: ${node.previsto} | AT: ${node.arrecadado}`);
  });
}

async function runAll() {
  console.log('=== TEST 2026 CONSOLIDADO ===');
  await testUniao(2026);
  await testEstado(2026);
}

runAll().catch(console.error);
