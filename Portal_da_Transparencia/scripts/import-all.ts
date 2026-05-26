/**
 * import-all.ts — Importação completa via API JSON
 *
 * Estratégia:
 * 1. Conecta no Supabase
 * 2. Para cada endpoint da API JSON do portal Fiorilli:
 *    - Limpa dados antigos do ano
 *    - Fetch dos dados
 *    - Mapeia para a estrutura da tabela
 *    - Insere em lotes
 * 3. Suporta múltiplos anos (2024, 2025, 2026)
 *
 * Uso:
 *   npx tsx scripts/import-all.ts                # ano corrente (2026)
 *   npx tsx scripts/import-all.ts --ano=2024      # ano específico
 *   npx tsx scripts/import-all.ts --anos=2024,2025,2026  # múltiplos anos
 *   npx tsx scripts/import-all.ts --apenas=receitas,despesas  # apenas algumas tabelas
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE_URL = "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson";
const EMPRESA = "1";

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
// Helpers
// ---------------------------------------------------------------------------
function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") return value;

  return Number(
    String(value)
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
      .trim()
  ) || 0;
}

function parseDateBR(value: string | undefined | null): string | null {
  if (!value) return null;
  // Formato: "12/01/2026 00:00:00" ou "12/01/2026"
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function extractDigits(code: string): string {
  return code.replace(/[^\d]/g, '');
}

function getNivel(codigo: string): number {
  const clean = extractDigits(codigo).padEnd(11, '0');
  if (/^\d0{10}$/.test(clean)) return 1;
  if (/^\d{2}0{9}$/.test(clean)) return 2;
  if (/^\d{4}0{7}$/.test(clean)) return 3;
  if (/^\d{6}0{5}$/.test(clean)) return 4;
  return 5;
}

function getTipoNivel(nivel: number): string {
  switch (nivel) {
    case 1: return 'Categoria';
    case 2: return 'Origem';
    case 3: return 'Espécie';
    case 4: return 'Rubrica';
    default: return 'Item';
  }
}

function getCodigoPai(codigo: string, nivel: number): string | null {
  if (nivel === 1) return null;
  const clean = extractDigits(codigo).padEnd(11, '0');
  if (nivel === 2) {
    const parent = clean[0].padEnd(11, '0');
    return `${parent.slice(0, 4)}.${parent.slice(4, 6)}.${parent[6]}.${parent[7]}.${parent.slice(8, 10)}`;
  }
  if (nivel === 3) {
    const parent = clean.slice(0, 2).padEnd(11, '0');
    return `${parent.slice(0, 4)}.${parent.slice(4, 6)}.${parent[6]}.${parent[7]}.${parent.slice(8, 10)}`;
  }
  const parent = clean.slice(0, 4).padEnd(11, '0');
  return `${parent.slice(0, 4)}.${parent.slice(4, 6)}.${parent[6]}.${parent[7]}.${parent.slice(8, 10)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function log(label: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] [${label}] ${msg}`);
}

// ---------------------------------------------------------------------------
// Generic API fetcher
// ---------------------------------------------------------------------------
async function fetchAPI<T>(
  path: string,
  params: Record<string, string>
): Promise<T[]> {
  const url = `${BASE_URL}/${path}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });

  if (!response.ok) {
    throw new Error(`API ${path} retornou ${response.status}`);
  }

  const data = (await response.json()) as T[] | T;
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// Import functions — each one handles one table
// ---------------------------------------------------------------------------

/** 1. RECEITAS ORÇAMENTÁRIAS */
async function importReceitas(ano: number) {
  log("RECEITAS", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Receitas/", {
    ConectarExercicio: String(ano),
    Listagem: "ReceitaOrcamentaria",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: EMPRESA,
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("RECEITAS", `Nenhum registro encontrado para ${ano}.`);
    return 0;
  }

  const rowsMap = new Map<string, any>();

  for (const r of data) {
    const codigo = (r.CODIGO || "").trim();
    if (!codigo) continue;

    const previsto_inicial = toNumber(r.PREVISAO_INICIAL);
    const previsto_atualizado = toNumber(r.PREVISAO_ATUALIZADA);
    const arrecadado_periodo = toNumber(r.ARRECADADO_PERIODO);
    const arrecadado_total = toNumber(r.ARRECADADO_TOTAL);

    if (rowsMap.has(codigo)) {
      const exist = rowsMap.get(codigo);
      exist.previsto_inicial += previsto_inicial;
      exist.previsto_atualizado += previsto_atualizado;
      exist.arrecadado_periodo += arrecadado_periodo;
      exist.arrecadado_total += arrecadado_total;
    } else {
      const nivel = getNivel(codigo);
      rowsMap.set(codigo, {
        ano,
        codigo_contabil: codigo,
        codigo_limpo: extractDigits(codigo),
        descricao: (r.NOME || "").trim(),
        nivel,
        tipo_nivel: getTipoNivel(nivel),
        codigo_pai: getCodigoPai(codigo, nivel),
        cod_aplicacao: (r.VINCODIGO || "").trim() || null,
        fonte_stn: (r.FONTESTN || "").trim() || null,
        fonte_recurso: (r.FONTE || "").trim() || null,
        previsto_inicial,
        previsto_atualizado,
        arrecadado_periodo,
        arrecadado_total,
      });
    }
  }

  const rows = Array.from(rowsMap.values());

  // Ordena por nível (pais primeiro) para respeitar FK fk_receita_pai
  rows.sort((a, b) => a.nivel - b.nivel);

  log("RECEITAS", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("receitas").delete().eq("ano", ano);

  await insertBatch("receitas", rows);
  log("RECEITAS", `✓ ${rows.length} receitas importadas.`);
  return rows.length;
}

/** 2. DETALHES DAS RECEITAS (para cada código contábil individual) */
async function importDetalhesReceitas(ano: number) {
  log("DETALHES RECEITAS", `Buscando códigos de receitas de ${ano} para detalhar...`);

  // Pega os códigos que são folha (terminam em .1.00 ou equivalentes individuais)
  const { data: codigos } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("id,codigo_contabil,descricao")
    .eq("ano", ano)
    .eq("tipo_nivel", "item")
    .order("codigo_contabil");

  if (!codigos?.length) {
    log("DETALHES RECEITAS", "Nenhum código de receita encontrado.");
    return 0;
  }

  log("DETALHES RECEITAS", `${codigos.length} códigos para processar...`);
  let total = 0;

  // Limpa TODOS os detalhes do ano de uma vez
  await supabase
    .schema("transparencia")
    .from("receitas_detalhes")
    .delete()
    .eq("ano", ano);

  // Set GLOBAL para evitar duplicatas entre receitas diferentes
  const globalSeen = new Set<string>();

  for (const receita of codigos) {
    await sleep(200); // rate limit leve

    try {
      const detalhes = await fetchAPI<any>("Receitas/", {
        ConectarExercicio: String(ano),
        Listagem: "DetalhesReceitaOrcamentaria",
        DiaInicioPeriodo: "01",
        MesInicialPeriodo: "01",
        DiaFinalPeriodo: "31",
        MesFinalPeriodo: "12",
        Ano: String(ano),
        Empresa: EMPRESA,
        Codigochave: receita.codigo_contabil,
        MostraDadosConsolidado: "False",
      });

      if (!detalhes.length) continue;

      const rows: any[] = [];

      for (const d of detalhes) {
        const codigo_contabil = (d.CODRE || receita.codigo_contabil).trim();
        const data_lancamento = parseDateBR(d.DATA_RECEITA);
        const historico = (d.HISTORICO || "").trim();
        const documento = (d.CONTA || "").trim();
        const valor = toNumber(d.VALOR);

        // Chave = campos da constraint uq_receitas_detalhes
        const key = `${ano}|${codigo_contabil}|${data_lancamento}|${valor}|${historico}`;

        if (globalSeen.has(key)) continue;
        globalSeen.add(key);

        rows.push({
          receita_id: receita.id,
          codigo_contabil,
          descricao_receita: (d.NOME_RECEITA || receita.descricao).trim(),
          data_lancamento,
          historico,
          documento,
          contribuinte: null,
          cpf_cnpj: null,
          valor,
          ano,
          origem: "API-JSON-Detalhes",
        });
      }

      await insertBatch("receitas_detalhes", rows);
      total += rows.length;
    } catch (err: any) {
      log("DETALHES RECEITAS", `⚠ ${receita.codigo_contabil}: ${err.message}`);
    }
  }

  log("DETALHES RECEITAS", `✓ ${total} detalhes importados.`);
  return total;
}

/** 3. RECEITAS EXTRA-ORÇAMENTÁRIAS → tabela receitas_detalhes com tipo='extra-orcamentaria' */
async function importReceitasExtra(ano: number) {
  log("RECEITAS EXTRA", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Receitas/", {
    ConectarExercicio: String(ano),
    Listagem: "ReceitaExtraOrcamentaria",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: EMPRESA,
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("RECEITAS EXTRA", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    ano,
    codigo: (r.EXTRA || r.CODIGO || "").trim(),
    descricao: (r.DESCRICAO || r.NOMENCLATURA || "").trim(),
    data_lancamento: parseDateBR(r.DTLAN),
    historico: (r.HISTORICO || "").trim(),
    documento: null,
    contribuinte: null,
    cpf_cnpj: null,
    valor: toNumber(r.VALOR),
    origem: "API-JSON-Extra",
  }));

  // Limpa extra-orçamentárias antigas
  await supabase
    .schema("transparencia")
    .from("receitas_extra_orcamentarias")
    .delete()
    .eq("ano", ano);

  await insertBatch("receitas_extra_orcamentarias", rows);
  log("RECEITAS EXTRA", `✓ ${rows.length} receitas extra-orçamentárias importadas.`);
  return rows.length;
}

