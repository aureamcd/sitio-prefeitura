import fs from "fs";
import path from "path";

const downloads = "C:\\Users\\Áurea Letícia\\Downloads";
const itens = fs.readdirSync(downloads);
for (const item of itens) {
  if (item.startsWith("LICITAÇOES-20260701")) {
    const full = path.join(downloads, item);
    const isDir = fs.statSync(full).isDirectory();
    console.log(`[${isDir ? "PASTA" : "ZIP/ARQUIVO"}] ${item}`);
  }
}
