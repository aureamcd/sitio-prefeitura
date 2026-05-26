import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE =
  "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Receitas/";

const EMPRESA = "1";

const ANOS = [2021, 2022, 2023, 2024, 2025, 2026];

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

function parseDateBR(date?: string | null) {
  if (!date) return null;

  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (!match) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function limparCodigo(codigo: string) {
  return codigo.replace(/[^\d]/g, "");
}

function formatarCodigo(clean: string) {
  if (!clean) return null;

  const padded = clean.padEnd(11, "0");

  return padded.replace(
    /^(\d{4})(\d{2})(\d)(\d)(\d{2})$/,
    "$1.$2.$3.$4.$5"
  );
}

function parseClassificacao(codigo: string) {
  const clean = limparCodigo(codigo);

  return {
    categoria: clean.slice(0, 1) || null,
    origem: clean.slice(0, 2) || null,
    especie: clean.slice(0, 3) || null,
    rubrica: clean.slice(0, 4) || null,
    alinea: clean.slice(0, 6) || null,
    subalinea: clean.slice(0, 8) || null,
    detalhamento: clean || null,
  };
}

function getNivel(codigo: string) {
  const clean = limparCodigo(codigo);

  if (/^\d000000000$/.test(clean)) return 1;

  if (/^\d{2}00000000$/.test(clean)) return 2;

  if (/^\d{4}000000$/.test(clean)) return 3;

  if (/^\d{6}0000$/.test(clean)) return 4;

  if (/^\d{8}00$/.test(clean)) return 5;

  return 6;
}

function getTipoNivel(nivel: number) {
  switch (nivel) {
    case 1:
      return "categoria";

    case 2:
      return "origem";

    case 3:
      return "especie";

    case 4:
      return "rubrica";

    case 5:
      return "alinea";

    default:
      return "subalinea";
  }
}

function getCodigoPai(codigo: string) {
  const clean = limparCodigo(codigo);

  if (/^\d000000000$/.test(clean)) {
    return null;
  }

  if (/^\d{2}00000000$/.test(clean)) {
    return formatarCodigo(`${clean[0]}000000000`);
  }

  if (/^\d{4}000000$/.test(clean)) {
    return formatarCodigo(`${clean.slice(0, 2)}00000000`);
  }

  if (/^\d{6}0000$/.test(clean)) {
    return formatarCodigo(`${clean.slice(0, 4)}000000`);
  }

  if (/^\d{8}00$/.test(clean)) {
    return formatarCodigo(`${clean.slice(0, 6)}0000`);
  }

  return formatarCodigo(`${clean.slice(0, 8)}00`);
}

async function fetchJSON(params: Record<string, string>) {
  const url = `${BASE}?${new URLSearchParams(params)}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Erro ${res.status}`);
  }

  return res.json();
}