/** 4. DESPESAS GERAIS */
async function importDespesas(ano: number) {
  log("DESPESAS", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Despesas/", {
    ConectarExercicio: String(ano),
    Listagem: "DespesasGerais",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: EMPRESA,
    MostrarFornecedor: "True",
    MostraDadosConsolidado: "False",
    UFParaFiltroCOVID: "",
    MostrarCNPJFornecedor: "True",
    ApenasIDEmpenho: "False",
  });

  if (!data.length) {
    log("DESPESAS", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    ano,
    pkemp: (r.PKEMP || "").trim(),
    codigo: (r.CODIGO || "").trim(),
    tipo_empenho: (r.TPEM || "").trim(),
    numero_empenho: (r.NUMLIC || r.CODIGO || "").trim(),
    data_empenho: parseDateBR(r.DATAE),
    fornecedor_codigo: (r.CODIF || "").trim(),
    fornecedor_nome: (r.NOMEFOR || "").trim(),
    fornecedor_cpf_cnpj: (r.CPFFORMATADO || "").trim(),
    orgao_unidade: (r.CODLO || "").trim(),
    orgao_nome: null,
    funcao_codigo: (r.FUNCAO || "").trim(),
    funcao_nome: (r.FUNCAONOME || "").trim(),
    subfuncao_codigo: (r.SUBFUNCAO || "").trim(),
    subfuncao_nome: (r.SUBFUNCAONOME || "").trim(),
    natureza_codigo: (r.NATUREZA || "").trim(),
    natureza_nome: null,
    fonte_codigo: (r.FONCODIGO || "").trim(),
    fonte_nome: (r.FONCODIGODESC || "").trim(),
    recurso_codigo: (r.FONRO || "").trim(),
    recurso_nome: (r.FONRODESC || "").trim(),
    fonte_stn: (r.FONTE_STN || "").trim(),
    programa_codigo: (r.PROGRAMA || "").trim(),
    programa_nome: (r.PROGRAMANOME || "").trim(),
    projeto_atividade_codigo: (r.PROJATIV || "").trim(),
    projeto_atividade_nome: (r.PROJETO_ATIVIDADE_NOME || "").trim(),
    dotacao_inicial: toNumber(r.DOTAC),
    alteracao_dotacao: toNumber(r.ALTDO),
    dotacao_atualizada: toNumber(r.DOTACATUALIZADA),
    valor_empenhado: toNumber(r.EMPENHADO),
    valor_liquidado: toNumber(r.LIQUIDADO),
    valor_pago: toNumber(r.PAGO),
    empenhado_ate_data: toNumber(r.EMPENHADO_ATE_A_DATA),
    liquidado_ate_data: toNumber(r.LIQUIDADO_ATE_A_DATA),
    pago_ate_data: toNumber(r.PAGO_ATE_A_DATA),
    processo: (r.PROC || "").trim(),
    licitacao: (r.NUMLICIT || "").trim(),
    origem: "API-JSON",
  }));

  log("DESPESAS", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("despesas").delete().eq("ano", ano);

  await insertBatch("despesas", rows);
  log("DESPESAS", `✓ ${rows.length} despesas importadas.`);
  return rows.length;
}

