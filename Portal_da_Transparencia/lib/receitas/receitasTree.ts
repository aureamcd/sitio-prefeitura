/**
 * ========================================================
 * RECEITAS — LÓGICA DA ÁRVORE CONTÁBIL
 * ========================================================
 *
 * Constrói a árvore hierárquica usando `codigo_pai` e `nivel`.
 * Caso esses campos não estejam no banco, são calculados a
 * partir do `codigo_contabil`.
 *
 * Hierarquia: Categoria → Origem → Espécie → Rubrica → Item
 *
 * @module lib/receitas/receitasTree
 */

import type { ReceitaNode, RawReceita, FlatTreeNode } from './types';

// ---------------------------------------------------------------------------
// Helpers — cálculo de hierarquia a partir do codigo_contabil
// ---------------------------------------------------------------------------

/** Extrai apenas dígitos do código contábil. */
function extractDigits(code: string): string {
  return code.replace(/[^\d]/g, '');
}

/** Garante 11 dígitos (padding com zeros à direita). */
function padCode(clean: string): string {
  return clean.padEnd(11, '0').slice(0, 11);
}

/** Formata 11 dígitos no padrão XXXX.XX.X.X.XX. */
function formatCodigo(clean: string): string {
  return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean[6]}.${clean[7]}.${clean.slice(8, 10)}`;
}

/**
 * Determina o nível hierárquico a partir do codigo_contabil.
 * Usa os dígitos para determinar a profundidade: quanto mais
 * zeros à direita, mais alto o nível.
 */
export function getNivelFromCodigo(codigo: string): number {
  const clean = padCode(extractDigits(codigo));

  // Nível 1: N0000000000 (ex: 1000.00.0.0.00)
  if (/^\d0{10}$/.test(clean)) return 1;
  // Nível 2: NN000000000 (ex: 1100.00.0.0.00)
  if (/^\d{2}0{9}$/.test(clean)) return 2;
  // Nível 3: NNNN0000000 (ex: 1111.00.0.0.00)
  if (/^\d{4}0{7}$/.test(clean)) return 3;
  // Nível 4: NNNN00.0.0.00
  if (/^\d{6}0{5}$/.test(clean)) return 4;
  return 5;
}

/** Retorna o nome do nível. */
export function getTipoNivelFromNivel(nivel: number): string {
  switch (nivel) {
    case 1: return 'Categoria';
    case 2: return 'Origem';
    case 3: return 'Espécie';
    case 4: return 'Rubrica';
    default: return 'Item';
  }
}

/**
 * Calcula o codigo_pai a partir do codigo_contabil.
 * O pai é o código do nível imediatamente superior.
 * Retorna null para nível 1 (raiz).
 */
export function getCodigoPaiFromCodigo(codigo: string): string | null {
  const clean = padCode(extractDigits(codigo));
  const nivel = getNivelFromCodigo(codigo);

  if (nivel === 1) return null;

  // Nível 2 → pai é nível 1
  if (nivel === 2) {
    return formatCodigo(clean[0].padEnd(11, '0'));
  }
  // Nível 3 → pai é nível 2
  if (nivel === 3) {
    return formatCodigo(clean.slice(0, 2).padEnd(11, '0'));
  }
  // Nível 4+ → pai é nível 3
  return formatCodigo(clean.slice(0, 4).padEnd(11, '0'));
}

/** Garante que RawReceita tenha nivel, tipo_nivel e codigo_pai preenchidos. */
function enrichRawReceita(item: RawReceita): {
  nivel: number;
  tipo_nivel: string;
  codigo_pai: string | null;
} & RawReceita {
  const nivel =
    item.nivel && item.nivel > 0
      ? item.nivel
      : getNivelFromCodigo(item.codigo_contabil);

  return {
    ...item,
    nivel,
    tipo_nivel:
      item.tipo_nivel && item.tipo_nivel !== 'undefined'
        ? item.tipo_nivel
        : getTipoNivelFromNivel(nivel),
    codigo_pai:
      item.codigo_pai != null
        ? item.codigo_pai
        : getCodigoPaiFromCodigo(item.codigo_contabil),
  };
}

// ---------------------------------------------------------------------------
// buildTree — constrói árvore usando codigo_pai
// ---------------------------------------------------------------------------

/**
 * Build a ReceitaNode tree using `codigo_pai` relationship.
 * If codigo_pai / nivel / tipo_nivel are not present in the DB,
 * they are computed client-side from codigo_contabil.
 */
export function buildTree(items: RawReceita[]): ReceitaNode[] {
  if (!items.length) return [];

  // 1. Enrich items with computed hierarchy fields if missing
  const enriched = items.map(enrichRawReceita);

  // 2. Create a map of all nodes keyed by codigo_contabil
  const nodeMap = new Map<string, ReceitaNode>();
  const childrenMap = new Map<string, ReceitaNode[]>();

  for (const item of enriched) {
    const node: ReceitaNode = {
      codigo: item.codigo_contabil,
      descricao: item.descricao,
      tipoNivel: item.tipo_nivel || '',
      previsto: Number(item.previsto_atualizado) || 0,
      previstoInicial: Number(item.previsto_inicial) || 0,
      arrecadado: Number(item.arrecadado_total) || 0,
      arrecadadoPeriodo: Number(item.arrecadado_periodo) || 0,
      fonteRecurso: item.fonte_recurso || null,
      level: Number(item.nivel) || 0,
      isLeaf: true,  // will be updated below
      filhos: [],
    };
    nodeMap.set(item.codigo_contabil, node);
  }

  // 3. Build parent-child relationships using codigo_pai
  const roots: ReceitaNode[] = [];

  for (const item of enriched) {
    const node = nodeMap.get(item.codigo_contabil)!;

    if (!item.codigo_pai || !nodeMap.has(item.codigo_pai)) {
      // Root node (no parent or parent not in dataset)
      roots.push(node);
    } else {
      // Has a parent
      const parentCode = item.codigo_pai;
      if (!childrenMap.has(parentCode)) {
        childrenMap.set(parentCode, []);
      }
      childrenMap.get(parentCode)!.push(node);
    }
  }

  // 4. Attach children to parents
  for (const [parentCode, children] of childrenMap) {
    const parent = nodeMap.get(parentCode);
    if (parent) {
      parent.filhos = children.sort((a, b) => a.codigo.localeCompare(b.codigo));
      parent.isLeaf = false;
    } else {
      // Parent not found in current dataset — treat children as roots
      roots.push(...children);
    }
  }

  // 5. Sort roots
  roots.sort((a, b) => a.codigo.localeCompare(b.codigo));

  return roots;
}

// ---------------------------------------------------------------------------
// Flatten helpers
// ---------------------------------------------------------------------------

/**
 * Flatten tree to a list for search filtering.
 * Returns all nodes (leaf and internal).
 */
export function flattenTree(nodes: ReceitaNode[]): ReceitaNode[] {
  const result: ReceitaNode[] = [];
  function walk(node: ReceitaNode) {
    result.push(node);
    if (node.filhos.length > 0) {
      node.filhos.forEach(walk);
    }
  }
  nodes.forEach(walk);
  return result;
}

/**
 * Flatten visible tree nodes based on expanded state.
 * Returns a flat array of { node, depth } for rendering as flat <tr> elements.
 */
export function flattenVisibleTree(
  roots: ReceitaNode[],
  expanded: Set<string>
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  function walk(nodes: ReceitaNode[], depth: number) {
    for (const node of nodes) {
      result.push({ node, depth });
      if (node.filhos.length > 0 && expanded.has(node.codigo)) {
        walk(node.filhos, depth + 1);
      }
    }
  }

  walk(roots, 0);
  return result;
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

/**
 * Build CSV for export with BOM for Excel compatibility.
 * Includes all columns required by PNTP 2026.
 */
export function buildCSV(nodes: ReceitaNode[]): string {
  const header = [
    'Código Contábil',
    'Descrição',
    'Nível',
    'Fonte de Recurso',
    'Previsto Inicial (R$)',
    'Previsto Atualizado (R$)',
    'Arrecadado no Período (R$)',
    'Arrecadado Total (R$)',
    '% Realização',
  ];
  const rows: string[] = [header.join(';')];

  function walk(node: ReceitaNode) {
    const pct = node.previsto > 0 ? (node.arrecadado / node.previsto) * 100 : 0;
    const desc = node.descricao.replace(/"/g, '""');
    const fonte = (node.fonteRecurso || '-').replace(/"/g, '""');
    rows.push([
      node.codigo,
      `"${desc}"`,
      node.tipoNivel || '-',
      `"${fonte}"`,
      node.previstoInicial.toFixed(2).replace('.', ','),
      node.previsto.toFixed(2).replace('.', ','),
      node.arrecadadoPeriodo.toFixed(2).replace('.', ','),
      node.arrecadado.toFixed(2).replace('.', ','),
      pct.toFixed(1).replace('.', ',') + '%',
    ].join(';'));
    node.filhos.forEach(walk);
  }
  nodes.forEach(walk);
  return '\uFEFF' + rows.join('\n');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a date string for display in tables.
 */
export function formatDate(dataString: string | null | undefined): string {
  if (!dataString) return '-';
  try {
    return new Date(dataString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return '-';
  }
}
