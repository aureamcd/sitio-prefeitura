import fs from "fs";

const logPath = "C:\\Users\\Áurea Letícia\\.gemini\\antigravity\\brain\\985bf294-df79-490a-a2d6-5bf757c97f15\\.system_generated\\tasks\\task-1814.log";
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, "utf-8");
  const lines = content.split("\n").filter(l => l.includes("PROCESSANDO ZIP") || l.includes("Resumo LICITAÇOES"));
  console.log("=== ANDAMENTO DOS ZIPS NO TASK-1814 ===");
  console.log(lines.join("\n"));
}
