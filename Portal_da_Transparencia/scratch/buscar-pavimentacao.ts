/**
 * READ-ONLY: busca obras de pavimentação asfáltica (por objeto e valor 5542800).
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
  // 1. Por valor 5542800
  console.log("=== OBRAS COM valor_total = 5542800 ===");
  const { data: porValor, error: e1 } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*")
    .eq("valor_total", 5542800);
  if (e1) console.log("Erro:", e1.message);
  console.log(`Encontradas: ${porValor?.length || 0}\n`);
  (porValor || []).forEach((o: any) => {
    console.log(`• ${String(o.objeto || "").substring(0, 100)}`);
    console.log(`  id: ${o.id} | ${o.empresa_responsavel} | valor: ${o.valor_total} | situacao: ${o.situacao}`);
    console.log("");
  });

  // 2. Por objeto contendo "pavimenta"
  console.log("=== OBRAS COM 'pavimenta' NO OBJETO ===");
  const { data: porObjeto, error: e2 } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*")
    .ilike("objeto", "%pavimenta%");
  if (e2) console.log("Erro:", e2.message);
  console.log(`Encontradas: ${porObjeto?.length || 0}\n`);
  (porObjeto || []).forEach((o: any) => {
    console.log(`• ${String(o.objeto || "").substring(0, 100)}`);
    console.log(`  id: ${o.id} | ${o.empresa_responsavel} | valor: ${o.valor_total} | contrato: ${o.contrato_numero || "-"}`);
    console.log("");
  });

  // 3. Total no banco
  const { count } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*", { count: "exact", head: true });
  console.log(`\nTotal de obras no banco: ${count}`);
}

main().catch(console.error);
