import fs from "fs";

function lerMetodologiaTexto() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  let capture = false;
  let count = 0;
  lines.forEach((l, i) => {
    if (l.includes("Fórmula para cálculo do índice") || l.includes("Tabela 2") || l.includes("Tabela 3 - Níveis")) {
      capture = true;
    }
    if (capture && count < 100) {
      console.log(`[${i + 1}] ${l}`);
      count++;
    }
  });
}

lerMetodologiaTexto();
