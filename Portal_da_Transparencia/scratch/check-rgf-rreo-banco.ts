/**
 * READ-ONLY: verifica registros RGF/RREO existentes em planejamento_documentos
 * para entender o padrão de preenchimento e o que já existe para 2026.
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
  // 1. Total RGF/RREO
  const { count } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("*", { count: "exact", head: true })
    .in("tipo", ["RGF", "RREO"]);
  console.log(`Total RGF/RREO no banco: ${count}\n`);

  // 2. Todos RGF/RREO (ordenado)
  const { data, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("*")
    .in("tipo", ["RGF", "RREO"])
    .order("exercicio", { ascending: false })
    .order("ordem", { ascending: true });

  if (error) {
    console.log("Erro:", error.message);
    return;
  }

  console.log("=== REGISTROS RGF/RREO ===");
  (data || []).forEach((d: any) => {
    console.log(`• [${d.tipo}] ${d.titulo}`);
    console.log(`  exercicio: ${d.exercicio} | periodo: ${d.periodo || "-"} | ordem: ${d.ordem} | categoria: ${d.categoria} | sub: ${d.subcategoria || "-"}`);
    console.log(`  arquivo_nome: ${d.arquivo_nome}`);
    console.log(`  arquivo_url: ${d.arquivo_url}`);
    console.log("");
  });
}

main().catch(console.error);
