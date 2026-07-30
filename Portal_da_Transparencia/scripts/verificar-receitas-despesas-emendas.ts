import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function verificarTodosAnos() {
  // 1. Receitas com 'EMENDA' em qualquer coluna
  const { data: recs } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("ano, descricao, arrecadado_periodo, created_at")
    .ilike("descricao", "%EMENDA%")
    .order("ano", { ascending: false });

  console.log("=== TODAS AS 27 RECEITAS DE EMENDAS ===");
  recs?.forEach(r => {
    console.log(`[Ano ${r.ano}] R$ ${r.arrecadado_periodo} -> ${r.descricao}`);
  });

  // 2. Colunas de despesas e busca por 'EMENDA'
  const { data: dSample } = await supabase
    .schema("transparencia")
    .from("despesas")
    .select("*")
    .limit(1);
  
  if (dSample && dSample.length > 0) {
    const cols = Object.keys(dSample[0]);
    console.log("\nColunas reais de despesas:", cols);

    // Buscar em credor ou historico/projeto/atividade
    for (const c of cols) {
      if (typeof dSample[0][c] === "string") {
        const { count, error } = await supabase
          .schema("transparencia")
          .from("despesas")
          .select("*", { count: "exact", head: true })
          .ilike(c, "%EMENDA%");
        if (!error && count && count > 0) {
          console.log(`✅ Coluna despesas.${c} tem ${count} registros com 'EMENDA'`);
        }
      }
    }
  }
}

verificarTodosAnos();
