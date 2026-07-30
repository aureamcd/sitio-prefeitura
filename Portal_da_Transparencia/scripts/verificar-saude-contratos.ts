import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🔍 === AUDITORIA COMPLETA DE CONTRATOS E ADITIVOS ===");
  const { count: totalConts } = await supabase.schema("transparencia").from("contratos_v2").select("*", { count: "exact", head: true });
  console.log(`📊 Total de Contratos Registrados (contratos_v2): ${totalConts}`);

  const { count: totalHist } = await supabase.schema("transparencia").from("contratos_v2").select("*", { count: "exact", head: true }).eq("origem", "HISTORICO_DRIVE");
  console.log(`🏛️ Contratos Históricos do Drive adicionados: ${totalHist}`);

  const { count: totalDocs } = await supabase.schema("transparencia").from("contratos_documentos").select("*", { count: "exact", head: true });
  console.log(`📑 Total de Documentos PDF Vinculados (contratos_documentos): ${totalDocs}`);

  const { data: anos } = await supabase.schema("transparencia").from("contratos_v2").select("ano");
  const anosMap: Record<number, number> = {};
  (anos || []).forEach(a => {
    if (a.ano) anosMap[a.ano] = (anosMap[a.ano] || 0) + 1;
  });
  console.log("\n📅 Distribuição de Contratos por Ano:");
  Object.keys(anosMap).sort((a, b) => Number(b) - Number(a)).forEach(ano => {
    console.log(`   - Ano ${ano}: ${anosMap[Number(ano)]} contratos`);
  });
}

main().catch(console.error);
