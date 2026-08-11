/**
 * Lê o PDF da medição da creche (baixado em /tmp/medicoes) e extrai o valor.
 */
import fs from "fs";
import pdf from "pdf-parse";

async function main() {
  const files = [
    "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch_tarjados_local/medicoes/creche-1a.pdf",
  ];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.log("Nao existe:", f);
      continue;
    }
    const buf = fs.readFileSync(f);
    const data = await pdf(buf);
    const text = data.text || "";
    console.log("=".repeat(80));
    console.log("📄", f, `(${(text.length / 1000).toFixed(1)}k chars)`);
    console.log("=".repeat(80));

    const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);
    // Primeiras 30 linhas (cabeçalho)
    console.log("--- CABEÇALHO ---");
    linhas.slice(0, 30).forEach((l) => console.log(`  ${l}`));

    // Linhas com R$ ou TOTAL
    console.log("\n--- VALORES / TOTAL ---");
    const vals = linhas.filter((l) => /R\$\s?[\d.,]+/i.test(l) || /total/i.test(l));
    vals.slice(0, 25).forEach((l) => console.log(`  • ${l}`));
    console.log("\n");
  }
}

main().catch(console.error);
