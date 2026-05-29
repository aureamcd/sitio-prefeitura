/**
 * importar-servidores.ts
 *
 * Importa servidores mês a mês para evitar
 * perda de dados da API.
 *
 * Uso:
 * npx tsx scripts/importar-servidores.ts
 * npx tsx scripts/importar-servidores.ts --anos=2024,2025
 * npx tsx scripts/importar-servidores.ts --entidade=1,3
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------
const BASE_URL =
  "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EMPRESAS = [
  { codigo: "1", nome: "PREFEITURA MUNICIPAL DE PADRE MARCOS" },
  { codigo: "3", nome: "FUNDO MUNICIPAL DE SAÚDE" },
  { codigo: "4", nome: "FUNDEB" },
  { codigo: "5", nome: "FMAS" },
  { codigo: "6", nome: "HOSPITAL" },
  { codigo: "7", nome: "RPPS" },
  { codigo: "8", nome: "FUNDO DA CRIANÇA" },
  { codigo: "9", nome: "MEIO AMBIENTE" },
  { codigo: "10", nome: "CULTURA E TURISMO" },
];

const ANOS_PADRAO = [2023, 2024, 2025, 2026];

// ---------------------------------------------------------------------
// ARGUMENTOS
// ---------------------------------------------------------------------
const args = process.argv.slice(2);

const anosArg = args.find((a) => a.startsWith("--anos="));
const entidadeArg = args.find((a) => a.startsWith("--entidade="));

const anosSelecionados = anosArg
  ? anosArg
      .split("=")[1]
      .split(",")
      .map(Number)
      .filter(Boolean)
  : ANOS_PADRAO;

const entidadesSelecionadas = entidadeArg
  ? entidadeArg.split("=")[1].split(",")
  : [];

const EMPRESAS_USAR =
  entidadesSelecionadas.length > 0
    ? EMPRESAS.filter((e) =>
        entidadesSelecionadas.includes(e.codigo)
      )
    : EMPRESAS;

// ---------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseDateBR(value?: string | null): string | null {
  if (!value) return null;

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);

  if (!match) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function toNumber(value: any): number {
  if (!value) return 0;

  if (typeof value === "number") return value;

  return (
    Number(
      String(value)
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "")
    ) || 0
  );
}

function log(label: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 19);

  console.log(`[${ts}] [${label}] ${msg}`);
}

// ---------------------------------------------------------------------
// FETCH API
// ---------------------------------------------------------------------
async function fetchAPI(params: Record<string, string>) {
  const url = `${BASE_URL}/Pessoal/?${new URLSearchParams(
    params
  )}`;

  console.log(`🌐 ${url}`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    throw new Error(`API retornou ${response.status}`);
  }

  const json = await response.json();

  return Array.isArray(json) ? json : [];
}

// ---------------------------------------------------------------------
// INSERT EM LOTES
// ---------------------------------------------------------------------
async function insertBatch(rows: any[]) {
  if (!rows.length) return 0;

  const BATCH_SIZE = 200;

  let inseridos = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .schema("transparencia")
      .from("servidores")
      .insert(batch);

    if (error) {
      console.error("❌", error.message);

      for (const row of batch) {
        const { error: rowError } = await supabase
          .schema("transparencia")
          .from("servidores")
          .insert(row);

        if (rowError) {
          if (
            !rowError.message.includes("duplicate key")
          ) {
            console.error(
              "❌ Linha:",
              rowError.message
            );
          }
        } else {
          inseridos++;
        }
      }
    } else {
      inseridos += batch.length;
    }
  }

  return inseridos;
}

// ---------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------
async function main() {
  console.log("");
  console.log("=======================================");
  console.log("👥 IMPORTADOR DE SERVIDORES");
  console.log("=======================================");
  console.log("");

  let totalGeral = 0;

  for (const empresa of EMPRESAS_USAR) {
    for (const ano of anosSelecionados) {
      for (let mes = 1; mes <= 12; mes++) {
        try {
          const mesStr = String(mes).padStart(2, "0");

          log(
            "SERVIDORES",
            `Buscando ${empresa.codigo}/${ano}/${mesStr}`
          );

          const data = await fetchAPI({
            ConectarExercicio: String(ano),

            Listagem: "Servidores",

            Empresa: empresa.codigo,

            Ano: String(ano),

            DiaInicioPeriodo: "01",
            MesInicialPeriodo: mesStr,

            DiaFinalPeriodo: "31",
            MesFinalPeriodo: mesStr,

            MostraDadosConsolidado: "False",
          });

          if (!data.length) {
            log(
              "SERVIDORES",
              `⚠ Sem dados em ${mesStr}/${ano}`
            );

            continue;
          }

          // tenta descobrir chave do líquido
          const sample = data[0];

          const LIQUIDO_KEY =
            Object.keys(sample).find((k) =>
              k.toUpperCase().includes("LIQ")
            ) || "LIQUIDO";

          const rows = data.map((r: any) => ({
            ano,
            mes,

            empresa: empresa.codigo,
            empresa_nome: empresa.nome,

            matricula: (r.REGISTRO || "").trim(),

            nome: (r.NOME || "").trim(),

            cargo: (
              r.CARGO ||
              r.CARGOINICIO ||
              ""
            ).trim(),

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

            tipo_contrato: (
              r.TIPOCONTRATO || ""
            ).trim(),

            regime: (
              r.TIPOREGIME || ""
            ).trim(),

            situacao: (
              r.SITUACAOFUNCIONAL || ""
            ).trim(),

            data_admissao:
              parseDateBR(r.DATAADMISSAO),

            data_exoneracao:
              parseDateBR(r.DATADESLIGAMENTO) ||
              parseDateBR(r.DTTERMINO),

            carga_horaria: Number(
              r.HORASEMANAL || 0
            ),

            referencia_folha: (
              r.REFERENCIA_NOME || ""
            ).trim(),

            rendimentos: toNumber(
              r.PROVENTOS
            ),

            descontos: toNumber(
              r.DESCONTOS
            ),

            liquido: toNumber(
              r[LIQUIDO_KEY]
            ),

            origem: "API-JSON",
          }));

          const inseridos = await insertBatch(rows);

          totalGeral += inseridos;

          log(
            "SERVIDORES",
            `✅ ${empresa.codigo}/${ano}/${mesStr}: ${inseridos} registros`
          );

          await sleep(400);
        } catch (err: any) {
          console.error(
            `❌ ${empresa.codigo}/${ano}/${mes}:`,
            err.message
          );
        }
      }
    }
  }

  console.log("");
  console.log("=======================================");
  console.log(`✅ FINALIZADO: ${totalGeral} registros`);
  console.log("=======================================");
  console.log("");
}

main().catch((err) => {
  console.error("❌ ERRO FATAL:", err);
  process.exit(1);
});