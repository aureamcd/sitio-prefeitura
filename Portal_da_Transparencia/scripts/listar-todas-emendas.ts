import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function chk() {
  const { data, error } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .select("ano, numero_emenda, parlamentar, valor_previsto, tipo")
    .order("ano", { ascending: false });

  if (error) {
    console.error("Erro:", error.message);
    return;
  }
  console.log("=== TOTAL DE EMENDAS CADASTRADAS:", data?.length);
  console.table(data);
}

chk();
