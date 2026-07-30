import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🔍 Verificando tabelas de Contratos no Supabase...");
  const { data: conts, error: errC } = await supabase.schema("transparencia").from("contratos_v2").select("*").limit(5);
  console.log("Contratos (amostra):", conts?.length, errC || "");
  if (conts && conts.length > 0) {
    console.log("Primeiro contrato:", conts[0]);
  }

  const { count: totalC } = await supabase.schema("transparencia").from("contratos_v2").select("*", { count: "exact", head: true });
  console.log("Total em contratos_v2:", totalC);

  const { count: totalD } = await supabase.schema("transparencia").from("contratos_documentos").select("*", { count: "exact", head: true });
  console.log("Total em contratos_documentos:", totalD);
}

main().catch(console.error);
