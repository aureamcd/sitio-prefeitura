import fs from "fs";

function ler46() {
  const content = fs.readFileSync("C:\\Users\\Áurea Letícia\\Documents\\sitio-prefeitura\\cartilha_temp.txt", "latin1");
  const lines = content.split(/\r?\n/);
  
  lines.slice(2230, 2300).forEach((l, i) => {
    console.log(`[${i + 2231}] ${l}`);
  });
}

ler46();
