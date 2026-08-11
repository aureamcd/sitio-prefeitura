/**
 * READ-ONLY: lista obras com prazo vencido (data_previsao_fim < hoje)
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
  const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  console.log(`Hoje: ${hoje}\n`);

  const { data, error } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*")
    .lt("data_previsao_fim", hoje);

  if (error) {
    console.log("Erro:", error.message);
    return;
  }

  console.log(`Obras com data_previsao_fim < ${hoje}: ${data?.length || 0}\n`);

  (data || []).forEach((o: any) => {
    console.log(`• ${String(o.objeto || "").substring(0, 95)}`);
    console.log(`  id: ${o.id}`);
    console.log(`  previsão fim: ${o.data_previsao_fim} | início: ${o.data_inicio} | situação: ${o.situacao}`);
    console.log(`  contratada: ${o.empresa_responsavel} | contrato: ${o.contrato_numero || "-"}`);
    console.log(`  valor_total: ${o.valor_total} | %: ${o.percentual_executado ?? "-"}`);
    console.log("");
  });

  // Também mostra obras SEM prazo (previsão nula) para contexto
  const { data: semPrazo } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("objeto, data_inicio, data_previsao_fim, situacao")
    .is("data_previsao_fim", null);
  console.log(`\nObras SEM data_previsao_fim (não afetadas): ${semPrazo?.length || 0}`);
}

main().catch(console.error);
