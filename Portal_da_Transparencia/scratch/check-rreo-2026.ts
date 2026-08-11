/**
 * READ-ONLY: quantos RREO 2026 por bimestre, e RGF 2026 existentes.
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // RREO 2026
  const { data: rreo, count } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, ordem, exercicio")
    .eq("tipo", "RREO")
    .eq("exercicio", 2026);
  console.log(`RREO 2026 no banco: ${count}`);
  const bimestres = new Set<string>();
  (rreo || []).forEach((d: any) => {
    const m = String(d.titulo || "").match(/(\d+)[º°]?\s?Bimestre\s\(([^)]+)\)/i);
    if (m) bimestres.add(`${m[1]}º (${m[2]})`);
  });
  console.log("Bimestres presentes:", bimestres.size ? [...bimestres].join(" | ") : "nenhum");

  // Títulos RREO 2026 agrupados por "Anexo X"
  const anexos = new Map<string, string>();
  (rreo || []).forEach((d: any) => {
    const m = String(d.titulo || "").match(/Anexo (\d+): ([^—]+)—/);
    if (m) anexos.set(m[1].padStart(2, "0"), `${m[1]} - ${m[2].trim()}`);
  });
  console.log("\nAnexos já cadastrados (todos bimestres):");
  [...anexos.entries()].sort().forEach(([k, v]) => console.log(`  ${v}`));

  // RGF 2026
  const { data: rgf } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, exercicio, periodo, ordem")
    .eq("tipo", "RGF");
  const rgf2026 = (rgf || []).filter((d: any) => d.exercicio === 2026);
  console.log(`\nRGF total: ${rgf?.length || 0} | RGF 2026: ${rgf2026.length}`);
  rgf2026.forEach((d: any) => console.log(`  • ${d.titulo} (ordem ${d.ordem})`));

  // Anos disponíveis
  const anos = new Set((rgf || []).map((d: any) => d.exercicio));
  console.log("\nAnos com RGF:", [...anos].sort());
}

main().catch(console.error);
