import fs from "fs";
import path from "path";

const downloadsPath = "C:\\Users\\Áurea Letícia\\Downloads";

function listarItens() {
  if (!fs.existsSync(downloadsPath)) {
    console.log("Pasta Downloads não encontrada.");
    return;
  }
  const itens = fs.readdirSync(downloadsPath);
  console.log("=== ITENS RELACIONADOS A LICITAÇÕES EM DOWNLOADS ===");
  for (const item of itens) {
    const limpo = item.toLowerCase();
    if (
      limpo.includes("licita") ||
      limpo.includes("concorrencia") ||
      limpo.includes("pregao") ||
      limpo.includes("dispensa") ||
      limpo.includes("inexigibilidade") ||
      limpo.includes("edital")
    ) {
      const fullPath = path.join(downloadsPath, item);
      const stat = fs.statSync(fullPath);
      const tamanhoMB = (stat.size / 1_000_000).toFixed(1);
      console.log(`[${stat.isDirectory() ? "DIR" : "FILE"}] ${item} (${tamanhoMB} MB)`);
    }
  }
}

listarItens();
