import fs from "fs";

const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
const lines = content.split(/\r?\n/);

console.log("=== CRITÉRIOS DA DIMENSÃO 11 NA CARTILHA PNTP ===");
lines.forEach((line, idx) => {
  if (/11\.\d+/.test(line)) {
    console.log(`[Linha ${idx+1}] ${line.trim()}`);
  }
});
