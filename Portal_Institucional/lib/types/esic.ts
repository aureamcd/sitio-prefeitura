/**
 * ========================================================
 * TIPOS — SISTEMA e-SIC
 * ========================================================
 *
 * Tipagem forte para o Serviço de Informação ao Cidadão.
 * Conformidade: Lei nº 12.527/2011, PNTP 2026.
 *
 * Fluxo de status:
 *   recebido → em_analise → respondido | indeferido | prorrogado
 *
 * @module lib/types/esic
 */

/* ── STATUS ── */
export type EsicStatus =
  | "recebido"
  | "em_analise"
  | "respondido"
  | "indeferido"
  | "prorrogado";

/* ── SOLICITAÇÃO (registro completo do banco) ── */
export interface EsicSolicitacao {
  id: string;
  protocolo: string;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  descricao: string;
  orgao_destinatario?: string;
  status: EsicStatus;
  resposta?: string;
  resposta_anexo_url?: string;
  justificativa_indeferimento?: string;
  data_prorrogacao?: string;
  motivo_prorrogacao?: string;
  created_at: string;
  updated_at: string;
  respondido_em?: string;
  prazo_resposta: string;
}

/* ── DADOS DO FORMULÁRIO (o que o cidadão preenche) ── */
export interface EsicFormData {
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  descricao: string;
  orgao_destinatario?: string;
}

/* ── CONSULTA PÚBLICA (protocolo + identificação) ── */
export interface EsicConsultaData {
  protocolo: string;
  email?: string;
  cpf?: string;
}

/* ── RESULTADO DA CONSULTA (sem dados sensíveis) ── */
export interface EsicConsultaResultado {
  protocolo: string;
  status: EsicStatus;
  descricao: string;
  resposta?: string;
  resposta_anexo_url?: string;
  justificativa_indeferimento?: string;
  created_at: string;
  updated_at: string;
  respondido_em?: string;
  prazo_resposta: string;
  data_prorrogacao?: string;
  motivo_prorrogacao?: string;
}

/* ── RESPOSTA DO ADMIN ── */
export interface EsicRespostaAdmin {
  status: EsicStatus;
  resposta?: string;
  resposta_anexo_url?: string;
  justificativa_indeferimento?: string;
  data_prorrogacao?: string;
  motivo_prorrogacao?: string;
}

/* ── ESTATÍSTICAS ── */
export interface EsicEstatisticas {
  total: number;
  recebidos: number;
  em_analise: number;
  respondidos: number;
  indeferidos: number;
  prorrogados: number;
  tempo_medio_resposta_dias: number;
}

/* ── CONFIG VISUAL DOS STATUS ── */
export const ESIC_STATUS_CONFIG: Record<EsicStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  recebido: {
    label: "Pedido Recebido",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "📥",
  },
  em_analise: {
    label: "Em Análise",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    icon: "🔍",
  },
  respondido: {
    label: "Respondido",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: "✅",
  },
  indeferido: {
    label: "Pedido Indeferido",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: "❌",
  },
  prorrogado: {
    label: "Prazo Prorrogado",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: "⏳",
  },
};
