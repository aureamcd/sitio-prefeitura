import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data, error } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("id, ano, numero")
    .order('ano', { ascending: false })
    .order('numero', { ascending: false })
    .limit(20);
  
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.table(data);
}

check();
