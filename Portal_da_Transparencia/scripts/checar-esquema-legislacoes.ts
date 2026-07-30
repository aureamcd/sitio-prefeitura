import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarEsquema() {
  const { data, error } = await supabase.from("legislacoes").select("*").limit(3);
  if (error) {
    console.error("Erro:", error.message);
    return;
  }
  if (data && data.length > 0) {
    console.log("=== EXEMPLO DE REGISTRO EM legislacoes ===");
    console.log(data[0]);
  }
}

checarEsquema();
