/**
 * Corrige a localizacao da U.E. Cândida Macêdo para "Sede do Município"
 * (o usuário informou que a escola fica na sede, não em zona urbana).
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

const ID = "79e19784-f9a9-442e-8ef0-73e00e613fcf";

async function main() {
  // Antes
  const { data: antes } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("objeto, localizacao")
    .eq("id", ID)
    .maybeSingle();
  console.log("Antes:", antes?.localizacao, "|", String(antes?.objeto || "").substring(0, 70));

  // Update
  const { data: depois, error } = await supabase
    .schema("transparencia")
    .from("obras")
    .update({ localizacao: "Sede do Município", updated_at: new Date().toISOString() })
    .eq("id", ID)
    .select();

  if (error) {
    console.log("❌ Erro:", error.message);
    return;
  }
  console.log("✅ Depois:", depois?.[0]?.localizacao);
}

main().catch(console.error);
