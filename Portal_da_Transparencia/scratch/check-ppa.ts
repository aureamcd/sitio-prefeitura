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
    .order("ordem", { ascending: true });

  if (error) {
    console.log("ERRO:", error.message);
    return;
  }
  const ppa = (data || []).filter(d => String(d.tipo || "").startsWith("PPA"));
  console.log(`\n=== REGISTROS PPA (${ppa.length}) ===`);
  ppa.forEach((d: any) => {
    console.log(`\nid: ${d.id}`);
    console.log(`titulo: ${d.titulo}`);
    console.log(`tipo: ${d.tipo} | categoria: ${d.categoria} | exercicio: ${d.exercicio} | ordem: ${d.ordem} | ativo: ${d.ativo}`);
    console.log(`arquivo_url: ${d.arquivo_url}`);
  });
  console.log(`\n=== TODOS OS REGISTROS (${(data || []).length}) ===`);
  (data || []).forEach((d: any) => {
    console.log(`${d.id} | tipo=${d.tipo} | ordem=${d.ordem} | ativo=${d.ativo} | exercicio=${d.exercicio} | ${d.titulo}`);
  });
}

main();
