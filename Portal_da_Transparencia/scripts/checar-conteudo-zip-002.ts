import { execSync } from "child_process";

const zipPath = "C:\\Users\\Áurea Letícia\\Downloads\\LICITAÇOES-20260701T170631Z-3-002.zip";

try {
  console.log("=== INSPECIONANDO CONTEÚDO DO ZIP 002 ===");
  // Listar os 20 primeiros arquivos do zip usando powershell
  const cmd = `powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${zipPath}').Entries | Select-Object -First 25 FullName, Length | Format-Table -AutoSize"`;
  const saida = execSync(cmd, { encoding: "utf-8" });
  console.log(saida);
} catch (e: any) {
  console.error("Erro:", e.message);
}
