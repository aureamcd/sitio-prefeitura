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
    .select("id, titulo, descricao, tipo, categoria, exercicio, ordem, ativo, arquivo_url, arquivo_nome, data_publicacao")
    .in("tipo", ["PPA", "LDO", "LOA"])
    .lte("exercicio", 2025)
    .order("exercicio", { ascending: false });

  if (error) {
    console.log("ERRO:", error.message);
    return;
  }
  console.log(`=== PPA/LDO/LOA anos anteriores (${(data || []).length}) ===`);
  (data || []).forEach((d: any) => {
    console.log(`\n${d.id}`);
    console.log(`  ${d.titulo} | tipo=${d.tipo} | exercicio=${d.exercicio} | ordem=${d.ordem} | ativo=${d.ativo} | publicado=${d.data_publicacao}`);
    console.log(`  url: ${d.arquivo_url}`);
  });
}

main();
