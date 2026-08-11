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
  const { data: obras } = await supabase.schema("transparencia").from("obras").select("objeto, link_tce").not("link_tce", "is", null).limit(5);
  console.log("Obras com link_tce:", obras?.length);
  (obras || []).forEach((o: any) => console.log("  •", String(o.objeto).substring(0, 60), "→", o.link_tce));
  const { data: lic } = await supabase.schema("transparencia").from("licitacoes_v2").select("numero, link_tce").not("link_tce", "is", null).limit(3);
  console.log("\nLicitacoes com link_tce:", lic?.length);
  (lic || []).forEach((l: any) => console.log("  •", l.numero, "→", l.link_tce));
}
main().catch(console.error);
