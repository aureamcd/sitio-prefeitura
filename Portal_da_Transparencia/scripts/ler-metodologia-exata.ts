import fs from "fs";

function lerMetodologia() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  console.log("=== METODOLOGIA EXATA (LINHAS 570 a 730) ===");
  lines.slice(569, 730).forEach((l, i) => {
    console.log(`[${i + 570}] ${l}`);
  });
}

lerMetodologia();
