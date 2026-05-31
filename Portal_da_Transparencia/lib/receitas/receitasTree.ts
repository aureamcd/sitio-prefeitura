/**
 * ========================================================
 * RECEITAS — LÓGICA DA ÁRVORE CONTÁBIL
 * ========================================================
 *
 * Constrói a árvore hierárquica usando os valores de `nivel`,
 * `tipo_nivel` e `codigo_pai` armazenados no banco de dados
 * (importados corretamente da API). Apenas quando esses valores
 * estão ausentes no DB é feita a computação client-side.
 *
 * O formato de código utilizado é XXXX.XX.X.X.XX (10 dígitos
 * em 5 grupos), que corresponde à normalização do formato
 * original da API (1.0.00.00.00.00).
 *
 * Hierarquia: Categoria → Origem → Espécie → Rubrica → Alínea → Subalínea
 *
 * A computação client-side é feita por `computeParentSafe()`, que
 * identifica o grupo mais profundo com valor não-zero no código
 * e o zera (junto com todos os grupos à direita) para obter o pai.
 * Esta abordagem não depende de regex de nível, sendo robusta a
 * variações na quantidade de dígitos significativos.
 *
 * Quando um nível intermediário (ex: Nível 4) não existe no dataset,
 * a buildTree() sobe na hierarquia (findExistingParent) até encontrar
 * o ancestral mais próximo, garantindo que nós não virem raízes órfãs.
 *
 * @module lib/receitas/receitasTree
 */

import type { ReceitaNode, RawReceita, FlatTreeNode } from './types';

// ---------------------------------------------------------------------------
// Helpers — normalização e cálculo de hierarquia
// ---------------------------------------------------------------------------

/** Extrai apenas dígitos do código contábil. */
function extractDigits(code: string): string {
  return code.replace(/[^\d]/g, '');
}

/** Garante 10 dígitos (padding com zeros à direita). */
function padCode(clean: string): string {
  return clean.padEnd(10, '0').slice(0, 10);
}

/**
 * Formata 11 dígitos no padrão XXXX.XX.X.X.XX.
 * Ex: "10000000000" → "1000.00.0.0.00"
 */
function formatCodigo(clean: string): string {
  return `${clean.slice(0, 4)}.${clean.slice(4, 6)}.${clean[6]}.${clean[7]}.${clean.slice(8, 10)}`;
}

/**
 * Normaliza qualquer formato de codigo_contabil para o padrão
 * XXXX.XX.X.X.XX, que é o mesmo formato usado por
 * getCodigoPaiFromCodigo(). Isso garante que as chaves do
 * nodeMap e os códigos dos pais estejam sempre no mesmo formato.
 *
 * Ex: "1.0.00.00.00.00" → "1000.00.0.0.00"
 */
export function normalizeCodigo(codigo: string): string {
  const clean = padCode(extractDigits(codigo));
  return formatCodigo(clean);
}

/**
 * Determina o nível hierárquico a partir do codigo_contabil.
 */
export function getNivelFromCodigo(codigo: string): number {
  const clean = padCode(extractDigits(codigo));

  // Nível 1 (Categoria): N000000000 (ex: 1000.00.0.0.00)
  if (/^\d0{9}$/.test(clean)) return 1;
  // Nível 2 (Origem): NN00000000 (ex: 1100.00.0.0.00)
  if (/^\d{2}0{8}$/.test(clean)) return 2;
  // Nível 3 (Espécie): NNN0000000 (ex: 1110.00.0.0.00)
  if (/^\d{3}0{7}$/.test(clean)) return 3;
  // Nível 4 (Rubrica): NNNN000000 (ex: 1111.00.0.0.00)
  if (/^\d{4}0{6}$/.test(clean)) return 4;
  // Nível 5 (Alínea): NNNNNN0000 (ex: 1111.01.0.0.00)
  if (/^\d{6}0{4}$/.test(clean)) return 5;
  // Nível 6 (Subalínea): NNNNNNN000 (ex: 1111.01.1.0.00)
  if (/^\d{7}0{3}$/.test(clean)) return 6;
  // Nível 7 (Desdobramento 1): NNNNNNNN00 (ex: 1111.01.1.1.00)
  if (/^\d{8}0{2}$/.test(clean)) return 7;
  
  // Nível 8+: Detalhamento completo
  return 8;
}

