/**
 * READ-ONLY: detalha o padrão EXATO de preenchimento dos RREO 2026 (1º/2º bim)
 * e RGF existentes, para replicar nos novos INSERTs.
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
  // RREO 2026 (todos)
  console.log("=== RREO 2026 (exemplos) ===");
  const { data: rreo } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("*")
    .eq("tipo", "RREO")
    .eq("exercicio", 2026)
    .order("periodo", { ascending: true })
    .order("ordem", { ascending: true })
    .limit(8);
  (rreo || []).forEach((d: any) => {
    console.log(`• ${d.titulo}`);
    console.log(`  periodo=${d.periodo} | ordem=${d.ordem} | categoria=${d.categoria} | subcategoria=${d.subcategoria}`);
    console.log(`  nome=${d.arquivo_nome}`);
    console.log(`  url=${d.arquivo_url}`);
    console.log(`  data_publicacao=${d.data_publicacao} | ativo=${d.ativo}`);
    console.log("");
  });

  // RGF (qualquer)
  console.log("=== RGF (exemplos) ===");
  const { data: rgf } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("*")
    .eq("tipo", "RGF")
    .order("exercicio", { ascending: false })
    .order("ordem", { ascending: true })
    .limit(6);
  (rgf || []).forEach((d: any) => {
    console.log(`• ${d.titulo}`);
    console.log(`  exercicio=${d.exercicio} | periodo=${d.periodo} | ordem=${d.ordem} | categoria=${d.categoria} | subcategoria=${d.subcategoria}`);
    console.log(`  nome=${d.arquivo_nome}`);
    console.log(`  url=${d.arquivo_url}`);
    console.log("");
  });
}

main().catch(console.error);
