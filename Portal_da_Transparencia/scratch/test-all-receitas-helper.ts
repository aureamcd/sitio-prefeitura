import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function buildTreeSimple(items: any[]) {
  const nodeMap = new Map<string, any>();
  for (const item of items) {
    const code = item.codigo_contabil || '';
    if (!code) continue;
    nodeMap.set(code, {
      codigo: code,
      descricao: item.descricao || '',
      previstoInicial: Number(item.previsto_inicial) || 0,
      previsto: Number(item.previsto_atualizado) || Number(item.previsto_inicial) || 0,
      arrecadado: Number(item.arrecadado_total) || 0,
      arrecadadoPeriodo: Number(item.arrecadado_periodo) || 0,
    });
  }
  const roots: any[] = [];
  for (const node of nodeMap.values()) {
    if (node.codigo.endsWith('.00.0.0.00') && (node.codigo.startsWith('10') || node.codigo.startsWith('20') || node.codigo.startsWith('70') || node.codigo.startsWith('80') || node.codigo.startsWith('90'))) {
      roots.push(node);
    }
  }
  return roots;
}

export function prepareConsolidatedTreeItems(rows: any[], isConsolidado: boolean) {
  const dedupPerEmpresa = new Map<string, any>();
  (rows || []).forEach(r => {
    const key = `${r.empresa}_${r.codigo_contabil || r.codigo}`;
    const existing = dedupPerEmpresa.get(key);
    if (!existing || Number(r.arrecadado_total || 0) > Number(existing.arrecadado_total || 0)) {
      dedupPerEmpresa.set(key, r);
    }
  });
  const uniqueRows = Array.from(dedupPerEmpresa.values());

  if (!isConsolidado) {
    return uniqueRows.map(r => ({
      id: r.id || String(Math.random()),
      codigo_contabil: r.codigo_contabil || r.codigo || '',
      descricao: r.descricao || r.especificacao || '',
      previsto_inicial: Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0,
      previsto_atualizado: Number(r.previsto_atualizado) || Number(r.previsao_atualizada) || Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0,
      arrecadado_periodo: Number(r.arrecadado_periodo) || 0,
      arrecadado_total: Number(r.arrecadado_total) || 0,
      fonte_recurso: r.fonte_recurso || null,
      nivel: r.nivel,
      tipo_nivel: r.tipo_nivel,
      codigo_pai: r.codigo_pai,
    }));
  }

  const byCode = new Map<string, any[]>();
  uniqueRows.forEach(r => {
    const code = r.codigo_contabil || r.codigo || '';
    if (!code) return;
    const list = byCode.get(code) || [];
    list.push(r);
    byCode.set(code, list);
  });

  const rootCodes = new Set([
    '1000.00.0.0.00', '2000.00.0.0.00', '7000.00.0.0.00', '8000.00.0.0.00', '9000.00.0.0.00',
    '1100.00.0.0.00', '1200.00.0.0.00', '1300.00.0.0.00', '1400.00.0.0.00', '1500.00.0.0.00',
    '1600.00.0.0.00', '1700.00.0.0.00', '1800.00.0.0.00', '1900.00.0.0.00', '2100.00.0.0.00',
    '2200.00.0.0.00', '2300.00.0.0.00', '2400.00.0.0.00', '2500.00.0.0.00'
  ]);

  const consolidated: any[] = [];
  for (const [code, list] of byCode.entries()) {
    const first = list[0];
    const isRoot = rootCodes.has(code) || (code.endsWith('.00.0.0.00') && code.split('.').filter(x => x !== '0' && x !== '00').length <= 2);

    let pi = 0;
    let pa = 0;
    if (isRoot) {
      pi = list.reduce((acc, r) => acc + (Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0), 0);
      pa = list.reduce((acc, r) => acc + (Number(r.previsto_atualizado) || Number(r.previsao_atualizada) || Number(r.previsto_inicial) || 0), 0);
    } else {
      pi = Math.max(...list.map(r => Number(r.previsto_inicial) || Number(r.previsao_inicial) || 0));
      pa = Math.max(...list.map(r => Number(r.previsto_atualizado) || Number(r.previsao_atualizada) || Number(r.previsto_inicial) || 0));
    }

    const ap = list.reduce((acc, r) => acc + (Number(r.arrecadado_periodo) || 0), 0);
    const at = list.reduce((acc, r) => acc + (Number(r.arrecadado_total) || 0), 0);

    consolidated.push({
      id: first.id || String(Math.random()),
      codigo_contabil: code,
      descricao: first.descricao || first.especificacao || '',
      previsto_inicial: pi,
      previsto_atualizado: pa,
      arrecadado_periodo: ap,
      arrecadado_total: at,
      fonte_recurso: first.fonte_recurso || null,
      nivel: first.nivel,
      tipo_nivel: first.tipo_nivel,
      codigo_pai: first.codigo_pai,
    });
  }

  return consolidated;
}

async function testAll() {
  const { data: recs } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2');

  const clean = prepareConsolidatedTreeItems(recs || [], true);
  const tree = buildTreeSimple(clean);
  let totalPI = 0;
  let totalAT = 0;
  console.log('--- ALL RECEITAS CONSOLIDATED ROOTS ---');
  tree.forEach(r => {
    console.log(`ROOT: cod=${r.codigo} | desc=${r.descricao} | PI=${r.previstoInicial} | AT=${r.arrecadado}`);
    totalPI += r.previstoInicial;
    totalAT += r.arrecadado;
  });
  console.log(`GRAND TOTAL ALL RECEITAS CONSOLIDATED: PI=${totalPI} | AT=${totalAT}`);
}

testAll().catch(console.error);
