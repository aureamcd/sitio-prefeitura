import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarDatas() {
  const { data: dMax } = await supabase
    .schema("transparencia")
    .from("despesas")
    .select("data_empenho, data_liquidacao, data_pagamento, created_at, ano")
    .order("data_empenho", { ascending: false })
    .limit(3);

  const { data: dCreated } = await supabase
    .schema("transparencia")
    .from("despesas")
    .select("data_empenho, created_at, ano")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: rMax } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("ano, created_at")
    .order("ano", { ascending: false })
    .limit(3);

  const { data: rCreated } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("ano, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  console.log("=== ÚLTIMAS DATAS DE EMPENHO EM DESPESAS ===");
  console.log(dMax);
  console.log("\n=== ÚLTIMA INSERÇÃO/ATUALIZAÇÃO DE DESPESAS NO BANCO ===");
  console.log(dCreated);
  console.log("\n=== ÚLTIMOS ANOS/REGISTROS EM RECEITAS ===");
  console.log(rMax);
  console.log("\n=== ÚLTIMA INSERÇÃO/ATUALIZAÇÃO DE RECEITAS NO BANCO ===");
  console.log(rCreated);
}

checarDatas();
