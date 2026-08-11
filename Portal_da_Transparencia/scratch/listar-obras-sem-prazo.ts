/**
 * READ-ONLY: lista obras SEM data_previsao_fim (prazo nulo)
 * para revisão do usuário antes de qualquer DELETE.
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

async function main() {
  const { data, error } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*")
    .is("data_previsao_fim", null);

  if (error) {
    console.log("Erro:", error.message);
    return;
  }

  console.log(`Obras SEM data_previsao_fim: ${data?.length || 0}\n`);

  (data || []).forEach((o: any) => {
    console.log(`• ${String(o.objeto || "").substring(0, 95)}`);
    console.log(`  id: ${o.id}`);
    console.log(`  início: ${o.data_inicio} | situação: ${o.situacao} | ano: ${o.ano}`);
    console.log(`  contratada: ${o.empresa_responsavel} | contrato: ${o.contrato_numero || "-"}`);
    console.log(`  valor_total: ${o.valor_total} | %: ${o.percentual_executado ?? "-"}`);
    console.log("");
  });

  // Contexto: total geral
  const { count } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*", { count: "exact", head: true });
  console.log(`Total de obras no banco: ${count}`);
}

main().catch(console.error);
