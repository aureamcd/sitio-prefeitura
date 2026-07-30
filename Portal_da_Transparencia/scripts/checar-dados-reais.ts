import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarDados() {
  const tabelas = ["obras", "conselhos", "saude_lista_espera", "atos_normativos", "renuncia_receita", "legislacao"];
  for (const t of tabelas) {
    const { data, error } = await supabase.schema("transparencia").from(t).select("*").limit(2);
    if (error) {
      console.log(`❌ Tabela '${t}': Erro na busca -> ${error.message}`);
    } else {
      console.log(`✅ Tabela '${t}': ${data.length} registros retornados. Exemplo:`, data[0] || "Vazio");
    }
  }
}

checarDados();
