/**
 * Lê o boletim de medição (BMS) da U.E. Cândida Macêdo.
 */
import fs from "fs";
import pdf from "pdf-parse";

async function main() {
  const f = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch_tarjados_local/medicoes/candida-bms.pdf";
  const buf = fs.readFileSync(f);
  const data = await pdf(buf);
  const text = data.text || "";
  const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);

  console.log("=".repeat(90));
  console.log(`📄 U.E. CÂNDIDA MACÊDO - BMS 1ª MEDIÇÃO (${(text.length / 1000).toFixed(1)}k chars)`);
  console.log("=".repeat(90));

  console.log("\n--- CABEÇALHO (20 primeiras) ---");
  linhas.slice(0, 20).forEach((l) => console.log(`  ${l}`));

  console.log("\n--- LINHAS COM TOTAL/SUBTOTAL/MEDIÇÃO ---");
  linhas
    .filter((l) => /total|subtotal|medi[çc][aã]o|executad|percentual|acumulad/i.test(l))
    .slice(0, 20)
    .forEach((l) => console.log(`  • ${l}`));

  console.log("\n--- TODAS LINHAS COM R$ (últimas 20) ---");
  linhas
    .filter((l) => /R\$\s?[\d.,]+/i.test(l))
    .slice(-20)
    .forEach((l) => console.log(`  • ${l}`));

  console.log("\n--- ÚLTIMAS 20 LINHAS ---");
  linhas.slice(-20).forEach((l) => console.log(`  ${l}`));
}

main().catch(console.error);
