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
  const { data } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("titulo, arquivo_nome, arquivo_url")
    .eq("tipo", "RREO")
    .eq("exercicio", 2026)
    .order("ordem", { ascending: true })
    .limit(14);
  (data || []).forEach((d: any) => {
    console.log(`• ${d.titulo}`);
    console.log(`  nome=${d.arquivo_nome}`);
    console.log(`  url=${d.arquivo_url}`);
    console.log("");
  });
}
main().catch(console.error);
