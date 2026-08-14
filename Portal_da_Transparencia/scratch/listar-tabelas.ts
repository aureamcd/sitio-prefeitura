import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function main() {
  const { data, error } = await supabase.schema("transparencia").from("receitas").select("*").limit(0);
  const { data: t2, error: e2 } = await supabase.rpc("list_tables" as any);
  console.log("RPC list_tables:", e2 ? JSON.stringify(e2) : JSON.stringify(t2).slice(0, 2000));
  const { data: t3, error: e3 } = await supabase.from("pg_catalog.pg_tables").select("schemaname, tablename").eq("schemaname", "transparencia");
  console.log("pg_tables:", e3 ? JSON.stringify(e3) : (t3 || []).map((r: any) => r.tablename).join(", "));
}
main();
