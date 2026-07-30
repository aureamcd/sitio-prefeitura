import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checar2023() {
  const { data } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("titulo, arquivo_nome, exercicio, tipo")
    .eq("tipo", "BALANCO_GERAL")
    .eq("exercicio", 2023);

  console.log(`=== BALANÇOS DE 2023 CADASTRADOS NO BANCO (${data?.length || 0}) ===`);
  data?.forEach(d => console.log(`- ${d.titulo} (${d.arquivo_nome})`));
}
checar2023();
