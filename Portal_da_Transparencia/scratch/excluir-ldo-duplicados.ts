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
  // Manter apenas o registro funcional (d5817419, link 200). Excluir os 2 duplicados:
  const excluir = [
    "a37cf267-3653-4683-9548-91b4ad8dba27", // principal com link 404
    "5c8d3296-9fb3-4116-b48c-e281655e3781", // LDO - Lei de Diretrizes Orçamentárias 2026
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

  // Confirmar o que resta de LDO ativo para 2026
  const { data, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio, ordem, ativo, arquivo_url")
    .eq("tipo", "LDO")
    .eq("exercicio", 2026)
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) {
    console.log("ERRO ao consultar:", error.message);
  } else {
    console.log("\n=== LDO 2026 ativos restantes ===");
    (data || []).forEach((d: any) => {
      console.log(`${d.id} | ordem=${d.ordem} | ${d.titulo}\n   ${d.arquivo_url}`);
    });
  }
}

main();
