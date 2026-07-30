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
  for (const r of data || []) {
    if (Math.abs(Number(r.previsto_inicial) - 800000) < 1 || Math.abs(Number(r.previsto_atualizado) - 800000) < 1) {
      console.log("Encontrado 800.000 no DB:", r.empresa, r.codigo_contabil, r.descricao, r.previsto_inicial, r.nivel);
    }
  }
}
check();
