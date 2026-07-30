import fs from "fs";
import path from "path";

const downloads = "C:\\Users\\Áurea Letícia\\Downloads";
const pastasAlvo = [
  "concorrencia",
  "dispensa",
  "inexigibilidade",
  "pregao",
  "chamada publica",
  "carta convite",
  "leilao",
  "LICITAÇÕES 2025-2026 - CONTREINA",
];

function contarArquivos(dir: string): { total: number; pdfs: number } {
  let total = 0;
  let pdfs = 0;
  if (!fs.existsSync(dir)) return { total, pdfs };
  const itens = fs.readdirSync(dir);
  for (const item of itens) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const sub = contarArquivos(full);
      total += sub.total;
      pdfs += sub.pdfs;
    } else {
      total++;
      if (item.toLowerCase().endsWith(".pdf")) pdfs++;
    }
  }
  return { total, pdfs };
}

console.log("=== ANÁLISE DAS PASTAS DE LICITAÇÕES EM DOWNLOADS ===");
for (const pasta of pastasAlvo) {
  const caminho = path.join(downloads, pasta);
  if (fs.existsSync(caminho)) {
    const contagem = contarArquivos(caminho);
    console.log(`📁 ${pasta}: ${contagem.total} arquivos total (${contagem.pdfs} PDFs)`);
  } else {
    console.log(`❌ ${pasta}: Pasta não encontrada no formato exato.`);
  }
}
