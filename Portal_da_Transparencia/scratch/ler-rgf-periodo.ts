/**
 * Lê o cabeçalho dos RGF 2026 para confirmar período/quadrimestre.
 */
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const DIR = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch_tarjados_local/rgf2026";

async function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.toLowerCase().endsWith(".pdf"));
  for (const file of files.slice(0, 3)) {
    const buf = fs.readFileSync(path.join(DIR, file));
    const data = await pdf(buf);
    const text = (data.text || "").replace(/\s+/g, " ").trim();
    console.log("=".repeat(80));
    console.log(`📄 ${file}`);
    console.log("=".repeat(80));
    console.log(text.substring(0, 700));
    console.log("\n");
  }
}

main().catch(console.error);
