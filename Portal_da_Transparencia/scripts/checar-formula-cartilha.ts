import fs from "fs";

function checarFormula() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  console.log("=== TRECHOS DA CARTILHA SOBRE CÁLCULO / ÍNDICE ===");
  lines.forEach((l, i) => {
    if (/cálculo|pontuação|essencial|eliminat|peso|fórmula|nota|índice de transparência/i.test(l)) {
      console.log(`[Linha ${i + 1}] ${l.trim()}`);
    }
  });
}

checarFormula();
