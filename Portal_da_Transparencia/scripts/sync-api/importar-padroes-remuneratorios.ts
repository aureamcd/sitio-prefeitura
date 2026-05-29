/**
 * importar-padroes-remuneratorios.ts
 *
 * IMPORTA:
 * CSV -> transparencia.padroes_remuneratorios
 *
 * USO:
 * npx tsx scripts/importar-padroes-remuneratorios.ts
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

dotenv.config();

/**
 * SUPABASE
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * CSV
 */

const CSV_PATH = path.resolve(
  "Portal Transp. Quadro Funcional.csv"
);

/**
 * HELPERS
 */

function limparTexto(valor: any): string | null {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  return String(valor)
    .replace(/<br>/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function converterNumero(valor: any): number | null {
  if (!valor) return null;

  const numero = Number(
    String(valor)
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
      .trim()
  );

  return isNaN(numero)
    ? null
    : numero;
}

/**
 * IMPORTAÇÃO
 */

async function executar() {
  console.log(
    "🚀 IMPORTANDO PADRÕES REMUNERATÓRIOS"
  );

  const rows: any[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(
        csv({
          separator: ",",
        })
      )
      .on("data", (item) => {
        rows.push({
          cargo: limparTexto(
            item["Denominação"]
          ),

          classe: limparTexto(
            item["Nome Natureza"]
          ),

          nivel: limparTexto(
            item["Natureza"]
          ),

          salario_base: converterNumero(
            item[
              "Ref. salarial inicial (Plano de Cargos)"
            ]
          ),

          carga_horaria: null,

          legislacao: null,

          pdf_url: null,
        });
      })

      .on("end", async () => {
        console.log(
          `📦 ${rows.length} registros`
        );

        const BATCH = 200;

        let total = 0;

        for (
          let i = 0;
          i < rows.length;
          i += BATCH
        ) {
          const batch = rows.slice(
            i,
            i + BATCH
          );

          const { error } = await supabase
            .schema("transparencia")
            .from(
              "padroes_remuneratorios"
            )
            .insert(batch);

          if (error) {
            console.error(
              "❌ erro:",
              error.message
            );
          } else {
            total += batch.length;
          }
        }

        console.log(
          `✅ ${total} registros importados`
        );

        resolve();
      })

      .on("error", (err) => {
        reject(err);
      });
  });
}

executar().catch((err) => {
  console.error("❌ ERRO:", err);
});