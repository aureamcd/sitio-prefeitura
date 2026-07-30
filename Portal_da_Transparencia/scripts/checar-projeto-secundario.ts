import { createClient } from "@supabase/supabase-js";

const BACKUP_URL = "https://vgkufzfuozribwzubnrn.supabase.co";
const BACKUP_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna3VmemZ1b3pyaWJ3enVibnJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg4OTExOSwiZXhwIjoyMDk0NDY1MTE5fQ.M-2lnwrRNqG_47JHMrQYTokYJHQKICuzTyl_Ic-xfkc";

const s = createClient(BACKUP_URL, BACKUP_KEY);

async function main() {
  console.log("🔍 Verificando tabelas no projeto secundário (vgkufzfuozribwzubnrn)...");
  for (const sch of ["transparencia", "public"]) {
    for (const tab of ["licitacoes", "licitacoes_v2", "licitacoes_documentos", "contratos", "contratos_v2", "contratos_documentos", "documentos"]) {
      const { count, error } = await s.schema(sch).from(tab).select("*", { count: "exact", head: true });
      if (!error && count !== null) {
        console.log(`✅ [${sch}.${tab}]: ${count} registros`);
      } else if (error) {
        // console.log(`[${sch}.${tab}] erro:`, error.message);
      }
    }
  }
}

main().catch(console.error);
