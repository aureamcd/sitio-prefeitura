/**
 * Extrai trechos detalhados dos PDFs-chave para confirmar:
 * valor do contrato/aditivo, objeto, número do processo TCE, datas.
 */
import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const BASE = "C:/Users/Áurea Letícia/Downloads/atualizar obras";

const ARQUIVOS = [
  "349659/02 Termo Aditivo Creche_assinado.pdf",
  "360977/01 Termo Aditivo_assinado.pdf",
  "360977/08 Contrato Construção de Escola Canto Alegre_assinado.pdf",
  "360981/029_Primeiro_Termo_Aditivo_assinado.pdf",
];

async function main() {
  for (const rel of ARQUIVOS) {
    const filePath = path.join(BASE, rel);
    const buf = fs.readFileSync(filePath);
    let text = "";
    try {
      const data = await pdf(buf);
      text = data.text || "";
    } catch (e: any) {
      console.log(`❌ ${rel}: erro ${e.message}`);
      continue;
    }

    console.log("=".repeat(90));
    console.log(`📄 ${rel} (${(text.length / 1000).toFixed(1)}k chars)`);
    console.log("=".repeat(90));

    const linhas = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // Busca linhas com valor em R$
    console.log("\n--- VALORES (R$) ---");
    const valores = linhas.filter((l) => /R\$\s?[\d.,]+/i.test(l) || /[\d.,]{4,}\s*,\s*\d{2}/.test(l));
    valores.slice(0, 12).forEach((l) => console.log(`  • ${l}`));

    // Busca referências a processo/contrato/aditivo
    console.log("\n--- CONTRATO / PROCESSO / ADITIVO ---");
    const refs = linhas.filter((l) => {
      const x = l.toLowerCase();
      return x.includes("contrato nº") || x.includes("contrato n.") || x.includes("processo") ||
        x.includes("aditivo") || x.includes("concorrência") || x.includes("concorrencia") ||
        x.includes("primeiro") || x.includes("termo");
    });
    refs.slice(0, 15).forEach((l) => console.log(`  • ${l}`));

    // Datas relevantes
    console.log("\n--- DATAS ---");
    const datas = linhas.filter((l) => /\d{2}\/\d{2}\/\d{4}/.test(l));
    datas.slice(0, 10).forEach((l) => console.log(`  • ${l}`));

    console.log("\n--- OBJETO (busca 'objeto') ---");
    const objIdx = linhas.findIndex((l) => l.toLowerCase().includes("cláusula primeira") || l.toLowerCase().includes("do objeto") || l.toLowerCase().includes("o presente contrato"));
    if (objIdx >= 0) {
      linhas.slice(objIdx, objIdx + 8).forEach((l) => console.log(`  • ${l}`));
    } else {
      console.log("  (não encontrado padrão de objeto)");
    }
    console.log("\n");
  }
}

main().catch(console.error);
