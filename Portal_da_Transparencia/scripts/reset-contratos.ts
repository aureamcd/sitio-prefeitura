import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  console.log("Resetando contratos_documentos...");
  const { error: err1 } = await supabase.schema('transparencia').from('contratos_documentos').update({ tipo_documento: 'A CLASSIFICAR', contrato_id: null }).neq('id', '00000000-0000-0000-0000-000000000000');
  if (err1) console.error(err1);

  console.log("Deletando contratos_v2...");
  const { error: err2 } = await supabase.schema('transparencia').from('contratos_v2').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err2) console.error(err2);

  console.log("Pronto. Agora você pode rodar o processador-contratos.ts");
}

main();
