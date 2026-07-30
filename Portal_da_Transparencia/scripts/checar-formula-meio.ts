import fs from "fs";

function checkMeio() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  console.log("=== LINHAS 200 a 800 DA CARTILHA ===");
  lines.slice(200, 800).forEach((l, i) => {
    if (/selo|prata|ouro|diamante|metodologia|pesos|fórmula|cálculo|essencial|obrigatório|recomendado|atende|nível de transparência/i.test(l)) {
      console.log(`[Linha ${i + 201}] ${l.trim()}`);
    }
  });
}

checkMeio();
