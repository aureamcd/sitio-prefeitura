const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: licitacoes } = await supabase.schema('transparencia')
    .from('licitacoes')
    .select('id, numero, objeto')
    .ilike('objeto', '%PRESTA%');
    
  if (!licitacoes) return;

  for (const c of licitacoes) {
    if (c.objeto && (c.objeto.includes('') || c.objeto.includes('PRESTA') || c.objeto.includes('SERVI'))) {
      console.log(`[Licitação] [${c.numero}] Objeto: ${c.objeto}`);
    }
  }
}
run();
