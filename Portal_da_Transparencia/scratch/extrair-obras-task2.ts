/**
 * Extrai texto dos PDFs da pasta "atualizar obras" para identificar:
 * prestador (empresa responsável), valores, contratos, datas, objeto.
 * Somente leitura — não altera nada.
 */
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const BASE = "C:/Users/Áurea Letícia/Downloads/atualizar obras";

function listPdfs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listPdfs(full));
    else if (entry.name.toLowerCase().endsWith(".pdf")) out.push(full);
  }
  return out;
}

async function extractText(filePath: string): Promise<string> {
  const buf = fs.readFileSync(filePath);
  try {
    const data = await pdf(buf);
    return data.text || "";
  } catch (e: any) {
    return `[ERRO AO LER PDF: ${e.message}]`;
  }
}

async function main() {
  const pdfs = listPdfs(BASE);
  console.log(`Encontrados ${pdfs.length} PDFs:\n`);

  for (const file of pdfs) {
    const rel = path.relative(BASE, file);
    const text = await extractText(file);
    console.log("=".repeat(80));
    console.log(`📄 ${rel} (${(text.length / 1000).toFixed(1)}k chars)`);
    console.log("=".repeat(80));

    // Palavras-chave relevantes para identificar prestador, valor e contrato
    const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const alvos: string[] = [];
    for (const linha of linhas) {
      const l = linha.toLowerCase();
      if (
        l.includes("contratad") ||
        l.includes("prestador") ||
        l.includes("empresa") ||
        l.includes("cnpj") ||
        l.includes("valor do contrato") ||
        l.includes("valor global") ||
        l.includes("valor total") ||
        l.includes("razão social") ||
        l.includes("razao social") ||
        l.includes("representante legal")
      ) {
        alvos.push(linha);
      }
    }

    // Mostra as 15 primeiras linhas e as linhas-chave
    console.log("--- PRIMEIRAS LINHAS ---");
    linhas.slice(0, 15).forEach((l) => console.log(`  ${l}`));
    console.log("--- LINHAS-CHAVE (contratada/valor/cnpj) ---");
    alvos.slice(0, 20).forEach((l) => console.log(`  • ${l}`));
    console.log("");
  }
}

main().catch(console.error);
