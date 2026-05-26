/**
 * ========================================================
 * TIPOS — RECEITAS
 * ========================================================
 *
 * Tipos para as tabelas de receitas do Portal da Transparência:
 *   - receitas (árvore contábil)
 *   - divida_ativa
 *   - receitas_extra_orcamentarias
 *
 * Schema: transparencia.receitas
 *
 * @module lib/receitas/types
 */

/* ── Árvore contábil de receitas ───────────────────── */

export interface ReceitaNode {
  codigo: string;
  descricao: string;
  tipoNivel: string;
  previsto: number;          // previsto_atualizado
  previstoInicial: number;   // previsto_inicial
  arrecadado: number;        // arrecadado_total
  arrecadadoPeriodo: number;  // arrecadado_periodo
  fonteRecurso: string | null;
  level: number;
  isLeaf: boolean;
  filhos: ReceitaNode[];
}

export interface RawReceita {
  id: string;
  codigo_contabil: string;
  descricao: string;
  /** @deprecated Calculado a partir do codigo_contabil se ausente */
  nivel?: number;
  /** @deprecated Calculado a partir do codigo_contabil se ausente */
  tipo_nivel?: string;
  /** @deprecated Calculado a partir do codigo_contabil se ausente */
  codigo_pai?: string | null;
  previsto_inicial: number;
  previsto_atualizado: number;
  arrecadado_periodo: number;
  arrecadado_total: number;
  fonte_recurso: string | null;
}

export interface FlatTreeNode {
  node: ReceitaNode;
  depth: number;
}

/* ── Dívida Ativa ───────────────────────────────────── */

export interface DividaAtivaRow {
  id: string;
  ano: number;
  tipo: string;
  saldo_anterior: number;
  inscrito_ano: number;
  arrecadado_ano: number;
  saldo_atual: number;
}

/* ── Receitas Extra-orçamentárias ───────────────────── */

export interface ReceitaExtraRow {
  id: string;
  data_lancamento: string;
  descricao_receita: string;
  historico: string;
  valor: number;
  [key: string]: unknown;
}

/* ── Constantes compartilhadas ──────────────────────── */

export const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

export const PAGE_SIZE = 25;

/* ── Helpers ────────────────────────────────────────── */

export function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function realizacaoBg(pct: number): string {
  if (pct >= 100) return 'bg-emerald-50 text-emerald-700';
  if (pct >= 70) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}

/**
 * Retorna o nome legível do nível contábil.
 * Usa o `tipo_nivel` do banco (ex: "Categoria", "Origem", etc.)
 * com fallback por profundidade.
 */
export function getLevelName(tipoNivel: string | undefined, depth?: number): string {
  if (tipoNivel && tipoNivel !== 'undefined') return tipoNivel;
  switch (depth) {
    case 0: return 'Categoria';
    case 1: return 'Origem';
    case 2: return 'Espécie';
    case 3: return 'Rubrica';
    case 4: return 'Alínea';
    case 5: return 'Subalínea';
    case 6: return 'Detalhamento';
    default: return 'Item';
  }
}