/** 5. DIÁRIAS */
async function importDiarias(ano: number) {
  log("DIÁRIAS", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Despesas/", {
    ConectarExercicio: String(ano),
    Listagem: "Diarias",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: EMPRESA,
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("DIÁRIAS", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    ano,
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

  log("DIÁRIAS", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("diarias").delete().eq("ano", ano);

  await insertBatch("diarias", rows);
  log("DIÁRIAS", `✓ ${rows.length} diárias importadas.`);
  return rows.length;
}

/** 6. LICITAÇÕES */
async function importLicitacoes(ano: number) {
  log("LICITAÇÕES", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("LicitacoesEContratos/", {
    ConectarExercicio: String(ano),
    Listagem: "Licitacoes",
    Ano: String(ano),
    Empresa: EMPRESA,
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("LICITAÇÕES", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => {
    const anoRaw = (r.ANO || "").trim();
    return {
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
      empresa: (r.EMPRESA || "").trim(),
      carona: (r.CARONA || "").trim(),
      artigo_inciso: (r.ARTIGO_INCISO || "").trim(),
      origem: "API-JSON",
    };
  });

  log("LICITAÇÕES", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("licitacoes").delete().eq("ano", String(ano));

  await insertBatch("licitacoes", rows);
  log("LICITAÇÕES", `✓ ${rows.length} licitações importadas.`);
  return rows.length;
}

/** 7. CONTRATOS */
async function importContratos(ano: number) {
  log("CONTRATOS", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("LicitacoesEContratos/", {
    ConectarExercicio: String(ano),
    Listagem: "Contratos",
    Ano: String(ano),
    Empresa: EMPRESA,
    MostraDadosConsolidado: "False",
    ContratosApenasPublicados: "False",
  });

  if (!data.length) {
    log("CONTRATOS", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
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

  log("CONTRATOS", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("contratos").delete().eq("ano", String(ano));

  await insertBatch("contratos", rows);
  log("CONTRATOS", `✓ ${rows.length} contratos importados.`);
  return rows.length;
}

/** 8. TRANSFERÊNCIAS ENTRE ENTIDADES */
async function importTransferencias(ano: number) {
  log("TRANSFERÊNCIAS", `Buscando dados...`);
  const data = await fetchAPI<any>("Transferencias/", {
    ConectarExercicio: String(ano),
    Listagem: "Transf",
    Empresa: EMPRESA,
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("TRANSFERÊNCIAS", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    mes: Number.parseInt(r.MES, 10) || 0,
    entidade_pagadora: (r.ENTIDADE_PAGADORA || "").trim(),
    entidade_recebedora: (r.ENTIDADE_RECEBEDORA || "").trim(),
    cnpj_pagadora: (r.CNPJPAGADORA || "").trim(),
    cnpj_recebedora: (r.CNPJRECEBEDORA || "").trim(),
    repasse: toNumber(r.REPASSE),
    devolucao: toNumber(r.DEVOLUCAO),
    previsto: toNumber(r.PREVISTO),
    destino: (r.ENTIDADEDESTINO || "").trim(),
    ano,
    origem: "API-JSON",
  }));

  log("TRANSFERÊNCIAS", `Limpando dados antigos...`);
  await supabase.schema("transparencia").from("transferencias").delete().eq("ano", ano);

  await insertBatch("transferencias", rows);
  log("TRANSFERÊNCIAS", `✓ ${rows.length} transferências importadas.`);
  return rows.length;
}

/** 9. RESTOS A PAGAR */
async function importRestosPagar(ano: number) {
  log("RESTOS A PAGAR", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Despesas/", {
    ConectarExercicio: String(ano),
    Listagem: "DespesasRestosPagar",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: EMPRESA,
    ApresentaNomeFavorecido: "True",
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("RESTOS A PAGAR", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    ano,
    codigo: (r.CODIGO || "").trim(),
    descricao: (r.DESCRICAO || "").trim(),
    empenhado: toNumber(r.EMPENHADO),
    liquidado: toNumber(r.LIQUIDADO),
    pago: toNumber(r.PAGO),
    origem: "API-JSON",
  }));

  log("RESTOS A PAGAR", `Limpando dados antigos...`);
  await supabase.schema("transparencia").from("restos_pagar").delete().eq("ano", ano);

  await insertBatch("restos_pagar", rows);
  log("RESTOS A PAGAR", `✓ ${rows.length} restos a pagar importados.`);
  return rows.length;
}

/** 10. DESPESAS EXTRA-ORÇAMENTÁRIAS */
async function importDespesasExtra(ano: number) {
  log("DESPESAS EXTRA", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Despesas/", {
    ConectarExercicio: String(ano),
    Listagem: "DespesasExtraOrcamentaria",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: EMPRESA,
    ApresentaNomeFavorecido: "True",
    MostraDadosConsolidado: "False",
  });

  if (!data.length) {
    log("DESPESAS EXTRA", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    ano,
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

  log("DESPESAS EXTRA", `Limpando dados antigos...`);
  await supabase.schema("transparencia").from("despesas_extra_orcamentarias").delete().eq("ano", ano);

  await insertBatch("despesas_extra_orcamentarias", rows);
  log("DESPESAS EXTRA", `✓ ${rows.length} despesas extra-orçamentárias importadas.`);
  return rows.length;
}

/** 11. SERVIDORES (PESSOAL) */
async function importServidores(ano: number) {
  // A API de servidores só retorna dados para meses em que a folha
  // já foi processada. Para anos anteriores, mês 12 funciona.
  // Para o ano corrente, tentamos do mês atual pra trás.
  const anoCorrente = new Date().getFullYear();
  const isAnoCorrente = ano === anoCorrente;
  const mesAtual = new Date().getMonth() + 1; // 1..12
  const mesesParaTentar = isAnoCorrente
    ? Array.from({ length: mesAtual }, (_, i) => mesAtual - i)
    : [12];
  let data: any[] = [];

  for (const mes of mesesParaTentar) {
    const mesStr = String(mes).padStart(2, "0");
    log("SERVIDORES", `Buscando dados de ${ano}, mês ${mesStr}...`);
    try {
      data = await fetchAPI<any>("Pessoal/", {
        ConectarExercicio: String(ano),
        Listagem: "Servidores",
        Empresa: EMPRESA,
        Ano: String(ano),
        MesFinalPeriodo: mesStr,
      });
      if (data.length) {
        log("SERVIDORES", `✓ Encontrados ${data.length} registros no mês ${mesStr}.`);
        break;
      }
    } catch {
      // tenta próximo mês
    }
  }

  if (!data.length) {
    log("SERVIDORES", `Nenhum registro para ${ano} em nenhum mês.`);
    return 0;
  }

  // Mapeamento real dos campos da API
  // Campo "LIQUIDO + (IsNull(PROVENTOS, 0)-IsNull(DESCONTOS,0))" tem nome dinâmico
  const LIQUIDO_KEY = Object.keys(data[0]).find(
    (k) => k.includes("LIQUIDO") || k.includes("IsNull")
  ) || "";

  const rows = data.map((r: any) => ({
    ano,
    matricula: (r.REGISTRO || "").trim(),
    nome: (r.NOME || "").trim(),
    cargo: (r.CARGO || "").trim(),
    lotacao: (r.DIVISAO || "").trim(),
    funcao: (r.VINCULO || r.NATUREZA || "").trim(),
    data_admissao: parseDateBR(r.DATAADMISSAO),
    situacao: (r.SITUACAOFUNCIONAL || "").trim(),
    rendimentos: toNumber(r.PROVENTOS),
    descontos: toNumber(r.DESCONTOS),
    liquido: toNumber(r[LIQUIDO_KEY]),
    origem: "API-JSON",
  }));

  log("SERVIDORES", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("servidores").delete().eq("ano", ano);

  await insertBatch("servidores", rows);
  log("SERVIDORES", `✓ ${rows.length} servidores importados.`);
  return rows.length;
}

/** 12. EMENDAS PARLAMENTARES */
async function importEmendas(ano: number) {
  log("EMENDAS", `Buscando dados de ${ano}...`);
  const data = await fetchAPI<any>("Transferencias/", {
    ConectarExercicio: String(ano),
    Listagem: "EmendasImpositivasArt166A",
    Empresa: EMPRESA,
    Ano: String(ano),
  });

  if (!data.length) {
    log("EMENDAS", `Nenhum registro para ${ano}.`);
    return 0;
  }

  const rows = data.map((r: any) => ({
    ano,
    tipo_transferencia: (r.TIPOTRANSF || "").trim(),
    receita_transferencia: (r.RECTRANSF || "").trim(),
    recurso_aplicacao_financeira: (r.RECAPLICACAOFINAN || "").trim(),
    empenhado: toNumber(r.EMPENHADO),
    liquidado: toNumber(r.LIQUIDADO),
    pago: toNumber(r.PAGO),
    origem: "API-JSON",
  }));

  log("EMENDAS", `Limpando dados antigos de ${ano}...`);
  await supabase.schema("transparencia").from("emendas").delete().eq("ano", ano);

  await insertBatch("emendas", rows);
  log("EMENDAS", `✓ ${rows.length} emendas importadas.`);
  return rows.length;
}

// ---------------------------------------------------------------------------
// Batch insert helper
// ---------------------------------------------------------------------------
async function insertBatch(table: string, rows: any[]) {
  // Remove linhas 100% idênticas
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = JSON.stringify(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (unique.length < rows.length) {
    log(table.toUpperCase(), `⚠ ${rows.length - unique.length} linhas duplicadas removidas`);
  }

  const BATCH_SIZE = 200;

  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .schema("transparencia")
      .from(table)
      .insert(batch);

    if (error) {
      log("ERRO", `Falha no lote ${i}-${i + batch.length} da tabela ${table}: ${error.message}`);
      for (const row of batch) {
        const { error: rowErr } = await supabase
          .schema("transparencia")
          .from(table)
          .insert(row);
        if (rowErr) {
          log("ERRO", `  Linha com erro: ${JSON.stringify(row).slice(0, 200)} → ${rowErr.message}`);
        }
      }
    } else {
      const pct = Math.round(((i + batch.length) / unique.length) * 100);
      log(table.toUpperCase(), `  ${Math.min(i + batch.length, unique.length)}/${unique.length} (${pct}%)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------
async function main() {
  // Parsing de argumentos
  const args = process.argv.slice(2);
  const anoArg = args.find((a) => a.startsWith("--ano=")) || args.find((a) => a.startsWith("--anos="));
  const apenasArg = args.find((a) => a.startsWith("--apenas="));

  let anos: number[];
  if (anoArg) {
    const raw = anoArg.split("=")[1];
    anos = raw.split(",").map(Number).filter(Boolean);
  } else {
    anos = [2026]; // default: ano corrente
  }

  // Módulos disponíveis
  const modulosDisponiveis: Record<string, (ano: number) => Promise<number>> = {
    receitas: importReceitas,
    detalhes_receitas: importDetalhesReceitas,
    receitas_extra: importReceitasExtra,
    despesas: importDespesas,
    diarias: importDiarias,
    licitacoes: importLicitacoes,
    contratos: importContratos,
    transferencias: importTransferencias,
    restos_pagar: importRestosPagar,
    despesas_extra: importDespesasExtra,
    servidores: importServidores,
    emendas: importEmendas,
  };

  // Filtro opcional
  let modulosAtivos: string[];
  if (apenasArg) {
    modulosAtivos = apenasArg.split("=")[1].split(",").map((m) => m.trim());
    // valida
    for (const m of modulosAtivos) {
      if (!modulosDisponiveis[m]) {
        console.error(`❌ Módulo desconhecido: "${m}". Disponíveis: ${Object.keys(modulosDisponiveis).join(", ")}`);
        process.exit(1);
      }
    }
  } else {
    modulosAtivos = Object.keys(modulosDisponiveis);
  }

  console.log("=".repeat(60));
  console.log("  🏛️  IMPORTADOR COMPLETO — Portal da Transparência");
  console.log(`  📅 Anos: ${anos.join(", ")}`);
  console.log(`  📦 Módulos: ${modulosAtivos.join(", ")}`);
  console.log("=".repeat(60));

  const inicio = Date.now();
  const resultados: { ano: number; modulo: string; total: number }[] = [];

  for (const ano of anos) {
    console.log(`\n${"─".repeat(50)}`);
    console.log(`  📆 EXERCÍCIO ${ano}`);
    console.log(`${"─".repeat(50)}`);

    for (const modulo of modulosAtivos) {
      try {
        const fn = modulosDisponiveis[modulo];
        const total = await fn(ano);
        resultados.push({ ano, modulo, total });
      } catch (err: any) {
        console.error(`\n❌ ERRO em ${modulo}/${ano}: ${err.message}`);
        resultados.push({ ano, modulo, total: -1 });
      }
    }
  }

  // Sumário
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(`\n${"=".repeat(60)}`);
  console.log("  📊 RESUMO DA IMPORTAÇÃO");
  console.log(`${"=".repeat(60)}`);
  console.log(`  ⏱️  Duração: ${duracao}s`);
  console.log();
  for (const r of resultados) {
    const status = r.total >= 0 ? `✓ ${r.total} registros` : "✗ FALHA";
    console.log(`  ${r.ano} | ${r.modulo.padEnd(20)} ${status}`);
  }
  console.log(`\n  ✅ Importação concluída!`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
