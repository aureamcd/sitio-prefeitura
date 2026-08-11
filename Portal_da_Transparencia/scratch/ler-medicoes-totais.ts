/**
 * Extrai os totais das medições (escola 1/2/3 e cândida 1).
 */
import fs from "fs";
import pdf from "pdf-parse";

const BASE = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch_tarjados_local/medicoes";

const FILES = [
  { file: "escola-m1.pdf", nome: "ESCOLA CANTO ALEGRE - 1ª MEDIÇÃO" },
  { file: "escola-m2.pdf", nome: "ESCOLA CANTO ALEGRE - 2ª MEDIÇÃO" },
  { file: "escola-m3.pdf", nome: "ESCOLA CANTO ALEGRE - 3ª MEDIÇÃO (FINAL)" },
  { file: "candida-m1.pdf", nome: "U.E. CÂNDIDA MACÊDO - 1ª MEDIÇÃO" },
];

async function main() {
  for (const { file, nome } of FILES) {
    const f = `${BASE}/${file}`;
    const buf = fs.readFileSync(f);
    const data = await pdf(buf);
    const text = data.text || "";
    const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);

    console.log("=".repeat(90));
    console.log(`📄 ${nome} (${file}, ${(text.length / 1000).toFixed(1)}k chars)`);
    console.log("=".repeat(90));

    console.log("\n--- CABEÇALHO (15 primeiras) ---");
    linhas.slice(0, 15).forEach((l) => console.log(`  ${l}`));

    console.log("\n--- LINHAS COM TOTAL/SUBTOTAL ---");
    linhas
      .filter((l) => /total|subtotal|soma|acumulad|saldo|a\s?medir/i.test(l))
      .slice(0, 15)
      .forEach((l) => console.log(`  • ${l}`));

    console.log("\n--- ÚLTIMAS 25 LINHAS ---");
    linhas.slice(-25).forEach((l) => console.log(`  ${l}`));
    console.log("\n");
  }
}

main().catch(console.error);
