import fs from "fs";

function checkInicio() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  console.log("=== LINHAS 1 a 200 DA CARTILHA ===");
  lines.slice(0, 200).forEach((l, i) => {
    if (/selo|prata|ouro|diamante|metodologia|pesos|fórmula|cálculo|essencial|obrigatório/i.test(l)) {
      console.log(`[Linha ${i + 1}] ${l.trim()}`);
    }
  });
}

checkInicio();
