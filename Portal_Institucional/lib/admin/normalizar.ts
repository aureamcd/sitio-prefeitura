/**
 * Funções de padronização para Modalidade e Situação de licitações/contratos.
 * Usadas tanto na importação de planilhas quanto em scripts de limpeza.
 */

export function normalizarModalidade(val: string | null | undefined): string | null {
  if (!val) return null;
  const lower = val.toLowerCase().trim();

  if (lower.includes("pregão") || lower.includes("pregao")) return "Pregão";
  if (lower.includes("concorrência") || lower.includes("concorrencia")) return "Concorrência";
  if (lower.includes("tomada de preço") || lower.includes("tomada de preco")) return "Tomada de Preços";
  if (lower.includes("convite")) return "Convite";
  if (lower.includes("leilão") || lower.includes("leilao")) return "Leilão";
  if (lower.includes("chamada pública") || lower.includes("chamada publica")) return "Chamada Pública";
  if (lower.includes("dispensa")) return "Dispensa";
  if (lower.includes("inexigibilidade")) return "Inexigibilidade";
  if (lower.includes("adesao") || lower.includes("adesão")) return "Adesão";
  if (lower.includes("concurso")) return "Concurso";
  if (lower.includes("processo seletivo")) return "Processo Seletivo";
  if (lower.includes("portaria")) return "Portaria";
  if (lower.includes("credenciamento")) return "Credenciamento";
  if (lower.includes("outra") || lower === "outras") return "Outras";

  return val.trim(); // manter original se não reconhecer
}

export function normalizarSituacao(val: string | null | undefined): string | null {
  if (!val) return null;
  const lower = val.toLowerCase().trim();

  if (lower === "finalizada" || lower === "finalizado") return "Finalizada";
  if (lower === "homologado" || lower === "homologada") return "Homologada";
  if (lower === "cancelada" || lower === "cancelado") return "Cancelada";
  if (lower === "aberta" || lower === "aberto") return "Aberta";
  if (lower === "encerrada" || lower === "encerrado") return "Encerrada";
  if (lower === "em andamento") return "Em Andamento";
  if (lower === "não finalizada" || lower === "nao finalizada") return "Não Finalizada";
  if (lower === "divulgada" || lower === "divulgado") return "Divulgada";
  if (lower === "suspensa" || lower === "suspenso") return "Suspensa";
  if (lower === "deserta" || lower === "deserto") return "Deserta";
  if (lower === "fracassada" || lower === "fracassado") return "Fracassada";
  if (lower === "revogada" || lower === "revogado") return "Revogada";
  if (lower === "anulada" || lower === "anulado") return "Anulada";
  if (lower === "vigente") return "Vigente";
  if (lower === "encerrado por prazo") return "Encerrada";

  return val.trim();
}
