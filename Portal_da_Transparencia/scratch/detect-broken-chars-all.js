const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  let offset = 0;
  let limit = 1000;
  let allContratos = [];
  while (true) {
    const { data, error } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, objeto')
      .range(offset, offset + limit - 1);
      
    if (error) { console.log(error); break; }
    if (data.length === 0) break;
    allContratos = allContratos.concat(data);
    offset += limit;
  }
  
  const brokenContratos = allContratos.filter(c => c.objeto && c.objeto.includes(''));
  console.log(`Encontrados ${brokenContratos.length} contratos com ''`);
  if (brokenContratos.length > 0) {
    console.log("Exemplo (Contratos):", brokenContratos[0].objeto);
  }
  
  offset = 0;
  let allLicitacoes = [];
  while (true) {
    const { data, error } = await supabase.schema('transparencia')
      .from('licitacoes')
      .select('id, objeto, titulo')
      .range(offset, offset + limit - 1);
      
    if (error) { console.log(error); break; }
    if (data.length === 0) break;
    allLicitacoes = allLicitacoes.concat(data);
    offset += limit;
  }
  
  const brokenLicitacoes = allLicitacoes.filter(l => 
    (l.objeto && l.objeto.includes('')) || 
    (l.titulo && l.titulo.includes(''))
  );
  console.log(`Encontradas ${brokenLicitacoes.length} licitações com ''`);
  if (brokenLicitacoes.length > 0) {
    console.log("Exemplo (Licitações):", brokenLicitacoes[0].objeto || brokenLicitacoes[0].titulo);
  }
}
run();
