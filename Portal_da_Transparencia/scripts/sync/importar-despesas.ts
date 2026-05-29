/**
 * importar-despesas-gerais.ts
 *
 * Importa despesas gerais da API Fiorilli
 * para transparencia.despesas
 *
 * Uso:
 * npx tsx scripts/importar-despesas-gerais.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------------------------------------
// CONFIG
// ----------------------------------------------------

const BASE =
  "https://transparencia.padremarcos.pi.gov.br/Transparencia/VersaoJson/Despesas/";

const EMPRESAS = ["1"];
const ANOS = [2021, 2022, 2023, 2024, 2025, 2026];

// ----------------------------------------------------
// HELPERS
// ----------------------------------------------------

function parseMoney(value: any): number {
  if (!value) return 0;

  return Number(
    String(value)
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );
}

function parseDate(value: any): string | null {
  if (!value) return null;

  const parts = String(value).split("/");

  if (parts.length !== 3) return null;

  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ----------------------------------------------------
// IMPORTAÇÃO
// ----------------------------------------------------

async function importarDespesas() {
  for (const empresa of EMPRESAS) {
    for (const ano of ANOS) {
      console.log(`\n📦 Importando ${ano} - Empresa ${empresa}`);

      const url =
        `${BASE}?` +
        `ConectarExercicio=${ano}` +
        `&Listagem=DespesasGerais` +
        `&DiaInicioPeriodo=01` +
        `&MesInicialPeriodo=01` +
        `&DiaFinalPeriodo=31` +
        `&MesFinalPeriodo=12` +
        `&Ano=${ano}` +
        `&Empresa=${empresa}` +
        `&MostrarFornecedor=True` +
        `&MostraDadosConsolidado=False` +
        `&UFParaFiltroCOVID=` +
        `&MostrarCNPJFornecedor=True` +
        `&ApenasIDEmpenho=False`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          console.error(`❌ Erro HTTP: ${response.status}`);
          continue;
        }

        const json = await response.json();

        if (!Array.isArray(json)) {
          console.error("❌ Resposta não é array");
          continue;
        }

        console.log(`➡️ ${json.length} registros encontrados`);

        const rows = json.map((item: any) => ({
          empresa: Number(empresa),
          ano,

          numero_empenho:
            item.NumeroEmpenho ||
            item.numempenho ||
            item.NUMEROEMPENHO ||
            null,

          tipo_empenho:
            item.TipoEmpenho ||
            item.tipoempenho ||
            item.TIPOEMPENHO ||
            null,

          data_empenho: parseDate(
            item.DataEmpenho ||
              item.dataempenho ||
              item.DATAEMPENHO
          ),

          fornecedor_nome:
            item.NomeFornecedor ||
            item.Fornecedor ||
            item.nomefornecedor ||
            null,

          fornecedor_cpf_cnpj:
            item.CNPJFornecedor ||
            item.CPFCNPJ ||
            item.cnpjfornecedor ||
            null,

          orgao:
            item.Orgao ||
            item.orgao ||
            null,

          unidade:
            item.Unidade ||
            item.unidade ||
            null,

          funcao:
            item.Funcao ||
            item.funcao ||
            null,

          subfuncao:
            item.SubFuncao ||
            item.subfuncao ||
            null,

          programa:
            item.Programa ||
            item.programa ||
            null,

          acao:
            item.Acao ||
            item.acao ||
            null,

          elemento:
            item.Elemento ||
            item.elemento ||
            null,

          fonte_recurso:
            item.FonteRecurso ||
            item.fonterecurso ||
            null,

          historico:
            item.Historico ||
            item.historico ||
            null,

          modalidade_licitacao:
            item.ModalidadeLicitacao ||
            item.modalidadelicitacao ||
            null,

          numero_processo:
            item.NumeroProcesso ||
            item.numeroprocesso ||
            null,

          numero_licitacao:
            item.NumeroLicitacao ||
            item.numerolicitacao ||
            null,

          valor_empenhado: parseMoney(
            item.ValorEmpenhado ||
              item.valorempenhado
          ),

          valor_liquidado: parseMoney(
            item.ValorLiquidado ||
              item.valorliquidado
          ),

          valor_pago: parseMoney(
            item.ValorPago ||
              item.valorpago
          ),

          raw_json: item,
        }));

        const chunkSize = 500;

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);

          const { error } = await supabase
            .schema("transparencia")
            .from("despesas")
            .upsert(chunk, {
              onConflict:
                "empresa,ano,numero_empenho,tipo_empenho",
            });

          if (error) {
            console.error("❌ Erro Supabase:", error.message);
          } else {
            console.log(
              `✅ ${Math.min(
                i + chunkSize,
                rows.length
              )}/${rows.length}`
            );
          }

          await sleep(300);
        }
      } catch (err) {
        console.error("❌ Erro geral:", err);
      }

      await sleep(1500);
    }
  }

  console.log("\n🎉 Importação finalizada");
}

importarDespesas();
