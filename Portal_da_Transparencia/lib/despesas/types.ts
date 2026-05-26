/**
 * ========================================================
 * TIPOS — DESPESAS
 * ========================================================
 *
 * Tipos para as tabelas de despesas do Portal da Transparência:
 *   - despesas (execução orçamentária)
 *   - despesas_extra_orcamentarias
 *   - restos_pagar
 *
 * Schema real do banco em transparencia.despesas.
 *
 * @module lib/despesas/types
 */

/* ── Despesas (execução orçamentária) ───────────────── */

export interface DespesaRow {
  id: string;
  ano: number;

  /* Identificação do empenho */
  pkemp: string | null;
  codigo: string | null;
  tipo_empenho: string | null;          // Ordinário, Estimativo, Global
  numero_empenho: string | null;
  data_empenho: string | null;

  /* Fornecedor / Credor */
  fornecedor_codigo: string | null;
  fornecedor_nome: string | null;
  fornecedor_cpf_cnpj: string | null;

  /* Órgão / Unidade */
  orgao_unidade: string | null;
  orgao_nome: string | null;

  /* Classificação funcional */
  funcao_codigo: string | null;
  funcao_nome: string | null;
  subfuncao_codigo: string | null;
  subfuncao_nome: string | null;

  /* Natureza da despesa */
  natureza_codigo: string | null;
  natureza_nome: string | null;

  /* Fonte / Recurso */
  fonte_codigo: string | null;
  fonte_nome: string | null;
  recurso_codigo: string | null;
  recurso_nome: string | null;
  fonte_stn: string | null;

  /* Programa / Projeto-Atividade */
  programa_codigo: string | null;
  programa_nome: string | null;
  projeto_atividade_codigo: string | null;
  projeto_atividade_nome: string | null;

  /* Dotação orçamentária */
  dotacao_inicial: number | null;
  alteracao_dotacao: number | null;
  dotacao_atualizada: number | null;

  /* Valores executados */
  valor_empenhado: number | null;
  valor_liquidado: number | null;
  valor_pago: number | null;

  /* Valores acumulados até a data */
  empenhado_ate_data: number | null;
  liquidado_ate_data: number | null;
  pago_ate_data: number | null;

  /* Processo / Licitação / Origem */
  processo: string | null;
  licitacao: string | null;
  origem: string | null;

  created_at: string | null;
  updated_at: string | null;

  [key: string]: unknown;
}

/* ── Despesas Extra-orçamentárias ───────────────────── */

export interface DespesaExtraRow {
  id: string;
  ano: number;
  codigo: string | null;
  descricao: string | null;
  nomenclatura: string | null;
  historico: string | null;
  data: string | null;
  numero_guia: string | null;
  data_guia: string | null;
  cnpj_inscricao: string | null;
  codigo_adotado: string | null;
  pago: number | null;
  origem: string | null;
  created_at: string | null;
  [key: string]: unknown;
}

/* ── Restos a Pagar ─────────────────────────────────── */

export interface RestosPagarRow {
  id: string;
  ano: number;
  codigo: string | null;
  descricao: string | null;
  empenhado: number | null;
  liquidado: number | null;
  pago: number | null;
  origem: string | null;
  created_at: string | null;
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

export const TIPOS_EMPENHO = [
  { value: 'Ordinário', label: 'Ordinário' },
  { value: 'Estimativo', label: 'Estimativo' },
  { value: 'Global', label: 'Global' },
];

/* ── Helpers ────────────────────────────────────────── */

export function formatBRL(value: number | null | undefined): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatMesAno(dataString: string | null | undefined): string {
  if (!dataString) return '-';
  try {
    const d = new Date(dataString);
    const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const y = d.getUTCFullYear();
    return `${m}/${y}`;
  } catch {
    return '-';
  }
}

export function formatDateISO(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch {
    return '-';
  }
}
