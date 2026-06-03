import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { count: totalContratos } = await supabase.schema('transparencia').from('contratos_documentos').select('*', { count: 'exact', head: true });
  const { count: aClassificarContratos } = await supabase.schema('transparencia').from('contratos_documentos').select('*', { count: 'exact', head: true }).eq('tipo_documento', 'A CLASSIFICAR');
  
  const { count: totalLicitacoes } = await supabase.schema('transparencia').from('licitacoes_documentos').select('*', { count: 'exact', head: true });
  const { count: aClassificarLicitacoes } = await supabase.schema('transparencia').from('licitacoes_documentos').select('*', { count: 'exact', head: true }).eq('tipo_documento', 'A CLASSIFICAR');

  console.log('=== ESTATÍSTICAS DE EXTRAÇÃO ===');
  console.log(`Contratos: ${totalContratos} total. Falharam/Pendentes: ${aClassificarContratos} (${((aClassificarContratos! / totalContratos!) * 100).toFixed(2)}%)`);
  console.log(`Licitações: ${totalLicitacoes} total. Falharam/Pendentes: ${aClassificarLicitacoes} (${((aClassificarLicitacoes! / totalLicitacoes!) * 100).toFixed(2)}%)`);
}

main();
