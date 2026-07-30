import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const downloads = "C:\\Users\\Áurea Letícia\\Downloads";

function inspecionar() {
  const pastaFaltam = path.join(downloads, "LEIS", "LEIS QUE AINDA FALTAM");
  if (fs.existsSync(pastaFaltam)) {
    const itens = fs.readdirSync(pastaFaltam);
    console.log(`=== ITENS EM 'LEIS QUE AINDA FALTAM' (${itens.length} itens) ===`);
    itens.slice(0, 30).forEach(i => console.log(`- ${i}`));
  }

  const zipLeis = path.join(downloads, "LEIS-20260702T203700Z-3-001.zip");
  if (fs.existsSync(zipLeis)) {
    console.log(`\n=== PRIMEIROS 20 ARQUIVOS NO ZIP LEIS-20260702T203700Z-3-001.zip ===`);
    try {
      const cmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zipLeis}').Entries | Select-Object -First 20 FullName | Format-Table -AutoSize"`;
      console.log(execSync(cmd, { encoding: "utf-8" }));
    } catch (e: any) {
      console.error("Erro no zip:", e.message);
    }
  }
}

inspecionar();
