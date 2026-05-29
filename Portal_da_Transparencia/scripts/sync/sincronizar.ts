/**
 * sincronizar.ts — Script interativo de sincronização
 *
 * Fluxo para CADA tabela:
 *   1. Mostra qual tabela será preenchida → usuário limpa manualmente no Supabase
 *   2. Usuário digita OK → script chama a API para cada entidade + ano
 *   3. Mostra se foi sucesso, quantos registros, e os atributos retornados
 *   4. Mostra qual será a próxima tabela
 *
 * Uso:
 *   npx tsx scripts/sync/sincronizar.ts
 *   npx tsx scripts/sync/sincronizar.ts --anos=2024,2025
 *   npx tsx scripts/sync/sincronizar.ts --apenas=despesas,receitas
 *   npx tsx scripts/sync/sincronizar.ts --entidade=1,3
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import * as readline from "readline";

dotenv.config();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL =
  "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "❌ ERRO: Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Entidades
// ---------------------------------------------------------------------------
const EMPRESAS = [
  { codigo: "1", nome: "PREFEITURA MUNICIPAL DE PADRE MARCOS" },
  { codigo: "3", nome: "FUNDO MUNICIPAL DE SAÚDE" },
  { codigo: "4", nome: "FUNDO DE MAN. DO DESENV. DA EDUCAÇÃO - FUNDEB" },
  { codigo: "5", nome: "FUNDO MUNICIPAL DE ASSISTENCIA SOCIAL - FMAS" },
  { codigo: "6", nome: "UNIDADE MISTA DE SAÚDE - HOSPITAL" },
  { codigo: "7", nome: "FUNDO DE PREVIDENCIA PRÓPRIA - RPPS" },
  { codigo: "8", nome: "FUNDO MUN.DOS DIREITOS DA CRIANÇA E DO ADOLESCENTE" },
  { codigo: "9", nome: "FUNDO MUNICIPAL DE MEIO AMBIENTE" },
  { codigo: "10", nome: "FUNDO MUNICIPAL DA CULTURA E TURISMO" },
];

const ANOS_PADRAO = [2023, 2024, 2025, 2026];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return (
    Number(
      String(value)
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "")
        .trim()
    ) || 0
  );
}

function parseDateBR(value: string | undefined | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function log(label: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`  [${ts}] [${label}] ${msg}`);
}

function extractDigits(code: string): string {
  return code.replace(/[^\d]/g, "");
}

function getNivel(codigo: string): number {
  const clean = extractDigits(codigo).padEnd(11, "0");
  if (/^\d0{10}$/.test(clean)) return 1;
  if (/^\d{2}0{9}$/.test(clean)) return 2;
  if (/^\d{4}0{7}$/.test(clean)) return 3;
  if (/^\d{6}0{5}$/.test(clean)) return 4;
  return 5;
}

function getTipoNivel(nivel: number): string {
  switch (nivel) {
    case 1: return "Categoria";
    case 2: return "Origem";
    case 3: return "Espécie";
    case 4: return "Rubrica";
    default: return "Item";
  }
}

function getCodigoPai(codigo: string, nivel: number): string | null {
  if (nivel === 1) return null;
  const clean = extractDigits(codigo).padEnd(11, "0");
  if (nivel === 2) {
    const parent = clean[0].padEnd(11, "0");
    return `${parent.slice(0, 4)}.${parent.slice(4, 6)}.${parent[6]}.${parent[7]}.${parent.slice(8, 10)}`;
  }
  if (nivel === 3) {
    const parent = clean.slice(0, 2).padEnd(11, "0");
    return `${parent.slice(0, 4)}.${parent.slice(4, 6)}.${parent[6]}.${parent[7]}.${parent.slice(8, 10)}`;
  }
  const parent = clean.slice(0, 4).padEnd(11, "0");
  return `${parent.slice(0, 4)}.${parent.slice(4, 6)}.${parent[6]}.${parent[7]}.${parent.slice(8, 10)}`;
}

// ---------------------------------------------------------------------------
// Readline helper
// ---------------------------------------------------------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function perguntar(pergunta: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      resolve(resposta.trim().toLowerCase());
    });
  });
}

// ---------------------------------------------------------------------------
// Generic API fetcher
// ---------------------------------------------------------------------------
async function fetchAPI<T>(
  path: string,
  params: Record<string, string>
): Promise<{ data: T[]; sampleAttrs: string[] }> {
  const url = `${BASE_URL}/${path}?${new URLSearchParams(params)}`;
  console.log(`    🌐 GET ${url.slice(0, 120)}...`);

  const response = await fetch(url, { signal: AbortSignal.timeout(120_000) });

  if (!response.ok) {
    throw new Error(`API retornou ${response.status}`);
  }

  const json = (await response.json()) as T[] | T;
  const data = Array.isArray(json) ? json : [];

  // Extrai nomes dos atributos do primeiro item
  const sampleAttrs = data.length > 0 ? Object.keys(data[0] as any) : [];

  return { data, sampleAttrs };
}

// ---------------------------------------------------------------------------
// Cleanup de readline no exit
// ---------------------------------------------------------------------------
process.on('exit', () => rl.close());
process.on('SIGINT', () => {
  rl.close();
  process.exit(0);
});

// ---------------------------------------------------------------------------
// Batch insert helper
// ---------------------------------------------------------------------------
async function insertBatch(
  tabela: string,
  rows: any[]
): Promise<{ inseridos: number; erros: number }> {
  if (!rows.length) return { inseridos: 0, erros: 0 };

  let inseridos = 0;
  let erros = 0;
  const BATCH_SIZE = 200;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .schema("transparencia")
      .from(tabela)
      .insert(batch);

    if (error) {
      log("ERRO", `Lote ${i}-${i + batch.length}: ${error.message}`);
      // Fallback: linha por linha
      for (const row of batch) {
        const { error: rowErr } = await supabase
          .schema("transparencia")
          .from(tabela)
          .insert(row);
        if (rowErr) {
          if (!rowErr.message.includes("duplicate key")) {
            log("ERRO", `  Linha: ${JSON.stringify(row).slice(0, 120)} → ${rowErr.message}`);
            erros++;
          }
        } else {
          inseridos++;
        }
      }
    } else {
      inseridos += batch.length;
    }
  }

  return { inseridos, erros };
}

// ---------------------------------------------------------------------------
// Definição das tabelas
// ---------------------------------------------------------------------------
interface ResultadoTabela {
  empresa: string;
  empresa_nome: string;
  ano: number;
  sucesso: boolean;
  total: number;
  erro?: string;
}

interface TabelaInfo {
  nome: string;
  descricao: string;
  processar: () => Promise<{
    resultados: ResultadoTabela[];
    amostraAtributos: string[];
    amostraItem: any;
  }>;
}

async function criarPrompt(
  tabela: string,
  descricao: string,
  processarEntidadeAno: (
    empresa: { codigo: string; nome: string },
    ano: number
  ) => Promise<{ total: number; amostra: any; atributos: string[] }>,
  empresas: { codigo: string; nome: string }[],
  anos: number[]
): Promise<{
  resultados: ResultadoTabela[];
  amostraAtributos: string[];
  amostraItem: any;
}> {
  const resultados: ResultadoTabela[] = [];
  let amostraAtributos: string[] = [];
  let amostraItem: any = null;

  for (const empresa of empresas) {
    for (const ano of anos) {
      try {
        const r = await processarEntidadeAno(empresa, ano);
        if (r.atributos.length > 0 && amostraAtributos.length === 0) {
          amostraAtributos = r.atributos;
          amostraItem = r.amostra;
        }
        resultados.push({
          empresa: empresa.codigo,
          empresa_nome: empresa.nome,
          ano,
          sucesso: true,
          total: r.total,
        });
        log(tabela.toUpperCase(), `✅ ${empresa.codigo}/${ano}: ${r.total} registros`);
      } catch (err: any) {
        log("ERRO", `❌ ${empresa.codigo}/${ano}: ${err.message}`);
        resultados.push({
          empresa: empresa.codigo,
          empresa_nome: empresa.nome,
          ano,
          sucesso: false,
          total: 0,
          erro: err.message,
        });
      }
      await sleep(500);
    }
  }

  return { resultados, amostraAtributos, amostraItem };
}

// ---------------------------------------------------------------------------
// Módulos de importação
// ---------------------------------------------------------------------------

/** 1. RECEITAS */
async function moduloReceitas(): Promise<TabelaInfo> {
  return {
    nome: "receitas",
    descricao: "Receitas orçamentárias por entidade e ano",
    processar: async () => {
      return criarPrompt(
        "receitas",
        "Receitas orçamentárias",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("Receitas/", {
            ConectarExercicio: String(ano),
            Listagem: "ReceitaOrcamentaria",
            DiaInicioPeriodo: "01",
            MesInicialPeriodo: "01",
            DiaFinalPeriodo: "31",
            MesFinalPeriodo: "12",
            Ano: String(ano),
            Empresa: empresa.codigo,
            MostraDadosConsolidado: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          // Agrupa por código contábil (evita duplicatas)
          const rowsMap = new Map<string, any>();
          for (const r of data) {
            const codigo = (r.CODIGO || "").trim();
            if (!codigo) continue;

            if (rowsMap.has(codigo)) {
              const exist = rowsMap.get(codigo);
              exist.previsto_inicial += toNumber(r.PREVISAO_INICIAL);
              exist.previsto_atualizado += toNumber(r.PREVISAO_ATUALIZADA);
              exist.arrecadado_periodo += toNumber(r.ARRECADADO_PERIODO);
              exist.arrecadado_total += toNumber(r.ARRECADADO_TOTAL);
            } else {
              const nivel = getNivel(codigo);
              rowsMap.set(codigo, {
                ano,
                empresa: empresa.codigo,
                empresa_nome: empresa.nome,
                codigo_contabil: codigo,
                codigo_limpo: extractDigits(codigo),
                descricao: (r.NOME || "").trim(),
                nivel,
                tipo_nivel: getTipoNivel(nivel),
                codigo_pai: getCodigoPai(codigo, nivel),
                categoria: extractDigits(codigo).slice(0, 1) || null,
                origem: extractDigits(codigo).slice(0, 2) || null,
                especie: extractDigits(codigo).slice(0, 3) || null,
                rubrica: extractDigits(codigo).slice(0, 4) || null,
                alinea: extractDigits(codigo).slice(0, 6) || null,
                subalinea: extractDigits(codigo).slice(0, 8) || null,
                detalhamento: extractDigits(codigo) || null,
                cod_aplicacao: (r.VINCODIGO || "").trim() || null,
                fonte_stn: (r.FONTESTN || "").trim() || null,
                fonte_recurso: (r.FONTE || "").trim() || null,
                previsto_inicial: toNumber(r.PREVISAO_INICIAL),
                previsto_atualizado: toNumber(r.PREVISAO_ATUALIZADA),
                arrecadado_periodo: toNumber(r.ARRECADADO_PERIODO),
                arrecadado_total: toNumber(r.ARRECADADO_TOTAL),
              });
            }
          }

          const rows = Array.from(rowsMap.values());
          rows.sort((a, b) => a.nivel - b.nivel);

          const { inseridos } = await insertBatch("receitas", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 2. RECEITAS DETALHES */
async function moduloReceitasDetalhes(): Promise<TabelaInfo> {
  return {
    nome: "receitas_detalhes",
    descricao: "Detalhamento mensal das receitas (lançamentos individuais)",
    processar: async () => {
      const resultados: ResultadoTabela[] = [];
      let amostraAtributos: string[] = [];
      let amostraItem: any = null;

      for (const empresa of EMPRESAS_USAR) {
        for (const ano of anosSelecionados) {
          try {
            log("DETALHES REC", `Buscando receitas item para ${empresa.codigo}/${ano}...`);

            const { data: codigos } = await supabase
              .schema("transparencia")
              .from("receitas")
              .select("id,codigo_contabil,descricao")
              .eq("ano", ano)
              .eq("empresa", empresa.codigo)
              .eq("tipo_nivel", "Item")
              .order("codigo_contabil");

            if (!codigos?.length) {
              log("DETALHES REC", `Nenhuma receita base para ${empresa.codigo}/${ano}`);
              resultados.push({
                empresa: empresa.codigo,
                empresa_nome: empresa.nome,
                ano,
                sucesso: true,
                total: 0,
              });
              continue;
            }

            let totalLinhas = 0;
            const globalSeen = new Set<string>();

            for (const receita of codigos) {
              await sleep(200);
              try {
                const { data, sampleAttrs } = await fetchAPI<any>("Receitas/", {
                  ConectarExercicio: String(ano),
                  Listagem: "DetalhesReceitaOrcamentaria",
                  DiaInicioPeriodo: "01",
                  MesInicialPeriodo: "01",
                  DiaFinalPeriodo: "31",
                  MesFinalPeriodo: "12",
                  Ano: String(ano),
                  Empresa: empresa.codigo,
                  Codigochave: receita.codigo_contabil,
                  MostraDadosConsolidado: "False",
                });

                if (amostraAtributos.length === 0 && sampleAttrs.length > 0) {
                  amostraAtributos = sampleAttrs;
                }

                if (!data.length) continue;

                const rows: any[] = [];
                for (const d of data) {
                  const codigo_contabil = (d.CODRE || receita.codigo_contabil).trim();
                  const data_lancamento = parseDateBR(d.DATA_RECEITA);
                  const historico = (d.HISTORICO || "").trim();
                  const valor = toNumber(d.VALOR);
                  const key = `${ano}|${codigo_contabil}|${data_lancamento}|${valor}|${historico}`;

                  if (globalSeen.has(key)) continue;
                  globalSeen.add(key);

                  if (amostraItem === null) {
                    amostraItem = d;
                  }

                  rows.push({
                    receita_id: receita.id,
                    codigo_contabil,
                    descricao_receita: (d.NOME_RECEITA || receita.descricao).trim(),
                    data_lancamento,
                    historico,
                    documento: (d.CONTA || "").trim() || null,
                    contribuinte: null,
                    cpf_cnpj: null,
                    valor,
                    ano,
                    empresa: empresa.codigo,
                    empresa_nome: empresa.nome,
                    origem: "API-JSON-Detalhes",
                  });
                }

                const { inseridos } = await insertBatch("receitas_detalhes", rows);
                totalLinhas += inseridos;
              } catch (err: any) {
                log("DETALHES REC", `⚠ ${receita.codigo_contabil}: ${err.message}`);
              }
            }

            log("DETALHES REC", `✅ ${empresa.codigo}/${ano}: ${totalLinhas} registros`);
            resultados.push({
              empresa: empresa.codigo,
              empresa_nome: empresa.nome,
              ano,
              sucesso: true,
              total: totalLinhas,
            });
          } catch (err: any) {
            log("ERRO", `❌ ${empresa.codigo}/${ano}: ${err.message}`);
            resultados.push({
              empresa: empresa.codigo,
              empresa_nome: empresa.nome,
              ano,
              sucesso: false,
              total: 0,
              erro: err.message,
            });
          }
        }
      }

      return { resultados, amostraAtributos, amostraItem };
    },
  };
}

/** 3. DESPESAS */
async function moduloDespesas(): Promise<TabelaInfo> {
  return {
    nome: "despesas",
    descricao: "Despesas orçamentárias (execução financeira)",
    processar: async () => {
      return criarPrompt(
        "despesas",
        "Despesas orçamentárias",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("Despesas/", {
            ConectarExercicio: String(ano),
            Listagem: "DespesasGerais",
            DiaInicioPeriodo: "01",
            MesInicialPeriodo: "01",
            DiaFinalPeriodo: "31",
            MesFinalPeriodo: "12",
            Ano: String(ano),
            Empresa: empresa.codigo,
            MostrarFornecedor: "True",
            MostraDadosConsolidado: "False",
            UFParaFiltroCOVID: "",
            MostrarCNPJFornecedor: "True",
            ApenasIDEmpenho: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => ({
            ano,
            empresa: empresa.codigo,
            empresa_nome: empresa.nome,
            pkemp: (r.PKEMP || "").trim(),
            codigo: (r.CODIGO || "").trim(),
            tipo_empenho: (r.TPEM || "").trim(),
            numero_empenho: (r.NUMLIC || r.CODIGO || "").trim(),
            data_empenho: parseDateBR(r.DATAE),
            fornecedor_codigo: (r.CODIF || "").trim(),
            fornecedor_nome: (r.NOMEFOR || "").trim(),
            fornecedor_cpf_cnpj: (r.CPFFORMATADO || "").trim(),
            orgao_codigo: (r.CODLO || "").trim(),
            orgao_nome: null,
            unidade_codigo: null,
            unidade_nome: null,
            funcao_codigo: (r.FUNCAO || "").trim(),
            funcao_nome: (r.FUNCAONOME || "").trim(),
            subfuncao_codigo: (r.SUBFUNCAO || "").trim(),
            subfuncao_nome: (r.SUBFUNCAONOME || "").trim(),
            programa_codigo: (r.PROGRAMA || "").trim(),
            programa_nome: (r.PROGRAMANOME || "").trim(),
            projeto_atividade_codigo: (r.PROJATIV || "").trim(),
            projeto_atividade_nome: (r.PROJETO_ATIVIDADE_NOME || "").trim(),
            natureza_codigo: (r.NATUREZA || "").trim(),
            natureza_nome: null,
            fonte_codigo: (r.FONCODIGO || "").trim(),
            fonte_nome: (r.FONCODIGODESC || "").trim(),
            fonte_stn: (r.FONTE_STN || "").trim(),
            recurso_codigo: (r.FONRO || "").trim(),
            recurso_nome: (r.FONRODESC || "").trim(),
            ficha: (r.FICHA || "").trim(),
            processo: (r.PROC || "").trim(),
            licitacao_numero: null,
            licitacao_modalidade: null,
            licitacao_descricao: null,
            objeto: (r.PRODU || "").trim(),
            dotacao_inicial: toNumber(r.DOTAC),
            alteracao_dotacao: toNumber(r.ALTDO),
            dotacao_atualizada: toNumber(r.DOTACATUALIZADA),
            valor_empenhado: toNumber(r.EMPENHADO),
            valor_anulado: 0,
            valor_reforco: 0,
            valor_liquidado: toNumber(r.LIQUIDADO),
            valor_pago: toNumber(r.PAGO),
            empenhado_ate_data: toNumber(r.EMPENHADO_ATE_A_DATA),
            liquidado_ate_data: toNumber(r.LIQUIDADO_ATE_A_DATA),
            pago_ate_data: toNumber(r.PAGO_ATE_A_DATA),
            payload: r,
            origem: "API-JSON",
          }));

          const { inseridos } = await insertBatch("despesas", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 4. DIÁRIAS */
async function moduloDiarias(): Promise<TabelaInfo> {
  return {
    nome: "diarias",
    descricao: "Diárias pagas a servidores",
    processar: async () => {
      return criarPrompt(
        "diarias",
        "Diárias",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("Despesas/", {
            ConectarExercicio: String(ano),
            Listagem: "Diarias",
            DiaInicioPeriodo: "01",
            MesInicialPeriodo: "01",
            DiaFinalPeriodo: "31",
            MesFinalPeriodo: "12",
            Ano: String(ano),
            Empresa: empresa.codigo,
            MostraDadosConsolidado: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => ({
            ano,
            empresa: empresa.codigo,
            empresa_nome: empresa.nome,
            nempg: (r.NEMPG || "").trim(),
            numero_liquidacao: (r.NUMEROLIQUIDACAO || "").trim(),
            ordem_pagamento: (r.ORDEMPAGAMENTO || "").trim(),
            data: parseDateBR(r.DATA),
            valor: toNumber(r.VALOR),
            valor_anulado: toNumber(r.VALORANULADO),
            descricao: (r.DESCRICAO || "").trim(),
            favorecido: (r.FAVORECIDO || "").trim(),
            cargo: (r.CARGO || "").trim(),
            cpf_formatado: (r.CPFFORMATADO || "").trim(),
            orgao_codigo: (r.CODORGAO || "").trim(),
            orgao_nome: (r.NOMEORGAO || "").trim(),
            unidade_codigo: (r.CODUNIDADE || "").trim(),
            unidade_nome: (r.NOMEUNIDADE || "").trim(),
            elemento_nome: (r.NOME_ELEMENTO || "").trim(),
            quantidade: (r.QUANT || "").trim(),
            origem: "API-JSON",
          }));

          const { inseridos } = await insertBatch("diarias", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 5. RESTOS A PAGAR */
async function moduloRestosPagar(): Promise<TabelaInfo> {
  return {
    nome: "restos_pagar",
    descricao: "Restos a pagar (despesas de anos anteriores)",
    processar: async () => {
      return criarPrompt(
        "restos_pagar",
        "Restos a pagar",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("Despesas/", {
            ConectarExercicio: String(ano),
            Listagem: "DespesasRestosPagar",
            DiaInicioPeriodo: "01",
            MesInicialPeriodo: "01",
            DiaFinalPeriodo: "31",
            MesFinalPeriodo: "12",
            Ano: String(ano),
            Empresa: empresa.codigo,
            ApresentaNomeFavorecido: "True",
            MostraDadosConsolidado: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => ({
            ano,
            empresa: empresa.codigo,
            empresa_nome: empresa.nome,
            codigo: (r.CODIGO || "").trim(),
            descricao: (r.DESCRICAO || "").trim(),
            empenhado: toNumber(r.EMPENHADO),
            liquidado: toNumber(r.LIQUIDADO),
            pago: toNumber(r.PAGO),
            origem: "API-JSON",
          }));

          const { inseridos } = await insertBatch("restos_pagar", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 6. DESPESAS EXTRA-ORÇAMENTÁRIAS */
async function moduloDespesasExtra(): Promise<TabelaInfo> {
  return {
    nome: "despesas_extra_orcamentarias",
    descricao: "Despesas extra-orçamentárias (consignações, cauções, etc.)",
    processar: async () => {
      return criarPrompt(
        "despesas_extra_orcamentarias",
        "Despesas extra-orçamentárias",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("Despesas/", {
            ConectarExercicio: String(ano),
            Listagem: "DespesasExtraOrcamentaria",
            DiaInicioPeriodo: "01",
            MesInicialPeriodo: "01",
            DiaFinalPeriodo: "31",
            MesFinalPeriodo: "12",
            Ano: String(ano),
            Empresa: empresa.codigo,
            ApresentaNomeFavorecido: "True",
            MostraDadosConsolidado: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => ({
            ano,
            empresa: empresa.codigo,
            empresa_nome: empresa.nome,
            codigo: (r.CODIGO || "").trim(),
            descricao: (r.DESCRICAO || "").trim(),
            data: parseDateBR(r.DATAE),
            nomenclatura: (r.NOMENCLATURA || "").trim(),
            historico: (r.HISTORICO || "").trim(),
            numero_guia: (r.NUMEROGUIA || "").trim(),
            data_guia: parseDateBR(r.DATAGUIA),
            cnpj_inscricao: (r.INSMF || "").trim(),
            codigo_adotado: (r.CODIGOADOTADO || "").trim(),
            pago: toNumber(r.PAGO),
            origem: "API-JSON",
          }));

          const { inseridos } = await insertBatch("despesas_extra_orcamentarias", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 7. LICITAÇÕES */
async function moduloLicitacoes(): Promise<TabelaInfo> {
  return {
    nome: "licitacoes",
    descricao: "Licitações realizadas",
    processar: async () => {
      return criarPrompt(
        "licitacoes",
        "Licitações",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("LicitacoesEContratos/", {
            ConectarExercicio: String(ano),
            Listagem: "Licitacoes",
            Ano: String(ano),
            Empresa: empresa.codigo,
            MostraDadosConsolidado: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => {
            const anoRaw = (r.ANO || "").trim();
            return {
              empresa_nome: empresa.nome,
              ano: anoRaw.length === 2 ? `20${anoRaw}` : anoRaw,
              proclic: (r.PROCLIC || "").trim(),
              numero: (r.NUMERO || "").trim(),
              nlicitacao: (r.NLICITACAO || "").trim(),
              numlic: (r.NUMLIC || "").trim(),
              tipo_licitacao: (r.LICIT || "").trim(),
              data_abertura: parseDateBR(r.DATAE),
              data_encerramento: parseDateBR(r.DTENC),
              registro_preco: (r.REGISTROPRECO || "").trim(),
              objeto: (r.DISCR || "").trim(),
              situacao: (r.SITUACAO || "").trim(),
              valor: toNumber(r.VALOR),
              empresa: empresa.codigo,
              carona: (r.CARONA || "").trim(),
              artigo_inciso: (r.ARTIGO_INCISO || "").trim(),
              origem: "API-JSON",
            };
          });

          const { inseridos } = await insertBatch("licitacoes", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 8. CONTRATOS */
async function moduloContratos(): Promise<TabelaInfo> {
  return {
    nome: "contratos",
    descricao: "Contratos administrativos",
    processar: async () => {
      return criarPrompt(
        "contratos",
        "Contratos",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("LicitacoesEContratos/", {
            ConectarExercicio: String(ano),
            Listagem: "Contratos",
            Ano: String(ano),
            Empresa: empresa.codigo,
            MostraDadosConsolidado: "False",
            ContratosApenasPublicados: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => ({
            empresa: empresa.codigo,
            empresa_nome: empresa.nome,
            ano: (r.ANO || "").trim(),
            codigo: (r.CODIGO || "").trim(),
            numero_contrato: (r.CONTRATONUM || "").trim(),
            fornecedor: (r.FORNECEDOR || "").trim(),
            cnpj_inscricao: (r.INSMF || "").trim(),
            objeto: (r.OBJETO || "").trim(),
            objeto_completo: (r.OBJETO_COMPLETO || "").trim(),
            valor: toNumber(r.VALCON),
            data_assinatura: parseDateBR(r.DTASSI),
            data_publicacao: parseDateBR(r.DTPUBL),
            vigencia_inicio: parseDateBR(r.VIGENI),
            vigencia_fim: parseDateBR(r.VIGENF),
            situacao: (r.TIPOCO || "").trim(),
            licitacao_tipo: (r.LICIT || "").trim(),
            licitacao_numero: (r.NUMLICMOD || "").trim(),
            modalidade: (r.MODALI || "").trim(),
            gestor_nome: (r.RESPON || "").trim(),
            gestor_codigo: (r.CODLO_GESTOR || "").trim(),
            entidade: (r.ENTIDADE || "").trim(),
            fundamento_legal: (r.FUNDLEGAL || "").trim(),
            origem: "API-JSON",
          }));

          const { inseridos } = await insertBatch("contratos", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 9. TRANSFERÊNCIAS */
async function moduloTransferencias(): Promise<TabelaInfo> {
  return {
    nome: "transferencias",
    descricao: "Transferências entre entidades (convênios, repasses)",
    processar: async () => {
      return criarPrompt(
        "transferencias",
        "Transferências",
        async (empresa, ano) => {
          const { data, sampleAttrs } = await fetchAPI<any>("Transferencias/", {
            ConectarExercicio: String(ano),
            Listagem: "Transf",
            Empresa: empresa.codigo,
            MostraDadosConsolidado: "False",
          });

          if (!data.length) return { total: 0, amostra: null, atributos: sampleAttrs };

          const rows = data.map((r: any) => ({
            empresa: empresa.codigo,
            empresa_nome: empresa.nome,
            ano,
            mes: Number.parseInt(r.MES, 10) || 0,
            entidade_pagadora: (r.ENTIDADE_PAGADORA || "").trim(),
            entidade_recebedora: (r.ENTIDADE_RECEBEDORA || "").trim(),
            cnpj_pagadora: (r.CNPJPAGADORA || "").trim(),
            cnpj_recebedora: (r.CNPJRECEBEDORA || "").trim(),
            repasse: toNumber(r.REPASSE),
            devolucao: toNumber(r.DEVOLUCAO),
            previsto: toNumber(r.PREVISTO),
            destino: (r.ENTIDADEDESTINO || "").trim(),
            origem: "API-JSON",
          }));

          const { inseridos } = await insertBatch("transferencias", rows);
          return {
            total: inseridos,
            amostra: rows[0] || null,
            atributos: sampleAttrs,
          };
        },
        EMPRESAS_USAR,
        anosSelecionados
      );
    },
  };
}

/** 10. SERVIDORES */
const rows = data.map((r: any) => ({
  ano,
  mes: Number(mesEncontrado),

  empresa: empresa.codigo,
  empresa_nome: empresa.nome,

  matricula: (r.REGISTRO || "").trim(),

  nome: (r.NOME || "").trim(),

  cargo: (r.CARGO || r.CARGOINICIO || "").trim(),

  funcao: (
    r.FUNCAO ||
    r.VINCULO ||
    r.NATUREZA ||
    ""
  ).trim(),

  lotacao: (
    r.DIVISAO ||
    r.SUBDIVISAO ||
    r.UNIDADE ||
    ""
  ).trim(),

  local_trabalho: (
    r.LOCALDETRABALHO ||
    r.UNIDADE ||
    ""
  ).trim(),

  vinculo: (r.VINCULO || "").trim(),

  natureza: (r.NATUREZA || "").trim(),

  tipo_contrato: (r.TIPOCONTRATO || "").trim(),

  regime: (r.TIPOREGIME || "").trim(),

  situacao: (
    r.SITUACAOFUNCIONAL ||
    ""
  ).trim(),

  data_admissao: parseDateBR(r.DATAADMISSAO),

  data_exoneracao:
    parseDateBR(r.DATADESLIGAMENTO) ||
    parseDateBR(r.DTTERMINO),

  carga_horaria: Number(r.HORASEMANAL || 0),

  referencia_folha: (
    r.REFERENCIA_NOME ||
    ""
  ).trim(),

  rendimentos: toNumber(r.PROVENTOS),

  descontos: toNumber(r.DESCONTOS),

  liquido: toNumber(r[LIQUIDO_KEY]),

  origem: "API-JSON",
}));

// ---------------------------------------------------------------------------
// Atributos do SQL para referência
// ---------------------------------------------------------------------------
const ATRIBUTOS_POR_TABELA: Record<string, string[]> = {
  receitas: [
    "ano", "codigo_contabil", "codigo_limpo", "descricao", "nivel", "tipo_nivel",
    "codigo_pai", "categoria", "origem", "especie", "rubrica", "alinea", "subalinea",
    "detalhamento", "cod_aplicacao", "fonte_stn", "fonte_recurso",
    "previsto_inicial", "previsto_atualizado", "arrecadado_periodo", "arrecadado_total",
    "empresa", "empresa_nome"
  ],
  receitas_detalhes: [
    "ano", "codigo_contabil", "descricao_receita", "data_lancamento", "historico",
    "documento", "contribuinte", "cpf_cnpj", "valor", "receita_id",
    "empresa", "empresa_nome"
  ],
  despesas: [
    "ano", "empresa", "empresa_nome", "pkemp", "codigo", "tipo_empenho",
    "numero_empenho", "data_empenho", "fornecedor_codigo", "fornecedor_nome",
    "fornecedor_cpf_cnpj", "orgao_codigo", "funcao_codigo", "funcao_nome",
    "subfuncao_codigo", "subfuncao_nome", "programa_codigo", "programa_nome",
    "projeto_atividade_codigo", "projeto_atividade_nome",
    "natureza_codigo", "fonte_codigo", "fonte_nome", "fonte_stn",
    "recurso_codigo", "recurso_nome", "objeto",
    "dotacao_inicial", "alteracao_dotacao", "dotacao_atualizada",
    "valor_empenhado", "valor_liquidado", "valor_pago",
    "empenhado_ate_data", "liquidado_ate_data", "pago_ate_data",
    "processo", "payload"
  ],
  diarias: [
    "ano", "empresa", "empresa_nome", "nempg", "numero_liquidacao",
    "ordem_pagamento", "data", "valor", "valor_anulado", "descricao",
    "favorecido", "cargo", "cpf_formatado", "orgao_codigo", "orgao_nome",
    "unidade_codigo", "unidade_nome", "elemento_nome", "quantidade"
  ],
  restos_pagar: [
    "ano", "empresa", "empresa_nome", "codigo", "descricao",
    "empenhado", "liquidado", "pago"
  ],
  despesas_extra_orcamentarias: [
    "ano", "empresa", "empresa_nome", "codigo", "descricao", "data",
    "nomenclatura", "historico", "numero_guia", "data_guia",
    "cnpj_inscricao", "codigo_adotado", "pago"
  ],
  licitacoes: [
    "ano", "empresa", "empresa_nome", "proclic", "numero", "nlicitacao",
    "numlic", "tipo_licitacao", "data_abertura", "data_encerramento",
    "registro_preco", "objeto", "situacao", "valor", "carona", "artigo_inciso"
  ],
  contratos: [
    "ano", "empresa", "empresa_nome", "codigo", "numero_contrato",
    "fornecedor", "cnpj_inscricao", "objeto", "objeto_completo", "valor",
    "data_assinatura", "data_publicacao", "vigencia_inicio", "vigencia_fim",
    "situacao", "licitacao_tipo", "licitacao_numero", "modalidade",
    "gestor_nome", "gestor_codigo", "entidade", "fundamento_legal"
  ],
  transferencias: [
    "ano", "empresa", "empresa_nome", "mes", "entidade_pagadora",
    "entidade_recebedora", "cnpj_pagadora", "cnpj_recebedora",
    "repasse", "devolucao", "previsto", "destino"
  ],
  servidores: [
  "ano",
  "mes",
  "empresa",
  "empresa_nome",
  "matricula",
  "nome",
  "cargo",
  "funcao",
  "lotacao",
  "local_trabalho",
  "vinculo",
  "natureza",
  "tipo_contrato",
  "regime",
  "situacao",
  "data_admissao",
  "data_exoneracao",
  "carga_horaria",
  "referencia_folha",
  "rendimentos",
  "descontos",
  "liquido"
],
};

// ---------------------------------------------------------------------------
// Ordem de processamento
// ---------------------------------------------------------------------------
async function getModulos(): Promise<TabelaInfo[]> {
  const modulos: TabelaInfo[] = [
    await moduloReceitas(),
    await moduloReceitasDetalhes(),
    await moduloDespesas(),
    await moduloDiarias(),
    await moduloRestosPagar(),
    await moduloDespesasExtra(),
    await moduloLicitacoes(),
    await moduloContratos(),
    await moduloTransferencias(),
    await moduloServidores(),
  ];

  // Filtra pelos módulos solicitados via --apenas=
  if (apenasModulos.length > 0) {
    return modulos.filter((m) => apenasModulos.includes(m.nome));
  }

  return modulos;
}

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const anosArg = args.find((a) => a.startsWith("--anos="));
const apenasArg = args.find((a) => a.startsWith("--apenas="));
const entidadeArg = args.find((a) => a.startsWith("--entidade="));

const anosSelecionados: number[] = anosArg
  ? anosArg.split("=")[1].split(",").map(Number).filter(Boolean)
  : ANOS_PADRAO;

const apenasModulos: string[] = apenasArg
  ? apenasArg.split("=")[1].split(",").map((m) => m.trim())
  : [];

const entidadesFiltradas: string[] = entidadeArg
  ? entidadeArg.split("=")[1].split(",").map((c) => c.trim())
  : [];

// Se filtrou entidades, usa apenas as selecionadas
const EMPRESAS_USAR = entidadesFiltradas.length > 0
  ? EMPRESAS.filter((e) => entidadesFiltradas.includes(e.codigo))
  : EMPRESAS;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║        🔄 SINCRONIZADOR DO PORTAL DA TRANSPARÊNCIA            ║");
  console.log("╠" + "═".repeat(68) + "╣");
  console.log(`║  📅 Anos: ${anosSelecionados.join(", ").padEnd(50)}║`);
  console.log(`║  🏢 Entidades: ${String(EMPRESAS_USAR.length).padEnd(3)} - ${EMPRESAS_USAR.map((e) => e.codigo).join(", ").padEnd(44)}║`);
  console.log(`║  📋 Filtro: ${apenasModulos.length > 0 ? apenasModulos.join(", ") : "TODAS as tabelas".padEnd(30)}║`);
  console.log("╚" + "═".repeat(68) + "╝");
  console.log("");

  const modulos = await getModulos();
  const totalModulos = modulos.length;
  const inicio = Date.now();

  for (let idx = 0; idx < modulos.length; idx++) {
    const modulo = modulos[idx];
    const atual = idx + 1;

    console.log("");
    console.log("━".repeat(70));
    console.log(`  📋 [${atual}/${totalModulos}] Tabela: transparencia.${modulo.nome}`);
    console.log(`  📝 ${modulo.descricao}`);
    console.log("━".repeat(70));
    console.log("");

    // Mostra atributos da tabela SQL para referência
    const atributosSQL = ATRIBUTOS_POR_TABELA[modulo.nome];
    if (atributosSQL) {
      console.log("  📋 Colunas esperadas na tabela SQL:");
      console.log(`    ${atributosSQL.join(", ")}`);
      console.log("");
    }

    // Pede confirmação para limpar a tabela
    console.log(`  ⚠️  Antes de prosseguir, limpe a tabela transparencia.${modulo.nome} no Supabase!`);
    const resposta = await perguntar(
      `  Digite OK (ou pule com ENTER vazio, ou SAIR): `
    );

    if (resposta === "sair") {
      console.log("\n  🛑 Sincronização interrompida pelo usuário.");
      break;
    }

    if (resposta !== "ok") {
      console.log(`\n  ⏭️  Pulando tabela transparencia.${modulo.nome}...`);
      continue;
    }

    console.log(`\n  🚀 Processando transparencia.${modulo.nome}...\n`);

    try {
      const { resultados, amostraAtributos, amostraItem } =
        await modulo.processar();

      // Resumo
      const sucessos = resultados.filter((r) => r.sucesso);
      const falhas = resultados.filter((r) => !r.sucesso);
      const totalRegistros = sucessos.reduce((acc, r) => acc + r.total, 0);

      console.log("");
      console.log("  " + "─".repeat(66));
      console.log(`  📊 RESULTADO: transparencia.${modulo.nome}`);
      console.log("  " + "─".repeat(66));

      for (const r of resultados) {
        const status = r.sucesso
          ? `✅ ${r.total} registros`
          : `❌ ${r.erro}`;
        console.log(
          `    ${r.empresa_nome.slice(0, 45).padEnd(45)} | ${r.ano} | ${status}`
        );
      }

      console.log("  " + "─".repeat(66));
      console.log(`  🏁 Total: ${totalRegistros} registros inseridos`);
      if (falhas.length > 0) {
        console.log(`  ⚠️  ${falhas.length} erro(s)`);
      }

      // Mostra atributos retornados pela API
      console.log("");
      console.log(`  📋 Atributos retornados pela API (${amostraAtributos.length} campos):`);
      console.log(`    ${amostraAtributos.join(", ")}`);

      if (amostraItem) {
        console.log("");
        console.log("  📄 Exemplo do primeiro item retornado:");
        console.log(
          `    ${JSON.stringify(amostraItem, null, 4)
            .split("\n")
            .slice(0, 15)
            .join("\n    ")}`
        );
        if (Object.keys(amostraItem).length > 15) {
          console.log(`    ... e mais ${Object.keys(amostraItem).length - 15} campos`);
        }
      }

      console.log("");
      console.log(`  ✅ Tabela transparencia.${modulo.nome} finalizada!`);
      console.log("");

      // Se não for a última, mostra preview da próxima
      if (idx < modulos.length - 1) {
        const proximo = modulos[idx + 1];
        console.log("  " + "─".repeat(66));
        console.log(`  ⏭️  PRÓXIMA TABELA: transparencia.${proximo.nome}`);
        console.log(`     ${proximo.descricao}`);
        console.log("");

        const atributosProx = ATRIBUTOS_POR_TABELA[proximo.nome];
        if (atributosProx) {
          console.log(`  📋 Colunas esperadas na tabela transparencia.${proximo.nome}:`);
          console.log(`    ${atributosProx.join(", ")}`);
        }
        console.log("");
        console.log(`  ⚠️  Você pode conferir os atributos da API acima com as colunas`);
        console.log(`     esperadas da tabela, e já ir limpando a tabela ${proximo.nome}`);
        console.log("  " + "─".repeat(66));
        console.log("");
      }
    } catch (err: any) {
      console.error(`\n  ❌ ERRO FATAL em ${modulo.nome}: ${err.message}`);
    }
  }

  rl.close();

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log("");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║        🎉 SINCRONIZAÇÃO FINALIZADA!                          ║");
  console.log(`║  ⏱️  Duração total: ${duracao}s`.padEnd(70) + "║");
  console.log("╚" + "═".repeat(68) + "╝");
  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Erro fatal:", err);
  rl.close();
  process.exit(1);
});
