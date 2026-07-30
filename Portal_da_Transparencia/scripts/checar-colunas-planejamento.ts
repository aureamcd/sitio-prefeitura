import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checar() {
  const { data } = await supabase.schema("transparencia").from("planejamento_documentos").select("*").limit(5);
  if (data && data.length > 0) {
    console.log("=== COLUNAS DA TABELA planejamento_documentos ===");
    console.log(Object.keys(data[0]));
    console.log("\nExemplo de registro:");
    console.log(data[0]);
  }
}
checar();
