import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function buscarTudo() {
  console.log("=== BUSCANDO TABELAS E SCHEMAS EM TODO O BANCO ===");

  // 1. Verificar public schema
  const publicTables = ["emendas", "cadastro_emendas", "emendas_impositivas", "emendas_parlamentares"];
  for (const t of publicTables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    if (!error) {
      console.log(`✅ [SCHEMA public] Tabela '${t}': ${count} registros`);
      const { data } = await supabase.from(t).select("*").limit(2);
      if (data && data.length > 0) console.log("Exemplo public:", JSON.stringify(data[0], null, 2));
    } else {
      console.log(`❌ [SCHEMA public] Tabela '${t}': ${error.message}`);
    }
  }

  // 2. Verificar transparencia schema
  const transpTables = ["emendas", "cadastro_emendas", "emendas_impositivas", "emendas_parlamentares"];
  for (const t of transpTables) {
    const { count, error } = await supabase.schema("transparencia").from(t).select("*", { count: "exact", head: true });
    if (!error) {
      console.log(`✅ [SCHEMA transparencia] Tabela '${t}': ${count} registros`);
      const { data } = await supabase.schema("transparencia").from(t).select("*").limit(2);
      if (data && data.length > 0) console.log("Exemplo transparencia:", JSON.stringify(data[0], null, 2));
    } else {
      console.log(`❌ [SCHEMA transparencia] Tabela '${t}': ${error.message}`);
    }
  }

  // 3. Buscar se há registros em receitas onde descricao ou rubrica tem 'emenda'
  const { data: recEmendas, count: cRec } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("ano, descricao, arrecadado_periodo", { count: "exact" })
    .ilike("descricao", "%EMENDA%");
  
  console.log(`✅ [SCHEMA transparencia.receitas] Registros com palavra 'EMENDA': ${cRec}`);
  if (recEmendas && recEmendas.length > 0) {
    console.log("Exemplos em receitas:", recEmendas.slice(0, 3));
  }

  // 4. Buscar em despesas onde historico ou credor tem 'emenda'
  const { data: despEmendas, count: cDesp } = await supabase
    .schema("transparencia")
    .from("despesas")
    .select("ano, historico, credor, valor_pago", { count: "exact" })
    .ilike("historico", "%EMENDA%");
  
  console.log(`✅ [SCHEMA transparencia.despesas] Registros com palavra 'EMENDA': ${cDesp}`);
  if (despEmendas && despEmendas.length > 0) {
    console.log("Exemplos em despesas:", despEmendas.slice(0, 3));
  }
}

buscarTudo();
