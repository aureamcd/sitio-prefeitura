import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkEmendasTable() {
  const { data, count, error } = await supabase.schema("transparencia").from("emendas").select("*", { count: "exact" }).limit(3);
  if (error) {
    console.log("❌ Erro na tabela emendas:", error.message);
  } else {
    console.log(`✅ Tabela 'transparencia.emendas': ${count} registros.`);
    if (data && data.length > 0) {
      console.log("Exemplo:", JSON.stringify(data[0], null, 2));
    }
  }
}

checkEmendasTable();
