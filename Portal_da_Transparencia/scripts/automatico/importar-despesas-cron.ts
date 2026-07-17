/**
 * importar-despesas-cron.ts
 *
 * Sincronização automatizada diária/semanal de despesas (Despesas Orçamentárias,
 * Extraorçamentárias e Restos a Pagar) em arquitetura Delta-Sync (Sem Exclusão).
 *
 * REGRAS CRÍTICAS:
 * 1. EXCLUSÃO DA CÂMARA (EMPRESA 2): Em todas as chamadas e verificações, apenas as 9 entidades contábeis (1, 3 a 10).
 * 2. SEM EXCLUSÃO DE DADOS EXISTENTES (SEM DELETE): Protege o histórico já presente no banco.
 * 3. VERIFICAÇÃO POR CHAVE ÚNICA E DELTA:
 *    - `despesas`: verifica por (ano + empresa + pkemp/numero_empenho). Se mudou saldo (empenhado, liquidado, pago)
 *      ou se falta classificação (natureza_codigo/orgao_codigo), faz UPDATE. Se não existe, busca detalhes e faz INSERT.
 *    - `despesas_extra_orcamentarias`: verifica por (ano + empresa + numero_guia/codigo). Se mudou saldo, faz UPDATE; senão, INSERT.
 *    - `restos_pagar`: verifica por (ano + empresa + codigo). Se mudou saldo, faz UPDATE; senão, INSERT.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: "transparencia" }
});

const FIORILLI_BASE_URL = "https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Despesas";

interface Empresa {
  codigo: string;
  nome: string;
}

const EMPRESAS: Empresa[] = [
  { codigo: "1", nome: "PREFEITURA MUNICIPAL DE PADRE MARCOS" },
  { codigo: "3", nome: "FUNDO MUNICIPAL DE SAÚDE" },
  { codigo: "4", nome: "FUNDEB" },
  { codigo: "5", nome: "FMAS" },
  { codigo: "6", nome: "HOSPITAL" },
  { codigo: "7", nome: "RPPS" },
  { codigo: "8", nome: "DIREITOS DA CRIANÇA" },
  { codigo: "9", nome: "MEIO AMBIENTE" },
  { codigo: "10", nome: "CULTURA" }
];

function parseValor(valor: any): number {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;
  const limpo = String(valor).replace(/\./g, "").replace(",", ".").trim();
  const num = parseFloat(limpo);
  return isNaN(num) ? 0 : Number(num.toFixed(2));
}

function parseDateBR(date: string | null | undefined): string | null {
  if (!date) return null;
  const onlyDate = String(date).split(" ")[0];
  const partes = onlyDate.split("/");
  if (partes.length !== 3) return null;
  const [day, month, year] = partes;
  if (!day || !month || !year || year.length !== 4) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function splitCodigoDescricao(valor: string | null | undefined): { codigo: string; descricao: string } {
  if (!valor) return { codigo: "", descricao: "" };
  const parts = String(valor).split(" - ");
  return {
    codigo: parts[0]?.trim() || "",
    descricao: parts.slice(1).join(" - ").trim() || ""
  };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJson(url: string, tentativas = 3): Promise<any> {
  for (let t = 1; t <= tentativas; t++) {
    try {
      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        if (response.status === 404 || response.status === 204) return [];
        if (response.status === 429 && t < tentativas) {
          await sleep(1000 * t);
          continue;
        }
        throw new Error(`Erro HTTP ${response.status}`);
      }
      const text = await response.text();
      if (!text || text.trim() === "") return [];
      return JSON.parse(text);
    } catch (err: any) {
      if (t < tentativas && (err.message.includes("429") || err.message.includes("fetch"))) {
        await sleep(1000 * t);
        continue;
      }
      if (t === tentativas) {
        console.warn(`⚠️ Erro após ${tentativas} tentativas [${url}]: ${err.message}`);
      }
    }
  }
  return [];
}

function buildDespesasGeraisUrl(ano: number, empresa: string): string {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: "DespesasGerais",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: empresa,
    MostrarFornecedor: "True",
    MostraDadosConsolidado: "False",
    UFParaFiltroCOVID: "",
    MostrarCNPJFornecedor: "True",
    ApenasIDEmpenho: "False"
  });
  return `${FIORILLI_BASE_URL}/?${params.toString()}`;
}

function buildDetalhesEmpenhoUrl(ano: number, empresa: string, numeroEmpenho: string, tipoEmpenho: string): string {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: "DetalhesEmpenhoPorNumeroEmpenho",
    intNumeroEmpenho: numeroEmpenho,
    strTipoEmpenho: tipoEmpenho || "OR",
    Empresa: empresa,
    bolMostrarFornecedor: "False"
  });
  return `${FIORILLI_BASE_URL}/?${params.toString()}`;
}

function buildExtraOrcamentariasUrl(ano: number, empresa: string): string {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: "DespesasExtraOrcamentaria",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: empresa,
    ApresentaNomeFavorecido: "True",
    MostraDadosConsolidado: "False"
  });
  return `${FIORILLI_BASE_URL}/?${params.toString()}`;
}

function buildRestosPagarUrl(ano: number, empresa: string): string {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: "DespesasRestosPagar",
    DiaInicioPeriodo: "01",
    MesInicialPeriodo: "01",
    DiaFinalPeriodo: "31",
    MesFinalPeriodo: "12",
    Ano: String(ano),
    Empresa: empresa,
    ApresentaNomeFavorecido: "True",
    MostraDadosConsolidado: "False"
  });
  return `${FIORILLI_BASE_URL}/?${params.toString()}`;
}

async function buscarDetalhesEmpenho(ano: number, empresa: string, numeroEmpenho: string, tipoEmpenho: string): Promise<any> {
  const url = buildDetalhesEmpenhoUrl(ano, empresa, numeroEmpenho, tipoEmpenho);
  const data = await fetchJson(url);
  await sleep(30);
  if (Array.isArray(data) && data.length > 0) return data[0];
  return null;
}

async function montarRegistroDespesa(item: any, empresa: Empresa, ano: number, buscarDetalhes: boolean = true) {
  let detalhes: any = null;
  if (buscarDetalhes && item.CODIGO) {
    detalhes = await buscarDetalhesEmpenho(ano, item.EMPRESA || empresa.codigo, item.CODIGO, item.TPEM || "OR");
  }

  const orgao = splitCodigoDescricao(detalhes?.ORGAO);
  const unidade = splitCodigoDescricao(detalhes?.UNIDADE);
  const funcao = splitCodigoDescricao(detalhes?.FUNCAO);
  const subfuncao = splitCodigoDescricao(detalhes?.SUBFUNCAO);
  const programa = splitCodigoDescricao(detalhes?.PROGRAMA);
  const projetoAtividade = splitCodigoDescricao(detalhes?.PROJETOATIVIDADE);
  const categoriaEconomica = splitCodigoDescricao(detalhes?.CATEGORIAECONOMICA);
  const grupoNatureza = splitCodigoDescricao(detalhes?.GRUPONATUREZA);
  const modalidade = splitCodigoDescricao(detalhes?.MODALIDADEAPLICACAO);
  const natureza = splitCodigoDescricao(detalhes?.NATUREZA);
  const elemento = splitCodigoDescricao(detalhes?.ELEMENTO);
  const desdobro = splitCodigoDescricao(detalhes?.DESDOBRO);
  const fonteGrupo = splitCodigoDescricao(detalhes?.FONGRUPO);
  const fonteCodigo = splitCodigoDescricao(detalhes?.FONCODIGO);
  const fonteStn = splitCodigoDescricao(detalhes?.FONTE_STN);
  const vinculo = splitCodigoDescricao(detalhes?.VINCULO);

  return {
    ano,
    empresa: item.EMPRESA || empresa.codigo,
    empresa_nome: empresa.nome,
    numero_empenho: String(item.CODIGO || "").trim(),
    tipo_empenho: item.TPEM || "OR",
    pkemp: String(item.PKEMP || `${ano}-${item.EMPRESA || empresa.codigo}-${item.CODIGO}`).trim(),
    data_empenho: parseDateBR(item.DATAE),
    credor_nome: item.NOMEFOR || "",
    credor_documento: item.CPFFORMATADO || "",
    empenhado: parseValor(item.EMPENHADO),
    liquidado: parseValor(item.LIQUIDADO),
    pago: parseValor(item.PAGO),
    objeto: detalhes?.HISTORICO || item.PRODU || "",
    orgao_codigo: orgao.codigo || null,
    orgao_nome: orgao.descricao || null,
    unidade_codigo: unidade.codigo || null,
    unidade_nome: unidade.descricao || null,
    funcao_codigo: funcao.codigo || null,
    funcao_nome: funcao.descricao || null,
    subfuncao_codigo: subfuncao.codigo || null,
    subfuncao_nome: subfuncao.descricao || null,
    programa_codigo: programa.codigo || null,
    programa_nome: programa.descricao || null,
    projeto_atividade_codigo: projetoAtividade.codigo || null,
    projeto_atividade_nome: projetoAtividade.descricao || null,
    natureza_codigo: natureza.codigo || null,
    natureza_nome: natureza.descricao || null,
    categoria_economica_codigo: categoriaEconomica.codigo || null,
    categoria_economica_nome: categoriaEconomica.descricao || null,
    grupo_natureza_codigo: grupoNatureza.codigo || null,
    grupo_natureza_nome: grupoNatureza.descricao || null,
    modalidade_codigo: modalidade.codigo || null,
    modalidade_nome: modalidade.descricao || null,
    elemento_codigo: elemento.codigo || null,
    elemento_nome: elemento.descricao || null,
    desdobro_codigo: desdobro.codigo || null,
    desdobro_nome: desdobro.descricao || null,
    fonte_stn_codigo: fonteStn.codigo || null,
    fonte_stn_nome: fonteStn.descricao || null,
    fonte_grupo_codigo: fonteGrupo.codigo || null,
    fonte_grupo_nome: fonteGrupo.descricao || null,
    fonte_codigo: fonteCodigo.codigo || null,
    fonte_codigo_nome: fonteCodigo.descricao || null,
    vinculo_codigo: vinculo.codigo || null,
    vinculo_nome: vinculo.descricao || null,
    ficha: detalhes?.FICHA || item.FICHA || null,
    licitacao_numero: (() => {
      if (item.NUMLICIT && String(item.NUMLICIT).trim() !== "") return String(item.NUMLICIT).trim();
      if (detalhes?.NUMLIC && String(detalhes.NUMLIC).trim() !== "") return String(detalhes.NUMLIC).trim();
      const obj = detalhes?.HISTORICO || item.PRODU || "";
      const m = obj.match(/(?:preg[ãa]o|dispensa|inexigibilidade|concorr[êe]ncia|tomada|edital)[^\d]*(\d{1,4}[\/\.\-_]\d{4}|\d{1,4}\/\d{2})/i);
      return m ? m[1] : null;
    })(),
    licitacao_modalidade: (() => {
      if (item.LICIT && String(item.LICIT).trim() !== "" && String(item.LICIT) !== "OUTRO NÃO APLICÁVEL") return item.LICIT;
      if (detalhes?.LICIT && String(detalhes.LICIT).trim() !== "" && String(detalhes.LICIT) !== "OUTRO NÃO APLICÁVEL") return detalhes.LICIT;
      const obj = detalhes?.HISTORICO || item.PRODU || "";
      const m = obj.match(/(?:(preg[ãa]o\s*elet[rôo]nico|preg[ãa]o|dispensa|inexigibilidade|concorr[êe]ncia|tomada\s*de\s*pre[çc]os|edital))[^\d]*(\d{1,4}[\/\.\-_]\d{4}|\d{1,4}\/\d{2})/i);
      return m ? m[1].toUpperCase().replace("PREGAO", "PREGÃO").replace("ELETRONICO", "ELETRÔNICO") : item.LICIT || null;
    })(),
    licitacao_descricao: item.DESCLICIT_DETALHESEMPENHO || null,
    processo: item.PROC || null
  };
}

export async function sincronizarDespesasAno(ano: number) {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO SINCRONIZAÇÃO DELTA DE DESPESAS — ANO ${ano}`);
  console.log(`======================================================\n`);

  // 1. Mapear Despesas Orçamentárias existentes no banco
  console.log(`🔍 Carregando empenhos existentes no banco para o ano ${ano}...`);
  const { data: despesasBanco, error: errD } = await supabase
    .from("despesas")
    .select("id, empresa, pkemp, numero_empenho, empenhado, liquidado, pago, natureza_codigo, orgao_codigo")
    .eq("ano", ano);

  if (errD) {
    throw new Error(`Erro ao consultar tabela despesas: ${errD.message}`);
  }

  const mapaDespesasBanco = new Map<string, any>();
  for (const row of despesasBanco || []) {
    if (row.pkemp) {
      mapaDespesasBanco.set(`${row.empresa}_${row.pkemp}`, row);
    } else if (row.numero_empenho) {
      mapaDespesasBanco.set(`${row.empresa}_num_${row.numero_empenho}`, row);
    }
  }

  let despAtualizadas = 0;
  let despEnriquecidas = 0;
  let despInseridas = 0;
  let extraAtualizadas = 0;
  let extraInseridas = 0;
  let restosAtualizados = 0;
  let restosInseridos = 0;

  // 2. Varrer cada empresa (Excluindo Empresa 2 - Câmara)
  for (const emp of EMPRESAS) {
    console.log(`\n🏢 [Entidade ${emp.codigo}] ${emp.nome}`);

    // --- A. DESPESAS ORÇAMENTÁRIAS (Empenhos) ---
    const urlGerais = buildDespesasGeraisUrl(ano, emp.codigo);
    const listaEmpenhosApi = await fetchJson(urlGerais);
    console.log(`   🔸 Empenhos Orçamentários retornados pela API: ${listaEmpenhosApi.length}`);

    const novosParaInserir: any[] = [];

    for (const itemApi of listaEmpenhosApi) {
      if (!itemApi.CODIGO) continue;
      const pkemp = String(itemApi.PKEMP || `${ano}-${emp.codigo}-${itemApi.CODIGO}`).trim();
      const numEmp = String(itemApi.CODIGO).trim();
      const rowBanco = mapaDespesasBanco.get(`${emp.codigo}_${pkemp}`) || mapaDespesasBanco.get(`${emp.codigo}_num_${numEmp}`);

      const valorEmp = parseValor(itemApi.EMPENHADO);
      const valorLiq = parseValor(itemApi.LIQUIDADO);
      const valorPago = parseValor(itemApi.PAGO);

      if (rowBanco) {
        // Verifica se houve variação financeira
        const mudouFinanceiro =
          Math.abs((Number(rowBanco.empenhado) || 0) - valorEmp) > 0.01 ||
          Math.abs((Number(rowBanco.liquidado) || 0) - valorLiq) > 0.01 ||
          Math.abs((Number(rowBanco.pago) || 0) - valorPago) > 0.01;

        // Verifica se o registro no banco está sem classificação orçamentária
        const faltaClassificacao = !rowBanco.natureza_codigo || !rowBanco.orgao_codigo;

        if (mudouFinanceiro || faltaClassificacao) {
          const regAtualizado = await montarRegistroDespesa(itemApi, emp, ano, faltaClassificacao);
          const { error: errUp } = await supabase
            .from("despesas")
            .update(regAtualizado)
            .eq("id", rowBanco.id);

          if (!errUp) {
            if (mudouFinanceiro) despAtualizadas++;
            if (faltaClassificacao && !mudouFinanceiro) despEnriquecidas++;
          } else {
            console.warn(`      ⚠️ Erro ao atualizar empenho ${pkemp}: ${errUp.message}`);
          }
        }
      } else {
        // Novo empenho -> monta registro completo e põe na fila para lote
        const regNovo = await montarRegistroDespesa(itemApi, emp, ano, true);
        novosParaInserir.push(regNovo);
      }
    }

    // Insere novos empenhos em lotes de 100
    if (novosParaInserir.length > 0) {
      console.log(`      ✨ Inserindo ${novosParaInserir.length} novos empenhos de ${emp.nome}...`);
      const CHUNK_SIZE = 100;
      for (let i = 0; i < novosParaInserir.length; i += CHUNK_SIZE) {
        const chunk = novosParaInserir.slice(i, i + CHUNK_SIZE);
        const { error: errIns } = await supabase.from("despesas").insert(chunk);
        if (!errIns) {
          despInseridas += chunk.length;
        } else {
          console.error(`      ❌ Erro no insert de lote de despesas (${emp.codigo}): ${errIns.message}`);
        }
      }
    }

    // --- B. DESPESAS EXTRAORÇAMENTÁRIAS ---
    const urlExtra = buildExtraOrcamentariasUrl(ano, emp.codigo);
    const listaExtraApi = await fetchJson(urlExtra);
    console.log(`   🔸 Despesas Extraorçamentárias retornadas pela API: ${listaExtraApi.length}`);

    if (listaExtraApi.length > 0) {
      // Carregar existentes da entidade no banco
      const { data: extraBanco } = await supabase
        .from("despesas_extra_orcamentarias")
        .select("id, empresa, numero_guia, codigo, pago")
        .eq("ano", ano)
        .eq("empresa", emp.codigo);

      const mapaExtra = new Map<string, any>();
      for (const rx of extraBanco || []) {
        if (rx.numero_guia) mapaExtra.set(`guia_${rx.numero_guia}`, rx);
        else if (rx.codigo) mapaExtra.set(`cod_${rx.codigo}`, rx);
      }

      for (const itemEx of listaExtraApi) {
        const numGuia = String(itemEx.NUMGUIA || itemEx.NUMERO_GUIA || "").trim();
        const codEx = String(itemEx.CODIGO || "").trim();
        const rowEx = (numGuia ? mapaExtra.get(`guia_${numGuia}`) : null) || mapaExtra.get(`cod_${codEx}`);
        const vPagoEx = parseValor(itemEx.PAGO || itemEx.VALOR);

        if (rowEx) {
          if (Math.abs((Number(rowEx.pago) || 0) - vPagoEx) > 0.01) {
            await supabase
              .from("despesas_extra_orcamentarias")
              .update({ pago: vPagoEx })
              .eq("id", rowEx.id);
            extraAtualizadas++;
          }
        } else {
          const splitNom = splitCodigoDescricao(itemEx.NOMENCLATURA);
          await supabase.from("despesas_extra_orcamentarias").insert({
            ano,
            empresa: emp.codigo,
            codigo: codEx || null,
            descricao: itemEx.DESCRICAO || itemEx.HISTORICO || splitNom.descricao || "Despesa Extraorçamentária",
            nomenclatura: itemEx.NOMENCLATURA || null,
            historico: itemEx.HISTORICO || itemEx.DESCRICAO || null,
            data: parseDateBR(itemEx.DATA || itemEx.DATA_PAGAMENTO),
            numero_guia: numGuia || null,
            data_guia: parseDateBR(itemEx.DATAGUIA || itemEx.DATA_GUIA),
            cnpj_inscricao: itemEx.CNPJ_INSCRICAO || itemEx.CNPJ || null,
            codigo_adotado: itemEx.CODIGO_ADOTADO || null,
            pago: vPagoEx
          });
          extraInseridas++;
        }
      }
    }

    // --- C. RESTOS A PAGAR ---
    const urlRestos = buildRestosPagarUrl(ano, emp.codigo);
    const listaRestosApi = await fetchJson(urlRestos);
    console.log(`   🔸 Restos a Pagar retornados pela API: ${listaRestosApi.length}`);

    if (listaRestosApi.length > 0) {
      const { data: restosBanco } = await supabase
        .from("restos_pagar")
        .select("id, empresa, codigo, empenhado, liquidado, pago")
        .eq("ano", ano)
        .eq("empresa", emp.codigo);

      const mapaRestos = new Map<string, any>();
      for (const rr of restosBanco || []) {
        if (rr.codigo) mapaRestos.set(String(rr.codigo).trim(), rr);
      }

      for (const itemRp of listaRestosApi) {
        const codRp = String(itemRp.CODIGO || itemRp.NUMERO_EMPENHO || "").trim();
        if (!codRp) continue;
        const rowRp = mapaRestos.get(codRp);
        const vEmpRp = parseValor(itemRp.EMPENHADO || itemRp.VALOR_EMPENHADO);
        const vLiqRp = parseValor(itemRp.LIQUIDADO || itemRp.VALOR_LIQUIDADO);
        const vPagoRp = parseValor(itemRp.PAGO || itemRp.VALOR_PAGO);

        if (rowRp) {
          if (
            Math.abs((Number(rowRp.empenhado) || 0) - vEmpRp) > 0.01 ||
            Math.abs((Number(rowRp.liquidado) || 0) - vLiqRp) > 0.01 ||
            Math.abs((Number(rowRp.pago) || 0) - vPagoRp) > 0.01
          ) {
            await supabase
              .from("restos_pagar")
              .update({ empenhado: vEmpRp, liquidado: vLiqRp, pago: vPagoRp })
              .eq("id", rowRp.id);
            restosAtualizados++;
          }
        } else {
          await supabase.from("restos_pagar").insert({
            ano,
            empresa: emp.codigo,
            codigo: codRp,
            descricao: itemRp.DESCRICAO || itemRp.NOMEFOR || itemRp.HISTORICO || "Resto a Pagar",
            empenhado: vEmpRp,
            liquidado: vLiqRp,
            pago: vPagoRp
          });
          restosInseridos++;
        }
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ SINCRONIZAÇÃO DELTA DE DESPESAS (${ano}) CONCLUÍDA!`);
  console.log(`------------------------------------------------------`);
  console.log(`📦 EMPENHOS ORÇAMENTÁRIOS:`);
  console.log(`   • Novos Inseridos:        ${despInseridas}`);
  console.log(`   • Saldos Atualizados:     ${despAtualizadas}`);
  console.log(`   • Classif. Enriquecidas:  ${despEnriquecidas}`);
  console.log(`📦 DESPESAS EXTRAORÇAMENTÁRIAS:`);
  console.log(`   • Novas Inseridas:        ${extraInseridas}`);
  console.log(`   • Saldos Atualizados:     ${extraAtualizadas}`);
  console.log(`📦 RESTOS A PAGAR:`);
  console.log(`   • Novos Inseridos:        ${restosInseridos}`);
  console.log(`   • Saldos Atualizados:     ${restosAtualizados}`);
  console.log(`======================================================\n`);

  return { despInseridas, despAtualizadas, despEnriquecidas, extraInseridas, extraAtualizadas, restosInseridos, restosAtualizados };
}

// Suporte a execução CLI do script: npx tsx importar-despesas-cron.ts [ano]
if (typeof process !== "undefined" && process.argv && process.argv[1] && process.argv[1].includes("importar-despesas-cron")) {
  const args = process.argv.slice(2);
  const anoAlvo = args[0] ? parseInt(args[0], 10) : new Date().getFullYear();
  sincronizarDespesasAno(anoAlvo)
    .then(() => process.exit(0))
    .catch(err => {
      console.error("❌ Erro fatal na execução do cron de despesas:", err);
      process.exit(1);
    });
}
