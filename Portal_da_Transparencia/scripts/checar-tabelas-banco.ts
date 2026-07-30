import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkTable(schema: string, table: string) {
  const { count, error } = await supabase.schema(schema).from(table).select("*", { count: "exact", head: true });
  if (!error) {
    console.log(`✅ [${schema}.${table}] -> ${count} registros`);
  }
}

async function main() {
  console.log("🔍 Verificando todas as possíveis tabelas de licitações, contratos e backups no Supabase...");
  const schemas = ["transparencia", "public"];
  const tables = [
    "licitacoes", "licitacoes_v2", "licitacoes_documentos", "licitacoes_backup", "licitacoes_antigas",
    "contratos", "contratos_v2", "contratos_documentos", "contratos_backup", "contratos_antigos",
    "backup", "backups", "documentos", "anexos"
  ];

  for (const sch of schemas) {
    for (const tab of tables) {
      await checkTable(sch, tab);
    }
  }
}

main().catch(console.error);
