import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkJoin() {
  const { data: v2, error: errV2 } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("*, documentos:licitacoes_documentos(*)")
    .order("ano", { ascending: false })
    .limit(2);

  if (errV2) console.error("Erro licitacoes_v2:", errV2.message);
  else {
    console.log("=== AMOSTRA LICITACOES_V2 COM DOCUMENTOS ===");
    console.log(JSON.stringify(v2, null, 2));
  }
}
checkJoin();
