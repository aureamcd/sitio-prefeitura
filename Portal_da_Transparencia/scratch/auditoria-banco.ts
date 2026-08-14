import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
async function countTable(t: string) {
  const { count, error } = await supabase.schema("transparencia").from(t).select("id", { count: "exact", head: true });
  return { t, count: count ?? 0, error: error?.message };
}
async function main() {
  console.log("=== CONTAGEM DE REGISTROS POR TABELA (schema transparencia) ===");
  const tabelas = ["receitas","despesas","transferencias","licitacoes","licitacoes_v2","contratos","contratos_v2","obras","planejamento_documentos","diarias","emendas_parlamentares","concursos","legislacoes","publicacoes","noticias","conselhos","servidores","pca","sancionados","renuncias_receita","incentivos_cultura_esporte","divida_ativa","saude","estoque_medicamentos","lista_espera","conselho_saude","educacao","conselho_fundeb","conselho_assistencia","manifestacoes_esic","ouvidoria_manifestacoes","pesquisa_satisfacao","dados_abertos"];
  for (const t of tabelas) {
    const r = await countTable(t);
    console.log(`${r.t.padEnd(35)} | ${String(r.count).padStart(8)} | ${r.error ?? "ok"}`);
  }
}
main();
