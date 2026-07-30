import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  // Despesas 2026 onde data_empenho não é nulo
  const { data: d2026 } = await supabase
    .schema("transparencia")
    .from("despesas")
    .select("data_empenho, created_at, ano")
    .eq("ano", 2026)
    .not("data_empenho", "is", null)
    .order("data_empenho", { ascending: false })
    .limit(10);

  // Despesas 2026 ord por created_at
  const { data: dCreated } = await supabase
    .schema("transparencia")
    .from("despesas")
    .select("data_empenho, created_at, ano")
    .eq("ano", 2026)
    .order("created_at", { ascending: false })
    .limit(5);

  // Receitas 2026 ord por created_at
  const { data: rCreated } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("ano, created_at, descricao")
    .eq("ano", 2026)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("=== DESPESAS 2026 (Maiores datas de empenho) ===");
  d2026?.forEach(x => console.log(`   - Data Empenho: ${x.data_empenho} | Atualizado no banco em: ${x.created_at}`));

  console.log("\n=== DESPESAS 2026 (Últimas inserções no banco) ===");
  dCreated?.forEach(x => console.log(`   - Data Empenho: ${x.data_empenho} | Atualizado no banco em: ${x.created_at}`));

  console.log("\n=== RECEITAS 2026 (Últimas inserções no banco) ===");
  rCreated?.forEach(x => console.log(`   - Ano: ${x.ano} | Descrição: ${x.descricao} | Atualizado em: ${x.created_at}`));
}

check();
