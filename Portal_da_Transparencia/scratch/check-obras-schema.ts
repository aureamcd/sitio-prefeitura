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
  const { data, error } = await supabase.schema("transparencia").from("obras").select("*").limit(1);
  if (error) { console.log("ERRO:", error.message); return; }
  if (data && data[0]) console.log("COLUNAS:", Object.keys(data[0]).join(", "));
}
main();
