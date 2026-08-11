/**
 * Lê os cadastroObra PDFs (360977 e 360981) e extrai link do TCE / nº processo.
 */
import fs from "fs";
import pdf from "pdf-parse";

const BASE = "C:/Users/Áurea Letícia/Downloads/atualizar obras";

const FILES = [
  "360977/cadastroObra_360977 (1).pdf",
  "360981/cadastroObra_360981.pdf",
];

async function main() {
  for (const rel of FILES) {
    const f = `${BASE}/${rel}`;
    if (!fs.existsSync(f)) {
      console.log("Nao existe:", rel);
      continue;
    }
    const buf = fs.readFileSync(f);
    const data = await pdf(buf);
    const text = data.text || "";
    const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);

    console.log("=".repeat(90));
    console.log(`📄 ${rel} (${(text.length / 1000).toFixed(1)}k chars)`);
    console.log("=".repeat(90));

    console.log("\n--- URLs / LINKS ---");
    const urls = text.match(/https?:\/\/[^\s"<>]+/g) || [];
    [...new Set(urls)].slice(0, 10).forEach((u) => console.log(`  • ${u}`));

    console.log("\n--- LINHAS COM TCE / PROCESSO ---");
    linhas
      .filter((l) => /tce|processo|protocolo|n[º°]\s?\d+/i.test(l))
      .slice(0, 15)
      .forEach((l) => console.log(`  • ${l}`));

    console.log("\n--- CABEÇALHO (20) ---");
    linhas.slice(0, 20).forEach((l) => console.log(`  ${l}`));
    console.log("\n");
  }
}

main().catch(console.error);
