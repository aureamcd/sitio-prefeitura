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
  console.log("========== 1. OBRAS ==========");
  const { data: obras, error: e1 } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("id, objeto, localizacao, situacao, data_inicio, data_previsao_fim, empresa_responsavel, contrato_numero, valor_total, valor_executado, percentual_executado, arquivo_nome, arquivo_r2_url")
    .order("objeto", { ascending: true });

  if (e1) console.log("ERRO obras:", e1.message);
  else {
    console.log(`Total de obras: ${obras?.length || 0}`);
    (obras || []).forEach((o: any) => {
      console.log(`\n• ${o.objeto}`);
      console.log(`  contrato=${o.contrato_numero} | contratada=${o.empresa_responsavel}`);
      console.log(`  valor_total=${o.valor_total} | executado=${o.valor_executado} | %=${o.percentual_executado}`);
      console.log(`  situacao=${o.situacao} | localizacao=${o.localizacao}`);
      console.log(`  arquivo_nome=${o.arquivo_nome}`);
      console.log(`  arquivo_r2_url=${o.arquivo_r2_url ? o.arquivo_r2_url.substring(0, 120) : null}`);
    });
  }

  console.log("\n========== 2. RGF/RREO 2026 (planejamento_documentos) ==========");
  const { data: docs, error: e2 } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("tipo, titulo, periodo, ordem, exercicio, arquivo_nome, arquivo_url")
    .in("tipo", ["RGF", "RREO"])
    .eq("exercicio", 2026)
    .order("tipo", { ascending: true })
    .order("ordem", { ascending: true });

  if (e2) console.log("ERRO relatórios:", e2.message);
  else {
    console.log(`Total RGF/RREO 2026: ${docs?.length || 0}`);
    (docs || []).forEach((d: any) => {
      console.log(`\n• [${d.tipo}] ${d.titulo}`);
      console.log(`  periodo=${d.periodo} | ordem=${d.ordem} | nome=${d.arquivo_nome}`);
      console.log(`  url=${d.arquivo_url ? d.arquivo_url.substring(0, 120) : null}`);
    });
  }

  console.log("\n========== 3. RGF/RREO todos os anos (resumo) ==========");
  const { data: resumo, error: e3 } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("tipo, exercicio")
    .in("tipo", ["RGF", "RREO"]);

  if (e3) console.log("ERRO resumo:", e3.message);
  else {
    const map = new Map<string, number>();
    (resumo || []).forEach((r: any) => {
      const k = `${r.tipo} ${r.exercicio}`;
      map.set(k, (map.get(k) || 0) + 1);
    });
    [...map.entries()].sort().forEach(([k, v]) => console.log(`  ${k}: ${v} anexos`));
  }
}

main();
