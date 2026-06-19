import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  const { data, error } = await supabase.schema("transparencia").from("licitacoes_v2").select("id, numero");
  if (error) throw error;

  const sujos = data.filter(r => r.numero && !r.numero.match(/^\d{3,}\/\d{4}$/));
  
  console.log(`Encontrados ${sujos.length} números potencialmente sujos.`);
  if (sujos.length > 0) {
    console.log("Exemplos:");
    for (let i = 0; i < Math.min(20, sujos.length); i++) {
      console.log(`- ${sujos[i].numero}`);
    }
  }
}

check();
