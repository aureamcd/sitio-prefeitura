import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarEmendas() {
  console.log("=== CHECANDO TABELAS DE EMENDAS NO SUPABASE ===");

  // 1. cadastro_emendas
  const { data: d1, count: c1, error: e1 } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .select("*", { count: "exact" })
    .order("exercicio", { ascending: false })
    .limit(3);

  if (e1) console.log("❌ Erro em cadastro_emendas:", e1.message);
  else {
    console.log(`✅ Tabela 'cadastro_emendas': ${c1} registros.`);
    if (d1 && d1.length > 0) {
      console.log("Exemplo de registro de cadastro_emendas:", JSON.stringify(d1[0], null, 2));
    }
  }

  // 2. emendas_impositivas
  const { data: d2, count: c2, error: e2 } = await supabase
    .schema("transparencia")
    .from("emendas_impositivas")
    .select("*", { count: "exact" })
    .limit(3);

  if (e2) console.log("❌ Erro em emendas_impositivas:", e2.message);
  else {
    console.log(`✅ Tabela 'emendas_impositivas': ${c2} registros.`);
    if (d2 && d2.length > 0) {
      console.log("Exemplo de registro de emendas_impositivas:", JSON.stringify(d2[0], null, 2));
    }
  }

  // 3. Checar anos distintos em cadastro_emendas
  const { data: anos } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .select("exercicio");
  
  const anosSet = Array.from(new Set(anos?.map(x => x.exercicio))).sort();
  console.log("✅ Anos em cadastro_emendas:", anosSet);
}

checarEmendas();
