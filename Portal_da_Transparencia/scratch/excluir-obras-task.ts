/**
 * Exclui APENAS a obra "Praça Pública e Quiosques" (id 9df26db1...),
 * conforme confirmação explícita do usuário.
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

const ID = "9df26db1-ca30-453b-9cd6-ba468b9db0c8";

async function main() {
  // 1. Confirma que a obra existe e exibe dados antes de apagar
  const { data: antes } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("id, objeto, contrato_numero, empresa_responsavel, situacao, data_previsao_fim")
    .eq("id", ID)
    .maybeSingle();

  if (!antes) {
    console.log("Obra não encontrada com o id:", ID);
    return;
  }
  console.log("🗑️ Obra a excluir:");
  console.log(`  • ${String(antes.objeto).substring(0, 90)}`);
  console.log(`  • contrato: ${antes.contrato_numero} | ${antes.empresa_responsavel} | prazo: ${antes.data_previsao_fim}`);

  // 2. Exclui
  const { error } = await supabase
    .schema("transparencia")
    .from("obras")
    .delete()
    .eq("id", ID);

  if (error) {
    console.log("❌ Erro ao excluir:", error.message);
    return;
  }
  console.log("✅ Obra excluída com sucesso!");

  // 3. Confirma
  const { data: confirm } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("id")
    .eq("id", ID);
  console.log("Confirmação (deve ser 0):", confirm?.length || 0);

  // 4. Total restante
  const { count } = await supabase
    .schema("transparencia")
    .from("obras")
    .select("*", { count: "exact", head: true });
  console.log("Total de obras no banco agora:", count);
}

main().catch(console.error);
