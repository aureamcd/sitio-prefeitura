/**
 * Lê a seção 10 (Obras) da cartilha PNTP 2026 (arquivo em latin1).
 */
import fs from "fs";

const FILE = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/cartilha_temp.txt";

function main() {
  const buf = fs.readFileSync(FILE);
  const text = buf.toString("latin1");
  const lines = text.split(/\r?\n/);

  console.log("Total de linhas:", lines.length);

  // Encontra linhas com "10.1 Divulga"
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("10.1") && lines[i].includes("Divulga")) {
      console.log("--- ENCONTRADO na linha", i, "---");
      // Imprime da linha i até achar "11." ou fim
      for (let j = i; j < Math.min(i + 25, lines.length); j++) {
        const line = lines[j];
        if (line.includes("10.1") && j > i) break;
        if (line.trim().length > 0) console.log(line.trim());
        if (j > i && /^\s*(11\.|Dimens[ãa]o 11)/.test(line)) break;
      }
      break;
    }
  }

  // Também busca padrão alternativo: linhas com "10.2", "10.3", "10.4"
  console.log("\n\n--- TODAS AS LINHAS COM CRITÉRIO 10.x ---");
  for (const line of lines) {
    const t = line.trim();
    if (/^10\.\d/.test(t) || /10\.\d\s/.test(t)) {
      console.log("•", t.substring(0, 400));
    }
  }
}

main();
