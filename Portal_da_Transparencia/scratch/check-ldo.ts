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
  const { data, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, descricao, tipo, exercicio, ordem, ativo, arquivo_url, data_publicacao")
    .eq("tipo", "LDO")
    .eq("exercicio", 2026)
    .order("ordem", { ascending: true })
    .order("data_publicacao", { ascending: false });

  if (error) {
    console.log("ERRO:", error.message);
    return;
  }
  console.log(`=== LDO 2026 (${(data || []).length}) ===`);
  (data || []).forEach((d: any, i: number) => {
    console.log(`\n[${i + 1}] id: ${d.id}`);
    console.log(`    titulo: ${d.titulo}`);
    console.log(`    descricao: ${d.descricao || ''}`);
    console.log(`    ordem: ${d.ordem} | ativo: ${d.ativo} | publicado: ${d.data_publicacao}`);
    console.log(`    url: ${d.arquivo_url}`);
  });
}

main();
