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
  const { data, error } = await supabase.schema("transparencia").from("planejamento_documentos").select("id, titulo, descricao, exercicio, ordem, ativo, arquivo_url, arquivo_nome, data_publicacao").eq("tipo", "LDO").eq("exercicio", 2025);
  if (error) { console.log("ERRO:", error.message); return; }
  (data || []).forEach((d: any) => {
    console.log(`${d.id} | ativo=${d.ativo} | ordem=${d.ordem} | ${d.titulo}`);
    console.log(`   url: ${d.arquivo_url}`);
    console.log(`   nome: ${d.arquivo_nome} | publicado: ${d.data_publicacao}`);
  });
}
main();
