/**
 * Exclui as 2 obras SEM data_previsao_fim (confirmadas pelo usuário):
 * - 6270e990-2657-4b5f-85ab-0d47588e7dcb (Pavimentação - BERNARDO GRANJA)
 * - 5116ac54-5455-48c4-90a7-09b926113665 (Pavimentação/drenagem - COMLIMA)
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const IDS = [
  "6270e990-2657-4b5f-85ab-0d47588e7dcb",
  "5116ac54-5455-48c4-90a7-09b926113665",
];

async function main() {
  // 1. Exibe antes de apagar
  const { data: antes } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("id, objeto, empresa_responsavel, situacao, valor_total")
    .in("id", IDS);

  console.log("🗑️ Obras a excluir:");
  (antes || []).forEach((o: any) => {
    console.log(`  • ${String(o.objeto).substring(0, 80)}`);
    console.log(`    ${o.empresa_responsavel} | ${o.situacao} | valor: ${o.valor_total}`);
  });
  console.log("");

  // 2. Exclui
  const { error } = await supabase
    .schema("transparencia")
    .from("obras")
    .delete()
    .in("id", IDS);

  if (error) {
    console.log("❌ Erro ao excluir:", error.message);
    return;
  }
  console.log("✅ Obras excluídas com sucesso!");

  // 3. Confirma
  const { data: confirm } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("id")
    .in("id", IDS);
  console.log("Confirmação (deve ser 0):", confirm?.length || 0);

  // 4. Total restante
  const { count } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*", { count: "exact", head: true });
  console.log("Total de obras no banco agora:", count);

  // 5. Lista o que sobrou
  const { data: restantes } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("objeto, situacao, valor_total, percentual_executado, contrato_numero");
  console.log("\nObras restantes:");
  (restantes || []).forEach((o: any) => {
    console.log(`  • ${String(o.objeto).substring(0, 70)} | ${o.situacao} | %: ${o.percentual_executado ?? "-"}`);
  });
}

main().catch(console.error);
