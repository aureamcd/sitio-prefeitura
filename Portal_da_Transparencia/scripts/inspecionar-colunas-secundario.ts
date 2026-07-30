import { createClient } from "@supabase/supabase-js";

const s = createClient("https://vgkufzfuozribwzubnrn.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna3VmemZ1b3pyaWJ3enVibnJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg4OTExOSwiZXhwIjoyMDk0NDY1MTE5fQ.M-2lnwrRNqG_47JHMrQYTokYJHQKICuzTyl_Ic-xfkc");

async function main() {
  const { data: lic } = await s.from("licitacoes").select("*").limit(2);
  console.log("📄 Exemplo licitacoes (secundario):", JSON.stringify(lic?.[0], null, 2));

  const { data: cont } = await s.from("contratos").select("*").limit(2);
  console.log("\n📄 Exemplo contratos (secundario):", JSON.stringify(cont?.[0], null, 2));
}

main().catch(console.error);
