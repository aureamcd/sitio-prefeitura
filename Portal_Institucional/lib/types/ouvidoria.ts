/**
 * ========================================================
 * TIPOS — SISTEMA DE OUVIDORIA
 * ========================================================
 * Mesma arquitetura do e-SIC, adaptado para manifestações.
 * @module lib/types/ouvidoria
 */

export type OuvidoriaTipo =
  | "denuncia"
  | "reclamacao"
  | "solicitacao"
  | "sugestao"
  | "elogio";

export type OuvidoriaStatus =
  | "recebido"
  | "em_analise"
  | "respondido"
  | "indeferido"
  | "prorrogado";

export interface OuvidoriaManifestacao {
  id: string;
  protocolo: string;
  tipo: OuvidoriaTipo;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  descricao: string;
  orgao_destinatario?: string;
  status: OuvidoriaStatus;
  resposta?: string;
  resposta_anexo_url?: string;
  justificativa_indeferimento?: string;
  data_prorrogacao?: string;
  motivo_prorrogacao?: string;
  created_at: string;
  updated_at: string;
  respondido_em?: string;
  prazo_resposta: string;
  anonimo: boolean;
  anexo_url?: string;
}

export interface OuvidoriaFormData {
  tipo: OuvidoriaTipo;
  nome: string;
  email: string;
  cpf?: string;
  telefone?: string;
  descricao: string;
  orgao_destinatario?: string;
  anonimo: boolean;
  anexo?: File;
}

export interface OuvidoriaConsultaResultado {
  protocolo: string;
  tipo: OuvidoriaTipo;
  status: OuvidoriaStatus;
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

export interface OuvidoriaRespostaAdmin {
  status: OuvidoriaStatus;
  resposta?: string;
  resposta_anexo_url?: string;
  justificativa_indeferimento?: string;
  data_prorrogacao?: string;
  motivo_prorrogacao?: string;
}

export interface OuvidoriaEstatisticas {
  total: number;
  recebidos: number;
  em_analise: number;
  respondidos: number;
  indeferidos: number;
  prorrogados: number;
  tempo_medio_resposta_dias: number;
  por_tipo: Record<OuvidoriaTipo, number>;
}

export const OUVIDORIA_TIPO_LABELS: Record<OuvidoriaTipo, string> = {
  denuncia: "Denúncia",
  reclamacao: "Reclamação",
  solicitacao: "Solicitação",
  sugestao: "Sugestão",
  elogio: "Elogio",
};

export const OUVIDORIA_STATUS_CONFIG: Record<OuvidoriaStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  recebido:    { label: "Pedido Recebido",   color: "text-blue-700",   bgColor: "bg-blue-50",   borderColor: "border-blue-200",   icon: "📥" },
  em_analise:  { label: "Em Análise", color: "text-amber-700",  bgColor: "bg-amber-50",  borderColor: "border-amber-200",  icon: "🔍" },
  respondido:  { label: "Respondido", color: "text-green-700",  bgColor: "bg-green-50",  borderColor: "border-green-200",  icon: "✅" },
  indeferido:  { label: "Pedido Indeferido", color: "text-red-700",    bgColor: "bg-red-50",    borderColor: "border-red-200",    icon: "❌" },
  prorrogado:  { label: "Prazo Prorrogado", color: "text-purple-700", bgColor: "bg-purple-50", borderColor: "border-purple-200", icon: "⏳" },
};
