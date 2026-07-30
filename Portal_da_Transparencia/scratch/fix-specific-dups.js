const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function mergeContracts(ghostId, realId) {
  // Transferir documentos do ghost para o real
  const { data: docs } = await supabase.schema('transparencia').from('contratos_documentos').select('*').eq('contrato_id', ghostId);
  if (docs && docs.length > 0) {
    for (const doc of docs) {
      await supabase.schema('transparencia').from('contratos_documentos').update({ contrato_id: realId }).eq('id', doc.id);
    }
  }
  // Deletar o ghost
  await supabase.schema('transparencia').from('contratos_v2').delete().eq('id', ghostId);
  console.log(`Mesclado ghost ${ghostId} no real ${realId}`);
}

async function run() {
  const merges = [
    // 004
    { ghost: 'cf69a949-673c-4002-aa67-ebd2f98ddce2', real: 'aac4e960-3925-4223-9c9e-a0af24f26722' },
    // 006
    { ghost: 'ef226c1f-a6e2-40b5-829f-ed5175e468f5', real: '9271e856-5d9d-468d-8209-48237261a1dd' },
    // 027
    { ghost: '6ef2e39b-aaf3-4cac-8aa5-4eaca6915633', real: '6ba48abb-a9e3-4735-98b9-d375a4937c43' },
    // 028
    { ghost: 'c1015bf3-095e-49fe-a483-50f366c9cbe8', real: '37764746-136e-4921-8935-3ffdbd352531' },
    // 029
    { ghost: 'ae5886b3-0c69-457c-946f-48174feb3809', real: '0084b63d-d09b-42f5-9bdc-64410f86da60' },
    // 030
    { ghost: '56fe6da6-3df6-4c51-acf8-e3233947aa86', real: '7460469d-87ad-4b19-ae61-c3a0e3719753' },
    // 033
    { ghost: '93ac2e1c-7b25-43bf-b86a-34e8f9dd13e6', real: '108ea1ff-8f9e-41cf-b19e-ed4aa8fac7f4' },
    // 049
    { ghost: '24f1b4e2-b94a-4248-be8a-36dca2b524a5', real: '84c5ad79-ba4b-4e1f-860a-dc1d7b5acf3b' },
  ];

  for (const m of merges) {
    await mergeContracts(m.ghost, m.real);
  }
}
run();
