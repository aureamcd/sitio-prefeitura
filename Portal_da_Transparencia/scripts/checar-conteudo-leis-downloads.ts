import fs from "fs";
import path from "path";

const downloads = "C:\\Users\\Áurea Letícia\\Downloads";

function checarPastaLeis() {
  const pastaLeis = path.join(downloads, "LEIS");
  if (fs.existsSync(pastaLeis)) {
    const itens = fs.readdirSync(pastaLeis);
    console.log(`=== CONTEÚDO DA PASTA DOWNLOADS/LEIS (${itens.length} itens) ===`);
    itens.slice(0, 30).forEach(i => console.log(`- ${i}`));
  } else {
    console.log("Pasta DOWNLOADS/LEIS não encontrada.");
  }

  const zipsLeis = fs.readdirSync(downloads).filter(f => f.startsWith("LEIS-") && f.endsWith(".zip")).sort();
  console.log(`\n=== ARQUIVOS ZIP DE LEIS (${zipsLeis.length}) ===`);
  zipsLeis.forEach(z => {
    const stat = fs.statSync(path.join(downloads, z));
    console.log(`📦 ${z}: ${(stat.size / 1_000_000).toFixed(1)} MB`);
  });
}

checarPastaLeis();
