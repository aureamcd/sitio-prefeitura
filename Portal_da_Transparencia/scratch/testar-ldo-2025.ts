import fs from "fs";
import pdf from "pdf-parse";

async function main() {
  const buf = fs.readFileSync("/tmp/ldo2025.pdf");
  const data = await pdf(buf);
  console.log(`Páginas: ${data.numpages}`);
  console.log(`Texto extraído: ${(data.text || "").length} chars`);
  const t = (data.text || "").replace(/\s+/g, " ").slice(0, 400);
  console.log(`Início: ${t}`);
}

main();
