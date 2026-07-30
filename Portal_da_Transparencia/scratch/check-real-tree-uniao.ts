import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

function prepareConsolidatedTreeItems(rows: any[], isConsolidado: boolean, rootPrefixes?: string[]) {
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
    '1710.00.0.0.00', '2410.00.0.0.00', '1720.00.0.0.00', '2420.00.0.0.00',
    '1000.00.0.0.00', '1100.00.0.0.00', '1200.00.0.0.00', '1300.00.0.0.00',
    '1400.00.0.0.00', '1500.00.0.0.00', '1600.00.0.0.00', '1700.00.0.0.00',
    '1800.00.0.0.00', '1900.00.0.0.00', '2000.00.0.0.00', '2100.00.0.0.00',
    '2200.00.0.0.00', '2300.00.0.0.00', '2400.00.0.0.00', '2500.00.0.0.00',
    '7000.00.0.0.00', '8000.00.0.0.00', '9000.00.0.0.00'
  ]);

  const consolidated: any[] = [];
  for (const [code, list] of byCode.entries()) {
    const first = list[0];
    const isRoot = rootCodes.has(code) || (rootPrefixes && rootPrefixes.some(p => code === p || (code.startsWith(p) && code.endsWith('.00.0.0.00') && code.split('.').filter(x => x !== '0' && x !== '00').length <= 2)));

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

function extractDigits(code: string): string {
  return code.replace(/[^\d]/g, '');
}
function padCode(clean: string): string {
  return clean.padEnd(10, '0').slice(0, 10);
}
function formatCodigo(clean: string): string {
  return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean[6]}.${clean[7]}.${clean.slice(8, 10)}`;
}
function normalizeCodigo(codigo: string): string {
  const clean = padCode(extractDigits(codigo));
  return formatCodigo(clean);
}
function computeParentSafe(codigo: string): string | null {
  const digits = extractDigits(codigo).padEnd(10, '0').slice(0, 10);
  const groups = [
    { start: 0, end: 4 },
    { start: 4, end: 6 },
    { start: 6, end: 7 },
    { start: 7, end: 8 },
    { start: 8, end: 10 },
  ];
  let deepest = -1;
  for (let i = groups.length - 1; i >= 0; i--) {
    const part = digits.slice(groups[i].start, groups[i].end);
    if (!/^0+$/.test(part)) { deepest = i; break; }
  }
  if (deepest <= 0) return null;
  const parentDigits = digits.split('');
  for (let i = deepest; i < groups.length; i++) {
    for (let j = groups[i].start; j < groups[i].end; j++) { parentDigits[j] = '0'; }
  }
  return formatCodigo(parentDigits.join(''));
}

function buildTree(rawItems: any[]): any[] {
  const nodeMap = new Map<string, any>();
  for (const item of rawItems) {
    const cleanCode = normalizeCodigo(item.codigo_contabil || '');
    if (!cleanCode) continue;
    nodeMap.set(cleanCode, {
      id: item.id,
      codigo: cleanCode,
      descricao: item.descricao,
      previstoInicial: item.previsto_inicial,
      previsto: item.previsto_atualizado,
      arrecadadoPeriodo: item.arrecadado_periodo,
      arrecadado: item.arrecadado_total,
      filhos: [],
    });
  }

  const roots: any[] = [];
  for (const [code, node] of nodeMap.entries()) {
    const parentCode = computeParentSafe(code);
    if (!parentCode || parentCode === code) {
      roots.push(node);
      continue;
    }
    const parentNode = nodeMap.get(parentCode);
    if (parentNode) {
      parentNode.filhos.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

async function checkRealTree() {
  const { data: recsUniao } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');

  const cleanUniao = prepareConsolidatedTreeItems(recsUniao || [], true, ['1710.00.0.0.00', '2410.00.0.0.00']);
  const tree = buildTree(cleanUniao);

  console.log(`Real tree length for Uniao: ${tree.length}`);
  let prevInicial = 0;
  let prevAtualizado = 0;
  let arrPeriodo = 0;
  let arrTotal = 0;
  for (const root of tree) {
    console.log(`Root node in tree: ${root.codigo} - ${root.descricao} | PI=${root.previstoInicial} | AT=${root.arrecadado}`);
    prevInicial += root.previstoInicial || 0;
    prevAtualizado += root.previsto || 0;
    arrPeriodo += root.arrecadadoPeriodo || 0;
    arrTotal += root.arrecadado || 0;
  }
  console.log(`Summary Totals from tree loop: PI=${prevInicial} | AT=${arrTotal}`);
}

checkRealTree().catch(console.error);
