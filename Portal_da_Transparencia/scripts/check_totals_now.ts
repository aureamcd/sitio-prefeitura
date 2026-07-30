import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import { buildTree } from "../lib/receitas/receitasTree";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: rawData, error } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("*")
    .eq("ano", 2026);

  if (error) {
    console.error("Erro ao buscar receitas:", error.message);
    return;
  }

  const { rootNodes, totalPrevistoInicial, totalPrevistoAtualizado, totalArrecadadoPeriodo, totalArrecadadoTotal } = buildTree(rawData || [], undefined, undefined);

  console.log("=== TOTAIS CALCULADOS POR buildTree (Portal da Transparência) ===");
  console.log("PREV. INICIAL:", totalPrevistoInicial.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
  console.log("PREV. ATUALIZADO:", totalPrevistoAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
  console.log("ARRECADADO PERIODO:", totalArrecadadoPeriodo.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
  console.log("TOTAL ARRECADADO:", totalArrecadadoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));

  console.log("\n=== NÍVEL 1 NO BANCO ===");
  const n1 = (rawData || []).filter(r => r.nivel === 1 || r.codigo_contabil?.endsWith(".0.0.00.00.00") || r.codigo_contabil?.endsWith(".0.0.0.0.00"));
  for (const r of n1) {
    console.log(`Emp: ${r.empresa} | Cod: ${r.codigo_contabil} | ${r.descricao} | Arr: ${Number(r.arrecadado_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
  }
}
check();
