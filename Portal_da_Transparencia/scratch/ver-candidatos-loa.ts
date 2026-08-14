/**
 * Inspeciona os textos salvos das leis candidatas a LOA 2023.
 */
import fs from "fs";
import path from "path";

const DIR = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch/leis2022";

async function main() {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith(".txt"));
  for (const f of files) {
    const txt = fs.readFileSync(path.join(DIR, f), "latin1");
    // Procura o título da lei (primeiras linhas com "LEI Nº" ou "Ementa")
    const m = txt.match(/(LEI\s+N[ºo]?\.?\s*\d+\s*[^\n]{0,120})/i);
    const titulo = m ? m[1].replace(/\s+/g, " ").trim() : "(sem título encontrado)";
    // Verifica se é especificamente LOA
    const isLOA = /(lei\s+or[çc]ament[aá]ria\s+anual|estima\s+a\s+receita|fixa\s+a\s+despesa|or[çc]amento\s+anual)/i.test(txt);
    console.log(`\n--- ${f} ---`);
    console.log(`Título: ${titulo.slice(0, 150)}`);
    console.log(`É LOA: ${isLOA ? "✅ SIM" : "❌ não"}`);
  }
}

main();
