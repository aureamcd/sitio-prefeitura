import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env", override: false });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function fixAnos() {
  const { data, error } = await supabase
    .schema("transparencia")
    .from("licitacoes_v2")
    .select("id, numero, ano");

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  let updated = 0;
  for (const row of data) {
    if (!row.numero) continue;
    
    // Extract year from numero, e.g., "001/2025" -> 2025
    const match = row.numero.match(/\/(\d{4})$/);
    if (match) {
      const correctYear = parseInt(match[1], 10);
      if (row.ano !== correctYear) {
        console.log(`Fixing ${row.numero}: ano ${row.ano} -> ${correctYear}`);
        await supabase
          .schema("transparencia")
          .from("licitacoes_v2")
          .update({ ano: correctYear })
          .eq("id", row.id);
        updated++;
      }
    }
  }
  
  console.log(`Total updated: ${updated}`);
}

fixAnos();
