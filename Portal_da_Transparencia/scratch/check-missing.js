const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingFields() {
  const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('*');
  if(!contratos) { console.log("No contratos found"); return; }
  
  console.log(`Total contratos: ${contratos.length}`);
  
  const fields = ['numero', 'ano', 'valor', 'data_assinatura', 'data_vigencia', 'cnpj_contratado', 'nome_contratado', 'objeto', 'numero_licitacao'];
  
  const stats = {};
  for(const f of fields) {
      stats[f] = { missing: 0, present: 0 };
  }
  
  for(const c of contratos) {
      for(const f of fields) {
          if(!c[f] || c[f].toString().trim() === '') stats[f].missing++;
          else stats[f].present++;
      }
  }
  
  console.log("Missing fields stats:");
  console.table(stats);
}

checkMissingFields();