/** Retorna o nome do nível. */
export function getTipoNivelFromNivel(nivel: number): string {
  switch (nivel) {
    case 1: return 'Categoria';
    case 2: return 'Origem';
    case 3: return 'Espécie';
    case 4: return 'Rubrica';
    case 5: return 'Alínea';
    case 6: return 'Subalínea';
    case 7: return 'Detalhamento';
    default: return 'Item';
  }
}

/**
 * Calcula o codigo_pai a partir do codigo_contabil usando a estrutura
 * de grupos do formato XXXX.XX.X.X.XX, sem depender de regex de nível.
 *
 * A lógica identifica o grupo mais profundo com valor não-zero e o
 * zera (junto com todos os grupos à direita) para obter o pai.
 *
 * Grupos do formato XXXX.XX.X.X.XX:
 *   [0-3, 4 dígitos][4-5, 2 dígitos][6, 1 dígito][7, 1 dígito][8-9, 2 dígitos]
 *
 * @returns Código no formato XXXX.XX.X.X.XX ou null (raiz).
 */
export function computeParentSafe(codigo: string): string | null {
  const digits = extractDigits(codigo).padEnd(10, '0').slice(0, 10);

  const groups = [
    { start: 0, size: 1 }, // Categoria
    { start: 1, size: 1 }, // Origem
    { start: 2, size: 1 }, // Espécie
    { start: 3, size: 1 }, // Rubrica
    { start: 4, size: 2 }, // Alínea
    { start: 6, size: 1 }, // Subalínea
    { start: 7, size: 1 }, // Desdobramento 1
    { start: 8, size: 2 }, // Detalhamento
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

/**
 * Calcula o codigo_pai a partir do codigo_contabil.
 * O pai é o código do nível imediatamente superior.
 * Retorna null para nível 1 (raiz).
 * NOTA: O código retornado está no formato XXXX.XX.X.X.XX.
 *
 * @deprecated Use computeParentSafe() — esta função usa detecção de
 * nível por regex que pode classificar incorretamente alguns códigos.
 */
export function getCodigoPaiFromCodigo(codigo: string): string | null {
  const clean = padCode(extractDigits(codigo));
  const nivel = getNivelFromCodigo(codigo);

  if (nivel === 1) return null;

  if (nivel === 2) {
    return formatCodigo(clean[0].padEnd(11, '0'));
  }
  if (nivel === 3) {
    return formatCodigo(clean.slice(0, 2).padEnd(11, '0'));
  }
  if (nivel === 4) {
    return formatCodigo(clean.slice(0, 4).padEnd(11, '0'));
  }
  if (nivel === 5) {
    return formatCodigo(clean.slice(0, 6).padEnd(11, '0'));
  }
  if (nivel === 6) {
    return formatCodigo(clean.slice(0, 7).padEnd(11, '0'));
  }
  // Nível 7+
  return formatCodigo(clean.slice(0, 8).padEnd(11, '0'));
}

// ---------------------------------------------------------------------------
// buildTree — constrói árvore usando codigo_pai
// ---------------------------------------------------------------------------

/**
 * Normaliza codigo_pai do banco (formato simples de 11 dígitos,
 * ex: "13210100000") para o formato XXXX.XX.X.X.XX.
 */
function normalizeDBPai(pai: string): string {
  const clean = pai.replace(/[^\d]/g, '').padEnd(10, '0').slice(0, 10);
  return formatCodigo(clean);
}

/**
 * Build a ReceitaNode tree using DB-stored hierarchy fields.
 *
 * A árvore usa os valores `nivel`, `tipo_nivel` e `codigo_pai`
 * armazenados no banco (importados corretamente da API). Apenas
 * quando esses valores estão ausentes é feita a computação
 * client-side via computeParentSafe().
 *
 * Todas as chaves do nodeMap são normalizadas via normalizeCodigo()
 * para o formato XXXX.XX.X.X.XX.
 */
export function buildTree(items: RawReceita[]): ReceitaNode[] {
  if (!items.length) return [];

  // 1. Usa valores do banco; fallback para computação local apenas
  //    quando o DB não tiver o campo preenchido.
  const enriched = items.map((item) => {
    const nivel = item.nivel ?? getNivelFromCodigo(item.codigo_contabil);
    const tipoNivel = item.tipo_nivel ?? getTipoNivelFromNivel(nivel);

    return {
      codigo_contabil: item.codigo_contabil,
      descricao: item.descricao,
      previsto_atualizado: item.previsto_atualizado,
      previsto_inicial: item.previsto_inicial,
      arrecadado_total: item.arrecadado_total,
      arrecadado_periodo: item.arrecadado_periodo,
      fonte_recurso: item.fonte_recurso,
      nivel,
      tipo_nivel: tipoNivel,
      // Normaliza codigo_pai do DB (11 dígitos) para XXXX.XX.X.X.XX
      codigo_pai: item.codigo_pai ? normalizeDBPai(item.codigo_pai) : null,
    };
  });

  // 2. Cria nodeMap com chave no formato XXXX.XX.X.X.XX
  const nodeMap = new Map<string, ReceitaNode>();
  const childrenMap = new Map<string, ReceitaNode[]>();
  const parentCodeMap = new Map<string, string | null>();

  for (const item of enriched) {
    const normalizedKey = normalizeCodigo(item.codigo_contabil);

    if (nodeMap.has(normalizedKey)) {
      const existing = nodeMap.get(normalizedKey)!;
      existing.previsto += Number(item.previsto_atualizado) || 0;
      existing.previstoInicial += Number(item.previsto_inicial) || 0;
      existing.arrecadado += Number(item.arrecadado_total) || 0;
      existing.arrecadadoPeriodo += Number(item.arrecadado_periodo) || 0;
      continue;
    }

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
      isLeaf: true,
      filhos: [],
    };
    nodeMap.set(normalizedKey, node);
    parentCodeMap.set(normalizedKey, item.codigo_pai);
  }

  // 3. Constrói relações pai-filho
  const roots: ReceitaNode[] = [];

  // Helper: sobe na hierarquia usando computeParentSafe (sem regex de nível)
  // para encontrar o ancestral mais próximo que existe no dataset.
  function findExistingParent(codigoContabil: string): string | null {
    let current = codigoContabil;
    const visited = new Set<string>();
    while (current) {
      if (visited.has(current)) return null; // safety: avoid infinite loop
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

    if (!codigo_pai) {
      roots.push(node);
    } else if (nodeMap.has(codigo_pai)) {
      // Pai direto existe no dataset
      const parentCode = codigo_pai;
      if (!childrenMap.has(parentCode)) {
        childrenMap.set(parentCode, []);
      }
      childrenMap.get(parentCode)!.push(node);
    } else {
      // Pai direto não está no dataset — sobe na hierarquia
      const ancestor = findExistingParent(node.codigo);
      if (ancestor) {
        if (!childrenMap.has(ancestor)) {
          childrenMap.set(ancestor, []);
        }
        childrenMap.get(ancestor)!.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  // 4. Anexa filhos aos pais
  for (const [parentCode, children] of childrenMap) {
    const parent = nodeMap.get(parentCode);
    if (parent) {
      parent.filhos = children.sort((a, b) => a.codigo.localeCompare(b.codigo));
      parent.isLeaf = false;
    } else {
      roots.push(...children);
    }
  }

  // 6. Ordena raízes
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
