import fs from "fs";
import path from "path";

const downloads = "C:\\Users\\Áurea Letícia\\Downloads";

function checarZips() {
  const zips = fs.readdirSync(downloads).filter(f => f.startsWith("LICITAÇOES-20260701") && f.endsWith(".zip")).sort();
  console.log(`=== ENCONTRADOS ${zips.length} ARQUIVOS ZIP DA REMESSA DE HOJE ===`);
  for (const zip of zips) {
    const stat = fs.statSync(path.join(downloads, zip));
    console.log(`📦 ${zip}: ${(stat.size / 1_000_000).toFixed(1)} MB`);
  }
}

checarZips();