async function importarReceitas(ano: number) {
  console.log(`\n📥 RECEITAS ${ano}`);

  const data = await fetchJSON({
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

  if (!data?.length) {
    console.log("⚠ Sem receitas");
    return;
  }

  await supabase
    .schema("transparencia")
    .from("receitas")
    .delete()
    .eq("ano", ano);

  const rowsMap = new Map<string, any>();

  for (const r of data) {
    const codigo = (r.CODIGO || "").trim();

    if (!codigo) continue;

    const key = [
      codigo,
      r.FONTESTN || "",
      r.FONTE || "",
      r.VINCODIGO || "",
    ].join("|");

    const clean = limparCodigo(codigo);

    const previsto_inicial = toNumber(r.PREVISAO_INICIAL);

    const previsto_atualizado = toNumber(r.PREVISAO_ATUALIZADA);

    const arrecadado_periodo = toNumber(r.ARRECADADO_PERIODO);

    const arrecadado_total = toNumber(r.ARRECADADO_TOTAL);

    if (rowsMap.has(key)) {
      const exist = rowsMap.get(key);

      exist.previsto_inicial += previsto_inicial;
      exist.previsto_atualizado += previsto_atualizado;
      exist.arrecadado_periodo += arrecadado_periodo;
      exist.arrecadado_total += arrecadado_total;

      continue;
    }

    const nivel = getNivel(codigo);

    const classificacao = parseClassificacao(codigo);

    rowsMap.set(key, {
      ano,

      codigo_contabil: codigo,

      codigo_limpo: clean,

      descricao: (r.NOME || "").trim(),

      nivel,

      tipo_nivel: getTipoNivel(nivel),

      codigo_pai: getCodigoPai(codigo),

      ...classificacao,

      cod_aplicacao: r.VINCODIGO || null,

      fonte_stn: r.FONTESTN || null,

      fonte_recurso: r.FONTE || null,

      previsto_inicial,

      previsto_atualizado,

      arrecadado_periodo,

      arrecadado_total,
    });
  }

  const rows = Array.from(rowsMap.values());

  rows.sort(
    (a: any, b: any) =>
      a.codigo_limpo.length - b.codigo_limpo.length
  );

  const { error } = await supabase
    .schema("transparencia")
    .from("receitas")
    .insert(rows);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`✅ ${rows.length} receitas`);
}

async function importarDetalhes(ano: number) {
  console.log(`\n📥 DETALHES ${ano}`);

  const { data: receitas } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("*")
    .eq("ano", ano)
    .in("tipo_nivel", ["alinea", "subalinea"]);

  if (!receitas?.length) return;

  await supabase
    .schema("transparencia")
    .from("receitas_detalhes")
    .delete()
    .eq("ano", ano);

  const globalSeen = new Set<string>();

  for (const receita of receitas) {
    try {
      const detalhes = await fetchJSON({
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

      if (!detalhes?.length) continue;

      const rows: any[] = [];

      for (const d of detalhes) {
        const codigo_contabil = receita.codigo_contabil;

        const data_lancamento = parseDateBR(d.DATA_RECEITA);

        const historico = (d.HISTORICO || "").trim();

        const documento = (d.CONTA || "").trim();

        const valor = toNumber(d.VALOR);

        const key = [
          ano,
          codigo_contabil,
          data_lancamento,
          valor,
          historico,
        ].join("|");

        if (globalSeen.has(key)) continue;

        globalSeen.add(key);

        rows.push({
          receita_id: receita.id,

          ano,

          codigo_contabil,

          descricao_receita: receita.descricao,

          data_lancamento,

          historico,

          documento,

          contribuinte: null,

          cpf_cnpj: null,

          valor,

          origem: "API JSON",
        });
      }

      if (rows.length) {
        await supabase
          .schema("transparencia")
          .from("receitas_detalhes")
          .insert(rows);
      }

      console.log(
        `↳ ${receita.codigo_contabil}: ${rows.length}`
      );
    } catch (err) {
      console.log(`⚠ erro ${receita.codigo_contabil}`);
    }
  }
}

async function importarExtra(ano: number) {
  console.log(`\n📥 EXTRA ${ano}`);

  const data = await fetchJSON({
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

  if (!data?.length) return;

  await supabase
    .schema("transparencia")
    .from("receitas_extra_orcamentarias")
    .delete()
    .eq("ano", ano);

  const rows = data.map((r: any) => ({
    ano,

    codigo: r.EXTRA || r.CODIGO || null,

    descricao: r.DESCRICAO || r.NOMENCLATURA || null,

    data_lancamento: parseDateBR(r.DTLAN),

    historico: r.HISTORICO || null,

    documento: null,

    contribuinte: null,

    cpf_cnpj: null,

    valor: toNumber(r.VALOR),

    origem: "API JSON",
  }));

  const { error } = await supabase
    .schema("transparencia")
    .from("receitas_extra_orcamentarias")
    .insert(rows);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`✅ ${rows.length} extras`);
}

async function main() {
  for (const ano of ANOS) {
    await importarReceitas(ano);

    await importarDetalhes(ano);

    await importarExtra(ano);
  }

  console.log("\n🎉 FINALIZADO");
}

main();