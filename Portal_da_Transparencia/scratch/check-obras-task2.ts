/**
 * CHECAGEM READ-ONLY (Task 2 - Atualizar Obras)
 * Códigos: 349659, 360977, 360981
 *
 * NÃO altera nada. Apenas consulta.
 * - Colunas da tabela transparencia.obras
 * - Obras que mencionam os códigos 349659/360977/360981 (qualquer coluna)
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

const CODIGOS = ["349659", "360977", "360981"];

async function main() {
  console.log("=== 1. COLUNAS DA TABELA transparencia.obras ===");
  const { data: cols, error: errCols } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*")
    .limit(1);
  if (errCols) {
    console.log("Erro ao acessar obras:", errCols.message);
  } else if (cols && cols[0]) {
    console.log(Object.keys(cols[0]).join(", "));
  } else {
    console.log("Tabela vazia ou sem acesso.");
  }

  console.log("\n=== 2. TOTAL DE OBRAS NO BANCO ===");
  const { count } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*", { count: "exact", head: true });
  console.log("Total:", count);

  console.log("\n=== 3. BUSCA PELOS CÓDIGOS ===");
  for (const codigo of CODIGOS) {
    const { data, error } = await supabase
      .schema("transparencia")
      .from("obras")
      .select("*")
      .or(
        `objeto.ilike.%${codigo}%,contrato_numero.ilike.%${codigo}%,licitacao.ilike.%${codigo}%,link_tce.ilike.%${codigo}%,arquivo_nome.ilike.%${codigo}%,arquivo_r2_url.ilike.%${codigo}%`
      );
    if (error) {
      console.log(`\n[${codigo}] Erro: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`\n[${codigo}] ${data.length} obra(s) encontrada(s):`);
      data.forEach((o: any) => {
        console.log(`  - id: ${o.id}`);
        console.log(`    objeto: ${String(o.objeto || "").substring(0, 90)}`);
        console.log(`    situacao: ${o.situacao} | contrato: ${o.contrato_numero || "-"} | licitacao: ${o.licitacao || "-"}`);
        console.log(`    valor_total: ${o.valor_total} | valor_executado: ${o.valor_executado} | %exec: ${o.percentual_executado}`);
        console.log(`    arquivo_nome: ${o.arquivo_nome || "-"}`);
        console.log(`    arquivo_r2_url: ${o.arquivo_r2_url || "-"}`);
        console.log(`    link_tce: ${o.link_tce || "-"}`);
      });
    } else {
      console.log(`\n[${codigo}] Nenhuma obra encontrada.`);
    }
  }

  console.log("\n=== 4. ÚLTIMAS 10 OBRAS (para contexto) ===");
  const { data: recentes } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("id, objeto, contrato_numero, valor_total, valor_executado, percentual_executado, arquivo_nome, link_tce")
    .order("created_at", { ascending: false })
    .limit(10);
  (recentes || []).forEach((o: any) => {
    console.log(`  - ${String(o.objeto || "").substring(0, 70)} | contrato: ${o.contrato_numero || "-"} | valor: ${o.valor_total} | arquivo: ${o.arquivo_nome || "-"}`);
  });
}

main().catch(console.error);
