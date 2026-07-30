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
  const { data } = await supabase.schema("transparencia").from("receitas").select("*").eq("ano", 2026);
  const tree = buildTree(data as any[]);
  let pIni = 0, pAtu = 0, arr = 0;
  for (const n of tree) {
    if (n.level === 1 || n.codigo.endsWith(".00.0.0.00")) {
      const isDeducao = n.codigo.startsWith("9");
      pIni += isDeducao ? -Math.abs(n.previstoInicial) : n.previstoInicial;
      pAtu += isDeducao ? -Math.abs(n.previsto) : n.previsto;
      arr += isDeducao ? -Math.abs(n.arrecadado) : n.arrecadado;
      console.log(`[${n.codigo}] emp:${n.empresa} - ${n.descricao} | pIni: ${n.previstoInicial} | arr: ${n.arrecadado}`);
    }
  }
  console.log("\n=========================");
  console.log("PREV INICIAL NO PORTAL:", pIni.toFixed(2));
  console.log("PREV ATUALIZADA NO PORTAL:", pAtu.toFixed(2));
  console.log("TOTAL ARRECADADO NO PORTAL:", arr.toFixed(2));
  console.log("=========================\n");
}
check();
