import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarColunas() {
  const { data: d1, count: c1 } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .select("*", { count: "exact" })
    .limit(3);

  console.log(`✅ Tabela 'cadastro_emendas': ${c1} registros.`);
  if (d1 && d1.length > 0) {
    console.log("Colunas e exemplo de cadastro_emendas:", JSON.stringify(d1[0], null, 2));
  }

  // Checar anos distintos usando a coluna 'ano' (ou qual for o nome do ano)
  const { data: dAll } = await supabase
    .schema("transparencia")
    .from("cadastro_emendas")
    .select("ano");
  
  const anosSet = Array.from(new Set(dAll?.map(x => x.ano))).sort();
  console.log("✅ Anos em cadastro_emendas (coluna 'ano'):", anosSet);

  // Checar anos em emendas_impositivas
  const { data: eAll } = await supabase
    .schema("transparencia")
    .from("emendas_impositivas")
    .select("ano, tipo_transferencia");
  
  console.log("✅ Resumo de anos e tipos em emendas_impositivas:");
  const eResumo: Record<string, number> = {};
  eAll?.forEach(x => {
    const key = `${x.ano} | ${x.tipo_transferencia}`;
    eResumo[key] = (eResumo[key] || 0) + 1;
  });
  console.log(JSON.stringify(eResumo, null, 2));
}

checarColunas();
