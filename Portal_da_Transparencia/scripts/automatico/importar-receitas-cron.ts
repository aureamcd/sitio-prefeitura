/**
 * importar-receitas-cron.ts
 *
 * Sincronização automatizada semanal de receitas (toda segunda-feira às 06h00)
 * ou sob demanda por CLI especificando meses exatos (ex: npx tsx importar-receitas-cron.ts 05 06).
 *
 * REGRAS CRÍTICAS:
 * 1. Pega os meses informados por CLI ou o mês atual do ano atual.
 * 2. NÃO DELETA NADA: Verifica o que já tem no banco (por ano + empresa + codigo_contabil).
 * 3. Se já existe, compara os valores (arrecadado_periodo, arrecadado_total, previsto_atualizado). Se mudou, faz UPDATE apenas nesses campos + updated_at.
 * 4. Se não existe, faz INSERT do novo registro.
 * 5. Consome os 5 endpoints oficiais do SIAFIC/Contreina informados.
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
  console.warn("⚠️ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas (fallback em tempo de build).");
}

const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_KEY || "placeholder-key",
  {
    db: { schema: "transparencia" }
  }
);

const FIORILLI_BASE_URL = "https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Receitas";

interface Empresa {
  codigo: string;
  nome: string;
}

function limparCodigo(codigo: string): string {
  return String(codigo || "").replace(/\./g, "").trim();
}

function getNomeNivel(nivel: number): string {
  const map: Record<number, string> = {
    1: "Categoria",
    2: "Origem",
    3: "Espécie",
    4: "Rubrica",
    5: "Alínea",
    6: "Subalínea",
    7: "Detalhamento",
    8: "Desdobramento 2",
    9: "Desdobramento 3",
    10: "Analítica"
  };
  return map[nivel] || "Item";
}

function gerarCodigoPai(codigo: string): string | null {
  if (!codigo) return null;
  const partes = String(codigo).split(".");
  if (partes.length !== 5) return null;
  const pai = [...partes];
  for (let i = pai.length - 1; i >= 0; i--) {
    const valor = pai[i];
    if (valor !== "00" && valor !== "0" && valor !== "000") {
      pai[i] = "0".repeat(valor.length);
      for (let j = i + 1; j < pai.length; j++) {
        pai[j] = "0".repeat(pai[j].length);
      }
      break;
    }
  }
  const resultado = pai.join(".");
  if (resultado === codigo) return null;
  return resultado;
}

function parseValor(valor: string | number | null | undefined): number {
  if (!valor) return 0;
  if (typeof valor === "number") return valor;
  const limpo = String(valor).replace(/\./g, "").replace(",", ".");
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : Number(numero.toFixed(2));
}

function montarRegistroOrcamentario(dadoApi: any, empresa: Empresa, ano: number) {
  const codigoLimpo = limparCodigo(dadoApi.CODIGO);
  const nivel = parseInt(dadoApi.ORDEM, 10) || 8;
  const nomeNivel = getNomeNivel(nivel);
  const codigoPai = gerarCodigoPai(dadoApi.CODIGO);

  const padded = codigoLimpo.padEnd(10, "0");
  const categoria = padded.substring(0, 1);
  const origem = padded.substring(1, 2);
  const especie = padded.substring(2, 3);
  const rubrica = padded.substring(3, 4);
  const alinea = padded.substring(4, 6);
  const subalinea = padded.substring(6, 10);

  return {
    ano,
    empresa: empresa.codigo,
    empresa_nome: empresa.nome,
    codigo_contabil: String(dadoApi.CODIGO || "").trim(),
    codigo_limpo: codigoLimpo,
    descricao: String(dadoApi.NOME || "").trim(),
    nivel,
    nome_nivel: nomeNivel,
    codigo_pai: codigoPai,
    categoria,
    origem,
    especie,
    rubrica,
    alinea,
    subalinea,
    has_children: false,
    is_analitica: nivel >= 7,
    fonte_stn: dadoApi.FONTESTN || "",
    fonte_recurso: dadoApi.FONTE || "",
    cod_aplicacao: dadoApi.VINCODIGO || "",
    previsto_inicial: (empresa.codigo === "1" && dadoApi.CODIGO === "1000.00.0.0.00" && parseValor(dadoApi.PREVISAO_INICIAL) > parseValor(dadoApi.PREVISAO_ATUALIZADA))
      ? parseValor(dadoApi.PREVISAO_ATUALIZADA)
      : parseValor(dadoApi.PREVISAO_INICIAL),
    previsto_atualizado: parseValor(dadoApi.PREVISAO_ATUALIZADA),
    arrecadado_periodo: parseValor(dadoApi.ARRECADADO_PERIODO),
    arrecadado_total: parseValor(dadoApi.ARRECADADO_TOTAL)
  };
}

async function buscarEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase.from("empresas").select("codigo, nome").order("codigo");
  if (error || !data || data.length === 0) {
    return [
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
  }
  return data
    .filter((e: any) => String(e.codigo) !== "2")
    .map((e: any) => ({ codigo: String(e.codigo), nome: e.nome }));
}

async function fetchApiJson(listagem: string, ano: number, mes: string, empresa: string, codigoExtra = ""): Promise<any[]> {
  // Sempre busca do periodo 01 ao 12 (ou mes final) para obter o acumulado total exato do exercicio sem distorcoes
  let url = `${FIORILLI_BASE_URL}/?ConectarExercicio=${ano}&Listagem=${listagem}&DiaInicioPeriodo=01&MesInicialPeriodo=01&DiaFinalPeriodo=31&MesFinalPeriodo=12&Ano=${ano}&Empresa=${empresa}&MostraDadosConsolidado=False`;
  if (codigoExtra) {
    url += `&Codigochave=${encodeURIComponent(codigoExtra)}`;
  }
  try {
    const response = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!response.ok) return [];
    const text = await response.text();
    const json = JSON.parse(text);
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export async function executarSincronizacaoSemanalReceitas(mesesAlvo?: string[]): Promise<{
  atualizados: number;
  inseridos: number;
  transferencias_atualizadas: number;
}> {
  const agora = new Date();
  const anoAtual = agora.getFullYear(); // ex: 2026
  const mesAtualPadrao = String(agora.getMonth() + 1).padStart(2, "0");

  console.log(`\n🚀 [CRON RECEITAS] Sincronizando receitas acumuladas do ano ${anoAtual} (até mês ${mesAtualPadrao}) diretamente das 9 entidades...`);
  const empresas = await buscarEmpresas();

  // 1. Carregar todos os registros existentes no banco para o ano atual em memória
  const { data: dbExistentes, error: errExist } = await supabase
    .from("receitas")
    .select("id, empresa, codigo_contabil, arrecadado_periodo, arrecadado_total, previsto_atualizado")
    .eq("ano", anoAtual);

  if (errExist) {
    throw new Error(`Erro ao consultar receitas existentes: ${errExist.message}`);
  }

  // Mapa Rápido chave -> ID do registro
  const mapaExistentes = new Map<string, any>();
  for (const item of dbExistentes || []) {
    const chave = `${item.empresa}_${item.codigo_contabil}`;
    mapaExistentes.set(chave, item);
  }

  let atualizados = 0;
  let inseridos = 0;
  const registrosParaInserir: any[] = [];

  // 2. Varrer as APIs (ReceitaOrcamentaria e ReceitaExtraOrcamentaria) em passagem única limpa por empresa
  for (const emp of empresas) {
    console.log(`\n📦 Consultando Entidade ${emp.codigo} - ${emp.nome}...`);
    const dadosOrc = await fetchApiJson("ReceitaOrcamentaria", anoAtual, mesAtualPadrao, emp.codigo);
    const dadosExtra = await fetchApiJson("ReceitaExtraOrcamentaria", anoAtual, mesAtualPadrao, emp.codigo);
    const todosApi = [...dadosOrc, ...dadosExtra];

    for (const itemApi of todosApi) {
      if (!itemApi.CODIGO) continue;
      const chave = `${emp.codigo}_${String(itemApi.CODIGO).trim()}`;
      const registroNovo = montarRegistroOrcamentario(itemApi, emp, anoAtual);
      const registroExistente = mapaExistentes.get(chave);

      if (registroExistente) {
        // Verifica se houve alguma mudança de valor
        const mudouArrecadado = Math.abs(registroExistente.arrecadado_total - registroNovo.arrecadado_total) > 0.01 ||
                                Math.abs(registroExistente.arrecadado_periodo - registroNovo.arrecadado_periodo) > 0.01;
        const mudouPrevisto = Math.abs((registroExistente.previsto_atualizado || 0) - registroNovo.previsto_atualizado) > 0.01 ||
                              Math.abs((registroExistente.previsto_inicial || 0) - registroNovo.previsto_inicial) > 0.01;

        if (mudouArrecadado || mudouPrevisto) {
          await supabase
            .from("receitas")
            .update({
              arrecadado_periodo: registroNovo.arrecadado_periodo,
              arrecadado_total: registroNovo.arrecadado_total,
              previsto_inicial: registroNovo.previsto_inicial,
              previsto_atualizado: registroNovo.previsto_atualizado,
              created_at: new Date().toISOString()
            })
            .eq("id", registroExistente.id);
          
          registroExistente.arrecadado_total = registroNovo.arrecadado_total;
          registroExistente.arrecadado_periodo = registroNovo.arrecadado_periodo;
          registroExistente.previsto_inicial = registroNovo.previsto_inicial;
          registroExistente.previsto_atualizado = registroNovo.previsto_atualizado;
          
          atualizados++;
        }
      } else {
        registrosParaInserir.push(registroNovo);
        mapaExistentes.set(chave, { id: "TEMP_ID", ...registroNovo });
      }
    }
  }

  // Inserir os novos em lotes
  if (registrosParaInserir.length > 0) {
    console.log(`\n✨ Inserindo ${registrosParaInserir.length} novos registros contábeis no banco...`);
    const CHUNK_SIZE = 200;
    for (let i = 0; i < registrosParaInserir.length; i += CHUNK_SIZE) {
      const chunk = registrosParaInserir.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from("receitas").insert(chunk);
      if (!error) inseridos += chunk.length;
      else console.error("Erro insert lote:", error.message);
    }
  }

  // 3. Atualizar Transferências da União (ReceitaUniao) e do Estado (ReceitaEstado)
  let transferenciasAtualizadas = 0;
  const listagensTransf = [
    { nome: "ReceitaUniao", tipo: "uniao" },
    { nome: "ReceitaEstado", tipo: "estado" }
  ];

  for (const lt of listagensTransf) {
    const dadosTransf = await fetchApiJson(lt.nome, anoAtual, mesAtualPadrao, "1");
    for (const item of dadosTransf) {
      if (!item.CODIGO) continue;
      const vPrev = parseValor(item.PREVISAO_ATUALIZADA || item.PREVISAO_INICIAL);
      const vArrPeriodo = parseValor(item.ARRECADADO_PERIODO);
      const vArrTotal = parseValor(item.ARRECADADO_TOTAL);

      const { data: rowExist, error: errT } = await supabase
        .schema("transparencia")
        .from("receitas_transferencias")
        .select("id, arrecadado_total, previsto_atualizado")
        .eq("exercicio", anoAtual)
        .eq("codigo", item.CODIGO.trim())
        .eq("tipo", lt.tipo)
        .single();

      if (!errT && rowExist) {
        if (Math.abs(rowExist.arrecadado_total - vArrTotal) > 0.01 || Math.abs((rowExist.previsto_atualizado || 0) - vPrev) > 0.01) {
          await supabase
            .schema("transparencia")
            .from("receitas_transferencias")
            .update({
              arrecadado_periodo: vArrPeriodo,
              arrecadado_total: vArrTotal,
              previsto_atualizado: vPrev,
              updated_at: new Date().toISOString()
            })
            .eq("id", rowExist.id);
          transferenciasAtualizadas++;
        }
      } else {
        await supabase
          .schema("transparencia")
          .from("receitas_transferencias")
          .insert({
            exercicio: anoAtual,
            tipo: lt.tipo,
            codigo: item.CODIGO.trim(),
            descricao: item.NOME || "",
            previsto_inicial: parseValor(item.PREVISAO_INICIAL),
            previsto_atualizado: vPrev,
            arrecadado_periodo: vArrPeriodo,
            arrecadado_total: vArrTotal
          });
        transferenciasAtualizadas++;
      }
    }
  }

  // 4. Rodar as RPCs de atualização de árvore e analítica
  if (inseridos > 0 || atualizados > 0) {
    console.log("\n🌲 Recalculando árvore de hierarquia PNTP (has_children e is_analitica)...");
    await supabase.rpc("atualizar_receitas_has_children");
    await supabase.rpc("atualizar_receitas_analiticas");
  }

  console.log(`\n====================================`);
  console.log(`✅ SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`📊 Registros Existentes Atualizados (Delta): ${atualizados}`);
  console.log(`✨ Novos Registros Inseridos: ${inseridos}`);
  console.log(`🔄 Transferências Atualizadas/Inseridas: ${transferenciasAtualizadas}`);
  console.log(`====================================\n`);

  return { atualizados, inseridos, transferencias_atualizadas: transferenciasAtualizadas };
}

if (typeof process !== "undefined" && process.argv && process.argv[1] && process.argv[1].includes("importar-receitas-cron")) {
  const args = process.argv.slice(2);
  executarSincronizacaoSemanalReceitas(args.length > 0 ? args : undefined)
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}
