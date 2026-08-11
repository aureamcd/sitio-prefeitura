/**
 * Extrai o TOTAL geral da medição (últimas linhas do boletim).
 */
import fs from "fs";
import pdf from "pdf-parse";

async function main() {
  const f = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch_tarjados_local/medicoes/creche-1a.pdf";
  const buf = fs.readFileSync(f);
  const data = await pdf(buf);
  const text = data.text || "";
  const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);

  console.log("--- ÚLTIMAS 60 LINHAS ---");
  linhas.slice(-60).forEach((l) => console.log(`  ${l}`));

  console.log("\n--- LINHAS COM TOTAL ---");
  linhas
    .filter((l) => /total|soma|subtotal|acumulad/i.test(l))
    .slice(0, 20)
    .forEach((l) => console.log(`  • ${l}`));

  console.log("\n--- TODAS OCORRÊNCIAS DE R$ ---");
  linhas
    .filter((l) => /R\$\s?[\d.,]+/i.test(l))
    .slice(-30)
    .forEach((l) => console.log(`  • ${l}`));
}

main().catch(console.error);
