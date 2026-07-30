import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data } = await supabase
    .schema("transparencia")
    .from("receitas")
    .select("id, empresa, codigo_contabil, descricao, previsto_inicial, arrecadado_total, nivel")
    .eq("ano", 2026);

  const n1 = (data || []).filter((r) => r.nivel === 1);
  console.log("Qtd Nível 1 no DB:", n1.length);
  for (const r of n1) {
    console.log(`[${r.codigo_contabil}] Emp: ${r.empresa} | PrevIni: ${r.previsto_inicial} | Arr: ${r.arrecadado_total}`);
  }
}
check();
