import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
async function main() {
  // Relatorios de Gestao - todos os registros
  const { data, error } = await supabase.schema("transparencia").from("planejamento_documentos").select("*").eq("tipo", "RELATORIO_GESTAO");
  if (error) { console.log("ERRO:", error.message); return; }
  console.log("=== TODOS OS RELATORIOS DE GESTAO (" + (data || []).length + ") ===");
  for (const d of data || []) {
    console.log("---");
    console.log("id:", d.id);
    console.log("titulo:", d.titulo);
    console.log("descricao:", d.descricao || "(vazio)");
    console.log("categoria:", d.categoria, "| tipo:", d.tipo, "| exercicio:", d.exercicio);
    console.log("arquivo_url:", d.arquivo_url);
    console.log("arquivo_nome:", d.arquivo_nome || "(vazio)");
    console.log("ativo:", d.ativo, "| ordem:", d.ordem, "| data_publicacao:", d.data_publicacao || "(vazio)");
  }
}
main();
