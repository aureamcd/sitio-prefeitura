import fs from "fs";

function lerPags39a42() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  lines.forEach((l, i) => {
    if (i > 800 && (l.includes("METODOLOGIA") || l.includes("Fórmula para cálculo") || l.includes("Pesos atribuídos") || l.includes("Níveis de Transparência"))) {
      console.log(`=== ENCONTRADO NA LINHA ${i + 1} ===`);
      for (let j = i; j < i + 60 && j < lines.length; j++) {
        console.log(`[${j + 1}] ${lines[j]}`);
      }
    }
  });
}

lerPags39a42();
