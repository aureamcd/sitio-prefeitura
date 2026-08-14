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
  // Manter apenas o registro correto (4917dcf3). Excluir os 2 duplicados:
  const excluir = [
    "cab495ee-5bef-4bd6-9b7b-fec0fbf2d283", // Plano Plurianual (PPA) 2026–2029 (principal duplicado)
    "630e1715-58d0-44ac-9156-0631a093540c", // Plano Plurianual (PPA) 2026–2029 (anexo duplicado)
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

  // Confirmar o que resta de PPA ativo para 2026
  const { data, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio, ordem, ativo")
    .eq("tipo", "PPA")
    .eq("exercicio", 2026)
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) {
    console.log("ERRO ao consultar:", error.message);
  } else {
    console.log("\n=== PPA 2026 ativos restantes ===");
    (data || []).forEach((d: any) => {
      console.log(`${d.id} | ordem=${d.ordem} | ${d.titulo}`);
    });
  }
}

main();
