import fs from "fs";
import path from "path";
const { PDFParse } = require("pdf-parse");

async function analisarPDFs() {
  const folder = "C:\\Users\\Áurea Letícia\\Downloads\\WhatsApp_Emendas_Extracted";
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".pdf"));

  console.log(`=== ANALISANDO ${files.length} ARQUIVOS PDF DE EMENDAS ===\n`);

  for (const f of files) {
    const fullPath = path.join(folder, f);
    try {
      const dataBuffer = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      console.log(`📄 ARQUIVO: ${f}`);
      const lines = (typeof textResult === "string" ? textResult : (textResult.text || JSON.stringify(textResult)))
        .split("\n")
        .map((l: string) => l.trim())
        .filter(Boolean);
      console.log("   -> Primeiras 15 linhas do texto:");
      lines.slice(0, 15).forEach((l: string) => console.log("      |", l));
      console.log("--------------------------------------------------");
    } catch (err: any) {
      console.log(`❌ Erro ao ler ${f}:`, err.message);
    }
  }
}

analisarPDFs();
