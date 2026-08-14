import { readFile } from "fs/promises";
import { PDFParse } from "./pdf-helper";

// Fallback: try pdf-parse if available
async function main() {
  const p = "C:/Users/Áurea Letícia/Downloads/PLANO MUNICIPAL DE EDUCAÇÃO COM FOCO NA EDUCAÇÃO INFANTIL - PADRE MARCOS-PI.pdf";
  try {
    const mod = await import("pdf-parse");
    const data = await readFile(p);
    const result = await (mod.default || mod)(data as any);
    const text = result.text || "";
    // Find period references
    const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const periodMatches = lines.filter((l: string) =>
      /202[0-9].*203[0-9]|203[0-9].*202[0-9]|20\d\d\s*[-–]\s*20\d\d|VIGÊNCIA|vigência|DECÊNIO|decênio|PLANO MUNICIPAL/i.test(l)
    ).slice(0, 30);
    console.log("=== Linhas com período/decênio ===");
    periodMatches.forEach((l: string) => console.log("•", l));
    // First 40 lines
    console.log("\n=== Início do documento ===");
    lines.slice(0, 40).forEach((l: string) => console.log(l));
  } catch (e: any) {
    console.log("ERRO:", e.message);
  }
}

main();
