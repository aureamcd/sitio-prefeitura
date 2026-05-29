/**
 * ========================================================
 * ENTIDADES / EMPRESAS DO MUNICÍPIO
 * ========================================================
 *
 * Relação de todas as entidades (empresas) que compõem
 * a administração municipal de Padre Marcos - PI.
 *
 * Cada entidade possui um código numérico e nome,
 * utilizados como filtro nas páginas do Portal da Transparência.
 *
 * @module lib/empresas
 */

export interface Empresa {
  codigo: string;
  nome: string;
}

export const EMPRESAS: Empresa[] = [
  { codigo: "1", nome: "PREFEITURA MUNICIPAL DE PADRE MARCOS" },
  { codigo: "3", nome: "FUNDO MUNICIPAL DE SAÚDE" },
  { codigo: "4", nome: "FUNDO DE MAN. DO DESENV. DA EDUCAÇÃO - FUNDEB" },
  { codigo: "5", nome: "FUNDO MUNICIPAL DE ASSISTENCIA SOCIAL - FMAS" },
  { codigo: "6", nome: "UNIDADE MISTA DE SAÚDE - HOSPITAL" },
  { codigo: "7", nome: "FUNDO DE PREVIDENCIA PROPRIA - RPPS" },
  { codigo: "8", nome: "FUNDO MUN.DOS DIREITOS DA CRIANÇA E DO ADOLESCENTE" },
  { codigo: "9", nome: "FUNDO MUNICIPAL DE MEIO AMBIENTE" },
  { codigo: "10", nome: "FUNDO MUNICIPAL DA CULTURA E TURISMO" },
];

/**
 * Retorna o nome da entidade a partir do código.
 */
export function getEmpresaNome(codigo: string): string {
  return EMPRESAS.find((e) => e.codigo === codigo)?.nome ?? codigo;
}
