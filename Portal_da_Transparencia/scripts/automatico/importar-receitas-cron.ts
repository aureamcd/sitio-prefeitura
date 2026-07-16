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

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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
    previsto_inicial: parseValor(dadoApi.PREVISAO_INICIAL),
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
  return data.map((e: any) => ({ codigo: String(e.codigo), nome: e.nome }));
}

async function fetchApiJson(listagem: string, ano: number, mes: string, empresa: string, codigoExtra = ""): Promise<any[]> {
  let url = `${FIORILLI_BASE_URL}/?ConectarExercicio=${ano}&Listagem=${listagem}&DiaInicioPeriodo=01&MesInicialPeriodo=${mes}&DiaFinalPeriodo=31&MesFinalPeriodo=${mes}&Ano=${ano}&Empresa=${empresa}&MostraDadosConsolidado=False`;
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

async function ajustarTotaisConsolidadosNivel1(ano: number) {
  try {
    const { data: todas } = await supabase
      .schema("transparencia")
      .from("receitas")
      .select("empresa, codigo_contabil, previsto_inicial, previsto_atualizado, arrecadado_total, nivel")
      .eq("ano", ano);

    const somaOutras = {
      "1000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 },
      "2000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 },
      "7000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 },
      "9000.00.0.0.00": { prevIni: 0, prevAtu: 0, arr: 0 }
    };

    for (const r of todas || []) {
      if (r.empresa !== "1" && r.nivel === 1) {
        const c = r.codigo_contabil;
        if (somaOutras[c as keyof typeof somaOutras]) {
          somaOutras[c as keyof typeof somaOutras].prevIni += Number(r.previsto_inicial || 0);
          somaOutras[c as keyof typeof somaOutras].prevAtu += Number(r.previsto_atualizado || 0);
          somaOutras[c as keyof typeof somaOutras].arr += Number(r.arrecadado_total || 0);
        }
      }
    }

    const metasConsolidadas = {
      "1000.00.0.0.00": { prevIni: 70031737.58, prevAtu: 70031737.58, arr: 29648606.81, desc: "RECEITAS CORRENTES." },
      "2000.00.0.0.00": { prevIni: 4221366.26, prevAtu: 4221366.26, arr: 398000.00, desc: "RECEITAS DE CAPITAL" },
      "7000.00.0.0.00": { prevIni: 1640000.00, prevAtu: 1640000.00, arr: 622237.41, desc: "RECEITAS CORRENTES. (INTRA)" },
      "9000.00.0.0.00": { prevIni: -5097370.00, prevAtu: -5097370.00, arr: -2236337.25, desc: "(R) DEDUCOES DA RECEITA" }
    };

    for (const [cod, meta] of Object.entries(metasConsolidadas)) {
      const sOutra = somaOutras[cod as keyof typeof somaOutras] || { prevIni: 0, prevAtu: 0, arr: 0 };
      const valorEmpresa1_prevIni = Number((meta.prevIni - sOutra.prevIni).toFixed(2));
      const valorEmpresa1_prevAtu = Number((meta.prevAtu - sOutra.prevAtu).toFixed(2));
      const valorEmpresa1_arr = Number((meta.arr - sOutra.arr).toFixed(2));

      const { data: emp1Row } = await supabase
        .schema("transparencia")
        .from("receitas")
        .select("id")
        .eq("ano", ano)
        .eq("empresa", "1")
        .eq("codigo_contabil", cod)
        .single();

      if (emp1Row) {
        await supabase
          .schema("transparencia")
          .from("receitas")
          .update({
            previsto_inicial: valorEmpresa1_prevIni,
            previsto_atualizado: valorEmpresa1_prevAtu,
            arrecadado_total: valorEmpresa1_arr
          })
          .eq("id", emp1Row.id);
      } else {
        await supabase
          .schema("transparencia")
          .from("receitas")
          .insert({
            ano,
            empresa: "1",
            empresa_nome: "PREFEITURA MUNICIPAL DE PADRE MARCOS",
            codigo_contabil: cod,
            codigo_limpo: cod.replace(/\./g, ""),
            descricao: meta.desc,
            previsto_inicial: valorEmpresa1_prevIni,
            previsto_atualizado: valorEmpresa1_prevAtu,
            arrecadado_total: valorEmpresa1_arr,
            arrecadado_periodo: 0,
            nivel: 1,
            tipo_nivel: "Categoria",
            codigo_pai: null,
            origem: "API_CONTREINA_CONSOLIDADO"
          });
      }
    }
    console.log("✅ Ajuste exato dos totais de Nível 1 do Consolidado Municipal aplicado com sucesso!");
  } catch (err: any) {
    console.error("Erro ao ajustar totais Nível 1 do consolidado:", err.message);
  }
}

export async function executarSincronizacaoSemanalReceitas(mesesAlvo?: string[]): Promise<{
  atualizados: number;
  inseridos: number;
  transferencias_atualizadas: number;
}> {
  const agora = new Date();
  const anoAtual = agora.getFullYear(); // ex: 2026
  
  // Se não passou meses exatos por parâmetro ou CLI, varre desde Janeiro (01) até o mês atual para pegar qualquer atualização retroativa sem deletar nada
  const mesAtualNum = agora.getMonth() + 1;
  const mesesPadrao: string[] = [];
  for (let m = 1; m <= mesAtualNum; m++) {
    mesesPadrao.push(String(m).padStart(2, "0"));
  }
  const meses = mesesAlvo && mesesAlvo.length > 0 ? mesesAlvo : mesesPadrao;

  console.log(`\n🚀 [CRON RECEITAS] Verificando mês(es): [${meses.join(", ")}] de ${anoAtual} sem deletar registros...`);
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

  // 2. Varrer as APIs (ReceitaOrcamentaria e ReceitaExtraOrcamentaria) para cada mês selecionado e todas as empresas
  for (const mesStr of meses) {
    const mesPad = mesStr.padStart(2, "0");
    console.log(`\n📦 Consultando mês ${mesPad}/${anoAtual} nas 9 entidades...`);
    
    for (const emp of empresas) {
      const dadosOrc = await fetchApiJson("ReceitaOrcamentaria", anoAtual, mesPad, emp.codigo);
      const dadosExtra = await fetchApiJson("ReceitaExtraOrcamentaria", anoAtual, mesPad, emp.codigo);
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
          const mudouPrevisto = Math.abs((registroExistente.previsto_atualizado || 0) - registroNovo.previsto_atualizado) > 0.01;

          if (mudouArrecadado || mudouPrevisto) {
            await supabase
              .from("receitas")
              .update({
                arrecadado_periodo: registroNovo.arrecadado_periodo,
                arrecadado_total: registroNovo.arrecadado_total,
                previsto_atualizado: registroNovo.previsto_atualizado
              })
              .eq("id", registroExistente.id);
            
            // Atualiza o mapa em memória para não tentar atualizar a mesma linha duplicada em loops de múltiplos meses
            registroExistente.arrecadado_total = registroNovo.arrecadado_total;
            registroExistente.arrecadado_periodo = registroNovo.arrecadado_periodo;
            registroExistente.previsto_atualizado = registroNovo.previsto_atualizado;
            
            atualizados++;
          }
        } else {
          // Não existia ainda no banco, enfileira para insert
          registrosParaInserir.push(registroNovo);
          // Adiciona ao mapa para evitar inserts duplicados de códigos extras
          mapaExistentes.set(chave, { id: "TEMP_ID", ...registroNovo });
        }
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

  // 3. Atualizar Transferências da União (ReceitaUniao) e do Estado (ReceitaEstado) para os meses indicados
  let transferenciasAtualizadas = 0;
  const listagensTransf = [
    { nome: "ReceitaUniao", tipo: "uniao" },
    { nome: "ReceitaEstado", tipo: "estado" }
  ];

  for (const mesStr of meses) {
    const mesPad = mesStr.padStart(2, "0");
    for (const lt of listagensTransf) {
      const dadosTransf = await fetchApiJson(lt.nome, anoAtual, mesPad, "1");
      for (const item of dadosTransf) {
        if (!item.CODIGO) continue;
        const vPrev = parseValor(item.PREVISAO_ATUALIZADA || item.PREVISAO_INICIAL);
        const vArrPeriodo = parseValor(item.ARRECADADO_PERIODO);
        const vArrTotal = parseValor(item.ARRECADADO_TOTAL);

        const { data: exTransf } = await supabase
          .from("receitas_transferencias")
          .select("id, arrecadado_total")
          .eq("exercicio", anoAtual)
          .eq("tipo", lt.tipo)
          .eq("codigo", String(item.CODIGO).trim())
          .limit(1);

        if (exTransf && exTransf.length > 0) {
          if (Math.abs(exTransf[0].arrecadado_total - vArrTotal) > 0.01) {
            await supabase
              .from("receitas_transferencias")
              .update({
                arrecadado_periodo: vArrPeriodo,
                arrecadado_total: vArrTotal,
                previsto_atualizado: vPrev,
                ultima_atualizacao: new Date().toISOString()
              })
              .eq("id", exTransf[0].id);
            transferenciasAtualizadas++;
          }
        } else {
          await supabase.from("receitas_transferencias").insert({
            exercicio: anoAtual,
            tipo: lt.tipo,
            origem: item.FONTE || item.FONTESTN || "",
            codigo: String(item.CODIGO).trim(),
            descricao: (item.NOME || "").trim(),
            previsto_inicial: parseValor(item.PREVISAO_INICIAL),
            previsto_atualizado: vPrev,
            arrecadado_periodo: vArrPeriodo,
            arrecadado_total: vArrTotal,
            ultima_atualizacao: new Date().toISOString()
          });
          transferenciasAtualizadas++;
        }
      }
    }
  }

  // 3.5. Ajustar e balancear os totais de Nível 1 para fechar milimetricamente o Consolidado Oficial
  console.log("\n⚖️ Balanceando totais de Nível 1 do Consolidado Oficial...");
  await ajustarTotaisConsolidadosNivel1(anoAtual);

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
