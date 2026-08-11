/**
 * READ-ONLY: verifica como foi preenchido arquivo_r2_url/arquivo_nome
 * na obra "escola em tempo integral" (padrão anterior).
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
    .select("objeto, valor_total, valor_executado, percentual_executado, situacao, arquivo_nome, arquivo_r2_url, link_tce, updated_at")
    .not("arquivo_nome", "is", null)
    .limit(5);

  if (error) {
    console.log("Erro:", error.message);
    return;
  }
  console.log(`Obras com documento anexado: ${data?.length || 0}\n`);
  (data || []).forEach((o: any) => {
    console.log(`• ${String(o.objeto || "").substring(0, 80)}`);
    console.log(`  valor_total: ${o.valor_total} | valor_executado: ${o.valor_executado} | %: ${o.percentual_executado} | situacao: ${o.situacao}`);
    console.log(`  arquivo_nome: ${o.arquivo_nome}`);
    console.log(`  arquivo_r2_url: ${o.arquivo_r2_url}`);
    console.log(`  link_tce: ${o.link_tce}`);
    console.log("");
  });
}

main().catch(console.error);
