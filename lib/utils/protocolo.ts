/**
 * ========================================================
 * GERADOR DE PROTOCOLO ÚNICO
 * ========================================================
 * Formato: ESIC-2026-00142 / OUV-2026-00058
 * @module lib/utils/protocolo
 */

export type ProtocoloTipo = "ESIC" | "OUV";

/**
 * Gera protocolo sequencial baseado na contagem do banco.
 * @param tipo "ESIC" ou "OUV"
 * @param contagem Registros existentes
 */
export function gerarProtocolo(tipo: ProtocoloTipo, contagem: number): string {
  const ano = new Date().getFullYear();
  const sequencial = String(contagem + 1).padStart(5, "0");
  return `${tipo}-${ano}-${sequencial}`;
}

/**
 * Calcula prazo de resposta.
 * e-SIC: 20 dias (Lei 12.527, Art. 11, §1º)
 * Ouvidoria: 30 dias
 */
export function calcularPrazoResposta(
  tipo: ProtocoloTipo,
  dataInicio: Date = new Date()
): string {
  const prazo = new Date(dataInicio);
  prazo.setDate(prazo.getDate() + (tipo === "ESIC" ? 20 : 30));
  return prazo.toISOString();
}

/** Valida formato do protocolo */
export function validarProtocolo(protocolo: string): boolean {
  return /^(ESIC|OUV)-\d{4}-\d{5}$/.test(protocolo.toUpperCase().trim());
}

/** Remove formatação do CPF (apenas dígitos) */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}
