import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, exercicio, tipo, titulo, arquivo_url, arquivo_nome")
    .in("tipo", ["PPA", "LDO", "LOA"])
    .gte("exercicio", 2018)
    .lte("exercicio", 2022)
    .order("exercicio", { ascending: true });

  if (error) {
    console.error("Erro:", error);
    return;
  }

  console.log("=== PPA / LDO / LOA 2018-2022 NO BANCO ===");
  console.table(data);
}

main();
