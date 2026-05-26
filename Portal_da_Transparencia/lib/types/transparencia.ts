/**
 * ========================================================
 * TIPOS — TABELAS COMPLEMENTARES DE TRANSPARÊNCIA
 * ========================================================
 *
 * Tipos para as tabelas auxiliares do Portal da Transparência:
 *   - diarias
 *   - emendas_parlamentares
 *   - concursos
 *
 * @module lib/types/transparencia
 */

/* ── DIÁRIAS ─────────────────────────────────────────── */
export type DiariaStatus = "pendente" | "concluida" | "cancelada";

export interface Diaria {
  id: string;
  servidor: string;
  cargo: string;
  destino: string;
  periodo_inicio: string;
  periodo_fim: string;
  valor: number;
  objetivo: string;
  data_concessao: string;
  data_prestacao_contas?: string;
  status: DiariaStatus;
  created_at: string;
  updated_at: string;
}

export interface DiariaFormData {
  servidor: string;
  cargo: string;
  destino: string;
  periodo_inicio: string;
  periodo_fim: string;
  valor: number;
  objetivo: string;
  data_concessao: string;
}

/* ── EMENDAS PARLAMENTARES ────────────────────────── */
export type EmendaTipo = "individual" | "bancada" | "comissao" | "relator";
export type EmendaStatus = "prevista" | "recebida" | "em_execucao" | "concluida" | "cancelada";

export interface EmendaParlamentar {
  id: string;
  numero: string;
  ano: number;
  tipo: EmendaTipo;
  autor: string;
  autor_cargo: string; // "Deputado Federal", "Senador", etc.
  valor_previsto: number;
  valor_recebido?: number;
  objeto: string;
  orgao_responsavel: string;
  status: EmendaStatus;
  data_recebimento?: string;
  created_at: string;
  updated_at: string;
}

export interface EmendaFormData {
  numero: string;
  ano: number;
  tipo: EmendaTipo;
  autor: string;
  autor_cargo: string;
  valor_previsto: number;
  objeto: string;
  orgao_responsavel: string;
}

/* ── CONCURSOS ────────────────────────────────────── */
export type ConcursoStatus = "aberto" | "em_andamento" | "homologado" | "cancelado";

export interface Concurso {
  id: string;
  titulo: string;
  tipo: "concurso" | "processo_seletivo" | "teste_seletivo";
  numero_edital: string;
  ano: number;
  descricao: string;
  status: ConcursoStatus;
  data_abertura: string;
  data_encerramento?: string;
  data_homologacao?: string;
  arquivo_edital_url?: string;
  arquivo_resultado_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ConcursoFormData {
  titulo: string;
  tipo: "concurso" | "processo_seletivo" | "teste_seletivo";
  numero_edital: string;
  ano: number;
  descricao: string;
  data_abertura: string;
  data_encerramento?: string;
}

/* ── CONFIGURAÇÕES DE STATUS ───────────────────────── */
export const DIARIA_STATUS_CONFIG: Record<DiariaStatus, { label: string; color: string }> = {
  pendente: { label: "Pendente de Prestação de Contas", color: "text-amber-600" },
  concluida: { label: "Concluída", color: "text-green-600" },
  cancelada: { label: "Cancelada", color: "text-red-600" },
};

export const EMENDA_TIPO_LABELS: Record<EmendaTipo, string> = {
  individual: "Individual",
  bancada: "De Bancada",
  comissao: "De Comissão",
  relator: "De Relator (RP 9)",
};

export const EMENDA_STATUS_CONFIG: Record<EmendaStatus, { label: string; color: string }> = {
  prevista: { label: "Prevista", color: "text-gray-600" },
  recebida: { label: "Recebida", color: "text-blue-600" },
  em_execucao: { label: "Em Execução", color: "text-amber-600" },
  concluida: { label: "Concluída", color: "text-green-600" },
  cancelada: { label: "Cancelada", color: "text-red-600" },
};

export const CONCURSO_STATUS_CONFIG: Record<ConcursoStatus, { label: string; color: string }> = {
  aberto: { label: "Edital Aberto", color: "text-blue-600" },
  em_andamento: { label: "Em Andamento", color: "text-amber-600" },
  homologado: { label: "Homologado", color: "text-green-600" },
  cancelado: { label: "Cancelado", color: "text-red-600" },
};
