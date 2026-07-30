import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarErros() {
  const tabelas = ["obras", "conselhos", "saude_lista_espera", "atos_normativos", "renuncia_receita", "legislacao"];
  for (const t of tabelas) {
    const { count, error } = await supabase.schema("transparencia").from(t).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`❌ Tabela '${t}': Erro -> ${error.message}`);
    } else {
      console.log(`✅ Tabela '${t}': ${count} registros`);
    }
  }
}

checarErros();
