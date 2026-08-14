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
  // Manter apenas o registro verdadeiro (1b49bf81). Excluir os 2 duplicados:
  const excluir = [
    "7b2b2739-6383-4050-bb6f-1bf053414d99", // principal duplicado (lei-loa-2026.pdf)
    "6619fe58-7d51-4e49-8cf1-916f92bd5384", // LOA - Lei Orçamentária Anual 2026
  ];

  for (const id of excluir) {
    const { data, error } = await supabase
      .schema("transparencia")
      .from("planejamento_documentos")
      .update({ ativo: false })
      .eq("id", id)
      .select("id, titulo, ativo");
    if (error) {
      console.log("ERRO ao desativar", id, ":", error.message);
    } else {
      console.log("Desativado:", JSON.stringify(data));
    }
  }

  // Confirmar o que resta de LOA ativo para 2026 (ordem 1 apenas)
  const { data, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio, ordem, ativo, arquivo_url")
    .eq("tipo", "LOA")
    .eq("exercicio", 2026)
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) {
    console.log("ERRO ao consultar:", error.message);
  } else {
    console.log("\n=== LOA 2026 ativos restantes ===");
    (data || []).forEach((d: any) => {
      console.log(`${d.id} | ordem=${d.ordem} | ${d.titulo}\n   ${d.arquivo_url}`);
    });
  }
}

main();
