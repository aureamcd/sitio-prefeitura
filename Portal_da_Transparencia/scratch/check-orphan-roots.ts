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
    { start: 0, size: 1 },
    { start: 1, size: 1 },
    { start: 2, size: 1 },
    { start: 3, size: 1 },
    { start: 4, size: 2 },
    { start: 6, size: 1 },
    { start: 7, size: 1 },
    { start: 8, size: 2 },
  ];

  let deepestNonZero = -1;
  for (let i = 0; i < groups.length; i++) {
    const g = digits.slice(groups[i].start, groups[i].start + groups[i].size);
    if (g !== '0'.repeat(groups[i].size)) {
      deepestNonZero = i;
    }
  }

  if (deepestNonZero <= 0) return null;

  const parent = digits.split('');
  for (let i = groups[deepestNonZero].start; i < digits.length; i++) {
    parent[i] = '0';
  }

  return formatCodigo(parent.join(''));
}

function buildTree(items: any[]): any[] {
  const nodeMap = new Map<string, any>();
  const childrenMap = new Map<string, any[]>();
  const parentCodeMap = new Map<string, string | null>();

  for (const item of items) {
    const normalizedKey = normalizeCodigo(item.codigo_contabil);
    const node = {
      codigo: item.codigo_contabil,
      descricao: item.descricao,
      tipoNivel: item.tipo_nivel || '',
      previsto: Number(item.previsto_atualizado) || 0,
      previstoInicial: Number(item.previsto_inicial) || 0,
      arrecadado: Number(item.arrecadado_total) || 0,
      arrecadadoPeriodo: Number(item.arrecadado_periodo) || 0,
      fonteRecurso: item.fonte_recurso || null,
      level: Number(item.nivel) || 0,
      isLeaf: true,
      filhos: [],
    };
    nodeMap.set(normalizedKey, node);
    parentCodeMap.set(normalizedKey, item.codigo_pai);
  }

  const roots: any[] = [];
  function findExistingParent(codigoContabil: string): string | null {
    let current = codigoContabil;
    const visited = new Set<string>();
    while (current) {
      if (visited.has(current)) return null;
      visited.add(current);
      const parent = computeParentSafe(current);
      if (!parent) return null;
      if (nodeMap.has(parent)) return parent;
      current = parent;
    }
    return null;
  }

  for (const [normalizedKey, node] of nodeMap.entries()) {
    const codigo_pai = parentCodeMap.get(normalizedKey);
    if (codigo_pai && nodeMap.has(codigo_pai)) {
      const parentCode = codigo_pai;
      if (!childrenMap.has(parentCode)) childrenMap.set(parentCode, []);
      childrenMap.get(parentCode)!.push(node);
    } else {
      const ancestor = findExistingParent(node.codigo);
      if (ancestor && ancestor !== normalizedKey) {
        if (!childrenMap.has(ancestor)) childrenMap.set(ancestor, []);
        childrenMap.get(ancestor)!.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  for (const [parentCode, children] of childrenMap.entries()) {
    const parent = nodeMap.get(parentCode);
    if (parent) {
      parent.filhos = children;
      parent.isLeaf = false;
    }
  }

  return roots;
}

async function checkOrphans() {
  const { data: recsUniao } = await s
    .schema('transparencia')
    .from('receitas')
    .select('*')
    .eq('ano', 2026)
    .neq('empresa', '2')
    .or('codigo_contabil.ilike.171%,codigo_contabil.ilike.241%');

  const cleanUniao = prepareConsolidatedTreeItems(recsUniao || [], true, ['1710.00.0.0.00', '2410.00.0.0.00']);
  const tree = buildTree(cleanUniao);

  console.log(`Roots count: ${tree.length}`);
  for (const r of tree) {
    if (r.codigo !== '1710.00.0.0.00' && r.codigo !== '2410.00.0.0.00') {
      console.log(`ORPHAN ROOT: ${r.codigo} | desc=${r.descricao}`);
      let p = computeParentSafe(r.codigo);
      while (p) {
        console.log(`  -> parent code: ${p} | in cleanUniao? ${cleanUniao.some(x => x.codigo_contabil === p)}`);
        p = computeParentSafe(p);
      }
    }
  }
}

checkOrphans().catch(console.error);
