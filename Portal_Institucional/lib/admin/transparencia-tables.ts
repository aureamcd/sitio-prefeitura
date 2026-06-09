import {
  DollarSign, Gavel, FileText, Handshake, Receipt, TrendingDown,
  RotateCcw, RefreshCw, Users, Landmark, HardHat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FieldType = "text" | "number" | "date" | "textarea" | "select" | "cpf_cnpj";

export type ColumnDef = {
  key: string;
  label: string;
  type?: FieldType;
  /** For list: treat as monetary (formatted BRL) */
  monetary?: boolean;
  /** For list: show in compact mode (hide on mobile) */
  hideMobile?: boolean;
  /** For list: custom width class */
  width?: string;
  /** For form: treat as read-only (show but don't allow edit) */
  readonly?: boolean;
  /** For form: make required */
  required?: boolean;
  /** For form: placeholder text */
  placeholder?: string;
  /** For form: options for select type */
  options?: string[];
  /** For form: full width (textarea) */
  fullWidth?: boolean;
  /** For list: custom render function */
  render?: (value: any, row: any) => string;
};

export type TableConfig = {
  slug: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  schema: "transparencia";
  table: string;
  /** Default order */
  orderBy: { column: string; ascending: boolean };
  /** Columns for list view */
  columns: ColumnDef[];
  /** Default visible columns on mobile */
  mobileColumns: string[];
  /** Fields for the form (create/edit) */
  formFields: ColumnDef[];
  /** Filter options (key → label map for dropdown filters) */
  filters?: {
    key: string;
    label: string;
    getOptions: (items: any[]) => { value: string; label: string }[];
  }[];
};

/* ─── Helper to format monetary values ─── */
export function fmtMoney(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const num = typeof v === "string" ? parseFloat(v) : v;
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── Helper to format dates ─── */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  if (d.includes("/")) return d;
  try {
    return new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  } catch {
    return d;
  }
}

/* ─── Helper to get unique years from data ─── */
export function getUniqueYears(items: any[]): number[] {
  const years = new Set<number>();
  items.forEach((item) => {
    const y = item.ano ? Number(item.ano) : null;
    if (y && !isNaN(y)) years.add(y);
  });
  return Array.from(years).sort((a, b) => b - a);
}

/* ─── Helper to get unique values for a key ─── */
export function getUniqueValues(items: any[], key: string): string[] {
  const vals = new Set<string>();
  items.forEach((item) => {
    if (item[key]) vals.add(String(item[key]));
  });
  return Array.from(vals).sort();
}

/* ════════════════════════════════════════════
   TABLE CONFIGURATIONS
════════════════════════════════════════════ */

export const TABELAS_TRANSPARENCIA: TableConfig[] = [
  {
    slug: "diarias",
    label: "Diárias",
    description: "Concessão de diárias a servidores municipais",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
    schema: "transparencia",
    table: "diarias",
    orderBy: { column: "data", ascending: false },
    columns: [
      { key: "favorecido", label: "Favorecido", width: "min-w-[180px]" },
      { key: "valor", label: "Valor", type: "number", monetary: true, hideMobile: true },
      { key: "data", label: "Data", type: "date", hideMobile: true },
      { key: "cargo", label: "Cargo", hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["favorecido", "valor", "ano"],
    formFields: [
      { key: "favorecido", label: "Favorecido", required: true },
      { key: "valor", label: "Valor", type: "number", required: true },
      { key: "data", label: "Data", type: "date" },
      { key: "cargo", label: "Cargo" },
      { key: "descricao", label: "Descrição", type: "textarea", fullWidth: true },
      { key: "orgao_nome", label: "Órgão" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "licitacoes",
    label: "Licitações",
    description: "Processos licitatórios do município",
    icon: Gavel,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    schema: "transparencia",
    table: "licitacoes_v2",
    orderBy: { column: "data_abertura", ascending: false },
    columns: [
      { key: "processo", label: "Processo", width: "w-32" },
      { key: "objeto", label: "Objeto", width: "min-w-[250px]" },
      { key: "modalidade", label: "Modalidade", hideMobile: true },
      { key: "valor_estimado", label: "Valor Estimado", type: "number", monetary: true, hideMobile: true },
      { key: "situacao", label: "Situação", hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["objeto", "valor_estimado", "ano"],
    formFields: [
      { key: "processo", label: "Nº do Processo", required: true },
      { key: "objeto", label: "Objeto", type: "textarea", fullWidth: true, required: true },
      { key: "modalidade", label: "Modalidade", required: true },
      { key: "valor_estimado", label: "Valor Estimado", type: "number" },
      { key: "data_abertura", label: "Data Abertura", type: "date" },
      { key: "situacao", label: "Situação", required: true },
      { key: "link_tce", label: "Link TCE-PI", fullWidth: true },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
      { key: "situacao", label: "Situação", getOptions: (items) => getUniqueValues(items, "situacao").map(v => ({ value: v, label: v })) },
      { key: "modalidade", label: "Modalidade", getOptions: (items) => getUniqueValues(items, "modalidade").map(v => ({ value: v, label: v })) },
    ],
  },

  {
    slug: "contratos",
    label: "Contratos",
    description: "Contratos administrativos firmados pelo município",
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    schema: "transparencia",
    table: "contratos_v2",
    orderBy: { column: "data_assinatura", ascending: false },
    columns: [
      { key: "numero", label: "Número", width: "w-24" },
      { key: "contratado", label: "Contratado", width: "min-w-[200px]" },
      { key: "objeto", label: "Objeto", width: "min-w-[200px]", hideMobile: true },
      { key: "valor", label: "Valor", type: "number", monetary: true, hideMobile: true },
      { key: "situacao", label: "Situação" },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["contratado", "valor", "ano"],
    formFields: [
      { key: "numero", label: "Nº do Contrato", required: true },
      { key: "contratado", label: "Contratado", required: true },
      { key: "cpf_cnpj", label: "CPF/CNPJ" },
      { key: "objeto", label: "Objeto", type: "textarea", fullWidth: true },
      { key: "valor", label: "Valor", type: "number" },
      { key: "processo", label: "Nº do Processo (Licitação)" },
      { key: "modalidade", label: "Modalidade" },
      { key: "data_assinatura", label: "Data Assinatura", type: "date" },
      { key: "data_inicio", label: "Data Início", type: "date" },
      { key: "data_fim", label: "Data Fim (Vigência)", type: "date" },
      { key: "situacao", label: "Situação" },
      { key: "link_tce", label: "Link TCE-PI", fullWidth: true },
      { key: "observacoes", label: "Observações", type: "textarea", fullWidth: true },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
      { key: "situacao", label: "Situação", getOptions: (items) => getUniqueValues(items, "situacao").map(v => ({ value: v, label: v })) },
      { key: "modalidade", label: "Modalidade", getOptions: (items) => getUniqueValues(items, "modalidade").map(v => ({ value: v, label: v })) },
    ],
  },

  {
    slug: "transferencias",
    label: "Convênios",
    description: "Transferências entre entidades (convênios e repasses)",
    icon: Handshake,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    schema: "transparencia",
    table: "transferencias",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "entidade_pagadora", label: "Pagadora", width: "min-w-[180px]" },
      { key: "entidade_recebedora", label: "Recebedora", width: "min-w-[180px]", hideMobile: true },
      { key: "repasse", label: "Repasse", type: "number", monetary: true },
      { key: "mes", label: "Mês", hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["entidade_pagadora", "repasse", "ano"],
    formFields: [
      { key: "entidade_pagadora", label: "Entidade Pagadora", required: true },
      { key: "entidade_recebedora", label: "Entidade Recebedora", required: true },
      { key: "repasse", label: "Valor do Repasse", type: "number" },
      { key: "devolucao", label: "Devolução", type: "number" },
      { key: "mes", label: "Mês", type: "number", placeholder: "1-12" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "receitas",
    label: "Receitas",
    description: "Receitas orçamentárias do município",
    icon: Receipt,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    schema: "transparencia",
    table: "receitas",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "codigo_contabil", label: "Código", width: "w-28" },
      { key: "descricao", label: "Descrição", width: "min-w-[200px]" },
      { key: "previsto_inicial", label: "Prev. Inicial", type: "number", monetary: true, hideMobile: true },
      { key: "arrecadado_total", label: "Arrecadado Total", type: "number", monetary: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["codigo_contabil", "descricao", "arrecadado_total", "ano"],
    formFields: [
      { key: "codigo_contabil", label: "Código Contábil", required: true },
      { key: "descricao", label: "Descrição", required: true },
      { key: "previsto_inicial", label: "Previsto Inicial", type: "number" },
      { key: "previsto_atualizado", label: "Previsto Atualizado", type: "number" },
      { key: "arrecadado_periodo", label: "Arrecadado no Período", type: "number" },
      { key: "arrecadado_total", label: "Arrecadado Total", type: "number" },
      { key: "fonte_recurso", label: "Fonte de Recurso" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "despesas",
    label: "Despesas",
    description: "Despesas empenhadas, liquidadas e pagas",
    icon: TrendingDown,
    color: "text-red-600",
    bgColor: "bg-red-50",
    schema: "transparencia",
    table: "despesas",
    orderBy: { column: "data_empenho", ascending: false },
    columns: [
      { key: "fornecedor_nome", label: "Fornecedor", width: "min-w-[200px]" },
      { key: "numero_empenho", label: "Empenho", hideMobile: true },
      { key: "valor_empenhado", label: "Empenhado", type: "number", monetary: true },
      { key: "valor_pago", label: "Pago", type: "number", monetary: true, hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["fornecedor_nome", "valor_empenhado", "ano"],
    formFields: [
      { key: "fornecedor_nome", label: "Fornecedor", required: true },
      { key: "numero_empenho", label: "Nº Empenho" },
      { key: "valor_empenhado", label: "Valor Empenhado", type: "number" },
      { key: "valor_liquidado", label: "Valor Liquidado", type: "number" },
      { key: "valor_pago", label: "Valor Pago", type: "number" },
      { key: "data_empenho", label: "Data Empenho", type: "date" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "restos-pagar",
    label: "Restos a Pagar",
    description: "Restos a pagar do município",
    icon: RotateCcw,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    schema: "transparencia",
    table: "restos_pagar",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "codigo", label: "Código", hideMobile: true },
      { key: "descricao", label: "Descrição", width: "min-w-[200px]" },
      { key: "empenhado", label: "Empenhado", type: "number", monetary: true },
      { key: "pago", label: "Pago", type: "number", monetary: true, hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["descricao", "empenhado", "ano"],
    formFields: [
      { key: "codigo", label: "Código" },
      { key: "descricao", label: "Descrição", type: "textarea", fullWidth: true },
      { key: "empenhado", label: "Valor Empenhado", type: "number" },
      { key: "liquidado", label: "Valor Liquidado", type: "number" },
      { key: "pago", label: "Valor Pago", type: "number" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "despesas-extra",
    label: "Despesas Extra",
    description: "Despesas extra-orçamentárias",
    icon: RefreshCw,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    schema: "transparencia",
    table: "despesas_extra_orcamentarias",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "codigo", label: "Código", width: "w-28", hideMobile: true },
      { key: "descricao", label: "Descrição", width: "min-w-[200px]" },
      { key: "nomenclatura", label: "Nomenclatura", hideMobile: true },
      { key: "pago", label: "Valor Pago", type: "number", monetary: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["descricao", "pago", "ano"],
    formFields: [
      { key: "codigo", label: "Código" },
      { key: "descricao", label: "Descrição", type: "textarea", fullWidth: true },
      { key: "nomenclatura", label: "Nomenclatura" },
      { key: "pago", label: "Valor Pago", type: "number" },
      { key: "data", label: "Data", type: "date" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "servidores",
    label: "Servidores",
    description: "Relação de servidores municipais e rendimentos",
    icon: Users,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    schema: "transparencia",
    table: "servidores",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "nome", label: "Nome", width: "min-w-[200px]" },
      { key: "cargo", label: "Cargo", hideMobile: true },
      { key: "lotacao", label: "Lotação", hideMobile: true },
      { key: "rendimentos", label: "Rendimentos", type: "number", monetary: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["nome", "rendimentos", "ano"],
    formFields: [
      { key: "nome", label: "Nome", required: true },
      { key: "cargo", label: "Cargo" },
      { key: "lotacao", label: "Lotação" },
      { key: "matricula", label: "Matrícula" },
      { key: "rendimentos", label: "Rendimentos", type: "number" },
      { key: "descontos", label: "Descontos", type: "number" },
      { key: "liquido", label: "Líquido", type: "number" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "emendas",
    label: "Emendas",
    description: "Emendas parlamentares recebidas pelo município",
    icon: Landmark,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    schema: "transparencia",
    table: "emendas",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "tipo_transferencia", label: "Tipo", hideMobile: true },
      { key: "receita_transferencia", label: "Receita", width: "min-w-[200px]" },
      { key: "empenhado", label: "Empenhado", type: "number", monetary: true },
      { key: "pago", label: "Pago", type: "number", monetary: true, hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["receita_transferencia", "empenhado", "ano"],
    formFields: [
      { key: "tipo_transferencia", label: "Tipo de Transferência" },
      { key: "receita_transferencia", label: "Receita da Transferência" },
      { key: "empenhado", label: "Valor Empenhado", type: "number" },
      { key: "liquidado", label: "Valor Liquidado", type: "number" },
      { key: "pago", label: "Valor Pago", type: "number" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "obras",
    label: "Obras",
    description: "Obras públicas municipais",
    icon: HardHat,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    schema: "transparencia",
    table: "obras",
    orderBy: { column: "ano", ascending: false },
    columns: [
      { key: "objeto", label: "Objeto", width: "min-w-[250px]" },
      { key: "localizacao", label: "Local", hideMobile: true },
      { key: "situacao", label: "Situação" },
      { key: "valor_total", label: "Valor Total", type: "number", monetary: true, hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["objeto", "situacao", "ano"],
    formFields: [
      { key: "objeto", label: "Objeto", type: "textarea", fullWidth: true, required: true },
      { key: "localizacao", label: "Localização" },
      { key: "situacao", label: "Situação" },
      { key: "valor_total", label: "Valor Total", type: "number" },
      { key: "valor_executado", label: "Valor Executado", type: "number" },
      { key: "percentual_executado", label: "% Executado", type: "number" },
      { key: "data_inicio", label: "Data Início", type: "date" },
      { key: "data_previsao_fim", label: "Previsão Término", type: "date" },
      { key: "empresa_responsavel", label: "Empresa Responsável" },
      { key: "ano", label: "Ano", type: "number", required: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
      { key: "situacao", label: "Situação", getOptions: (items) => getUniqueValues(items, "situacao").map(v => ({ value: v, label: v })) },
    ],
  },
];

/* ─── Slugs válidos (extraídos das configs) ─── */
export const SLUGS_TRANSPARENCIA = TABELAS_TRANSPARENCIA.map((t) => t.slug);

/* ─── Mapa slug → nome da tabela ─── */
export const SLUG_TO_TABLE: Record<string, string> = Object.fromEntries(
  TABELAS_TRANSPARENCIA.map((t) => [t.slug, t.table])
);

/* Get config by slug */
export function getTableConfig(slug: string): TableConfig | undefined {
  return TABELAS_TRANSPARENCIA.find((t) => t.slug === slug);
}
