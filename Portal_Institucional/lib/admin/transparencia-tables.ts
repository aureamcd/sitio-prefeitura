import {
  DollarSign, Gavel, FileText, Handshake, Receipt, TrendingDown,
  RotateCcw, RefreshCw, Users, Landmark, HardHat, Clock,
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
  /** Default order (can be single or multiple) */
  orderBy: { column: string; ascending: boolean } | { column: string; ascending: boolean }[];
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
    slug: "licitacoes",
    label: "Licitações",
    description: "Processos licitatórios do município",
    icon: Gavel,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    schema: "transparencia",
    table: "licitacoes_v2",
    orderBy: [{ column: "ano", ascending: false }, { column: "numero", ascending: false }],
    columns: [
      { key: "numero", label: "Nº Licitação", width: "w-32" },
      { key: "objeto", label: "Objeto", width: "min-w-[250px]" },
      { key: "modalidade", label: "Modalidade", hideMobile: true },
      { key: "data_abertura", label: "Data Abertura", type: "date", hideMobile: true },
      { key: "valor_estimado", label: "Valor", type: "number", monetary: true, hideMobile: true },
      { key: "situacao", label: "Situação", hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["numero", "objeto", "ano"],
    formFields: [
      { key: "numero", label: "Nº da Licitação", required: true, placeholder: "ex: 001/2026" },
      { key: "processo", label: "Nº do Processo", placeholder: "ex: 028/2023" },
      { key: "objeto", label: "Objeto", type: "textarea", fullWidth: true, required: true },
      { key: "modalidade", label: "Modalidade", required: true, placeholder: "ex: Pregão, Dispensa, Concorrência" },
      { key: "tipo_licitacao", label: "Tipo (Eletrônica/Presencial)" },
      { key: "situacao", label: "Situação", required: true, placeholder: "ex: Finalizada, Em Andamento, Divulgada" },
      { key: "valor_estimado", label: "Valor Estimado", type: "number" },
      { key: "valor_homologado", label: "Valor Homologado", type: "number" },
      { key: "data_abertura", label: "Data Abertura", type: "date" },
      { key: "data_encerramento", label: "Data Encerramento", type: "date" },
      { key: "registro_preco", label: "Registro de Preço?", type: "select", options: ["sim", "não"] },
      { key: "carona", label: "Carona (Adesão SRP)?", type: "select", options: ["sim", "não"] },
      { key: "empresa", label: "Cód. Entidade (Max 10 letras)", placeholder: "ex: 1 (PM), 3 (FMS)" },
      { key: "empresa_nome", label: "Nome da Entidade", placeholder: "ex: Prefeitura de Padre Marcos" },
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
    orderBy: [{ column: "ano", ascending: false }, { column: "numero", ascending: false }],
    columns: [
      { key: "numero", label: "Número", width: "w-24" },
      { key: "contratado", label: "Contratado", width: "min-w-[200px]" },
      { key: "objeto", label: "Objeto", width: "min-w-[200px]", hideMobile: true },
      { key: "fiscal_nome", label: "Fiscal", hideMobile: true },
      { key: "data_inicio", label: "Vigência", hideMobile: true, render: (_, row) => {
          if (!row.data_inicio && !row.data_fim) return "—";
          const i = row.data_inicio ? fmtDate(row.data_inicio) : "—";
          const f = row.data_fim ? fmtDate(row.data_fim) : "—";
          return `${i} até ${f}`;
      }},
      { key: "valor", label: "Valor", type: "number", monetary: true, hideMobile: true },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["contratado", "valor", "ano"],
    formFields: [
      { key: "numero", label: "Nº do Contrato", required: true },
      { key: "contratado", label: "Contratado", required: true },
      { key: "cpf_cnpj", label: "CPF/CNPJ" },
      { key: "objeto", label: "Objeto", type: "textarea", fullWidth: true },
      { key: "valor", label: "Valor", type: "number" },
      { key: "fiscal_nome", label: "Fiscal do Contrato", placeholder: "Nome do servidor responsável pelo acompanhamento" },
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
    slug: "emendas",
    label: "Emendas Parlamentares",
    description: "Emendas parlamentares recebidas (Federais, Estaduais e Municipais) — Critério 17 do PNTP",
    icon: Landmark,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    schema: "transparencia",
    table: "cadastro_emendas",
    orderBy: [{ column: "ano", ascending: false }, { column: "numero_emenda", ascending: false }],
    columns: [
      { key: "numero_emenda", label: "Nº Emenda", width: "w-36" },
      { key: "parlamentar", label: "Autor/Parlamentar", width: "min-w-[200px]" },
      { key: "tipo", label: "Tipo/Esfera", hideMobile: true },
      { key: "valor_previsto", label: "Valor Previsto", type: "number", monetary: true },
      { key: "valor_repassado", label: "Valor Repassado", type: "number", monetary: true, hideMobile: true },
      { key: "pdf_url", label: "Documento", render: (val: any) => val ? "Anexado (PDF)" : "Sem anexo" },
      { key: "ano", label: "Ano", width: "w-16" },
    ],
    mobileColumns: ["numero_emenda", "parlamentar", "valor_previsto", "ano"],
    formFields: [
      { key: "ano", label: "Ano do Exercício", type: "number", required: true },
      { key: "numero_emenda", label: "Código / Nº da Emenda (ou Proposta)", required: true, placeholder: "ex: 36000717468202500" },
      { key: "parlamentar", label: "Autor / Parlamentar (ou Bancada/Comissão)", required: true, placeholder: "ex: JÚLIO CESAR ou BANCADA DO PIAUÍ" },
      { key: "tipo", label: "Tipo / Modalidade", placeholder: "ex: Emenda Individual, Emenda Bancada, Transferência Especial" },
      { key: "beneficiario", label: "Função de Governo / Órgão Beneficiário", placeholder: "ex: Fundo Municipal de Saúde" },
      { key: "objeto", label: "Objeto da Emenda / Descrição da Despesa", type: "textarea", fullWidth: true, placeholder: "ex: Custeio da Atenção Primária à Saúde (PAB)" },
      { key: "valor_previsto", label: "Valor Previsto / Empenhado (R$)", type: "number", required: true },
      { key: "valor_repassado", label: "Valor Recebido / Repassado (R$)", type: "number" },
      { key: "pdf_url", label: "Link do Documento (R2/Drive ou URL do PDF)", fullWidth: true, placeholder: "https://pub-...r2.dev/emendas/2025/..." },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
    ],
  },

  {
    slug: "obras",
    label: "Obras Públicas",
    description: "Gestão das obras e serviços de engenharia (Critério 10 do PNTP)",
    icon: HardHat,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    schema: "transparencia",
    table: "obras",
    orderBy: { column: "data_inicio", ascending: false },
    columns: [
      { key: "contrato_numero", label: "Nº Contrato", width: "w-28" },
      { key: "objeto", label: "Objeto da Obra", width: "min-w-[250px]" },
      { key: "situacao", label: "Situação" },
      { key: "empresa_responsavel", label: "Contratada", hideMobile: true },
      { key: "valor_total", label: "Valor (R$)", type: "number", monetary: true, hideMobile: true },
    ],
    mobileColumns: ["contrato_numero", "objeto", "situacao"],
    formFields: [
      { key: "ano", label: "Ano Base", type: "number", required: true },
      { key: "empresa", label: "Cód. Entidade (1=PM, 3=FMS, 4=FME, 5=FMAS)", type: "number", required: true, placeholder: "1" },
      { key: "contrato_numero", label: "Nº do Contrato", required: true, placeholder: "ex: 008/2026" },
      { key: "licitacao", label: "Licitação (Origem)", placeholder: "ex: CONCORRÊNCIA Nº 013/2025" },
      { key: "empresa_responsavel", label: "Razão Social (Empresa contratada)", required: true },
      { key: "cnpj_empresa", label: "CNPJ", type: "cpf_cnpj" },
      { key: "objeto", label: "Objeto / Descrição da Obra", type: "textarea", fullWidth: true, required: true },
      { key: "localizacao", label: "Localização", placeholder: "ex: Povoado Retiro", fullWidth: true },
      { key: "situacao", label: "Situação da Obra", type: "select", options: ["Em andamento", "Concluída", "Paralisada", "Cancelada"], required: true },
      { key: "data_inicio", label: "Data de Início", type: "date", required: true },
      { key: "data_previsao_fim", label: "Data de Previsão de Fim", type: "date" },
      { key: "percentual_executado", label: "Percentual Executado (%)", type: "number", placeholder: "ex: 45.5" },
      { key: "valor_total", label: "Valor Total da Obra (R$)", type: "number" },
      { key: "valor_executado", label: "Valor Executado / Pago (R$)", type: "number" },
      { key: "motivo_paralisacao", label: "Motivo da Paralisação (se houver)", type: "text", placeholder: "ex: Falta de repasse" },
      { key: "responsavel_inexecucao", label: "Responsável pela Inexecução (se houver)", type: "text" },
      { key: "data_prevista_reinicio", label: "Data Prevista p/ Reinício (se paralisada)", type: "date" },
      { key: "link_tce", label: "Link do TCE (se houver)", type: "text", fullWidth: true },
    ],
    filters: [
      { key: "ano", label: "Ano", getOptions: (items) => getUniqueYears(items).map(a => ({ value: String(a), label: String(a) })) },
      { key: "situacao", label: "Situação", getOptions: (items) => getUniqueValues(items, "situacao").map(s => ({ value: s, label: s })) },
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
