const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMapping() {
  console.log("Baixando contratos_v2 (corrompidos)...");
  let offset = 0;
  const limit = 1000;
  let allContratosV2 = [];
  while (true) {
    const { data, error } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, ano, objeto').range(offset, offset + limit - 1);
    if (error) { console.log(error); return; }
    if (data.length === 0) break;
    allContratosV2.push(...data);
    offset += limit;
  }
  
  // Also match words that end with O instead of AO because they might have been transformed to something like CONTRATAÇÃPÚBLICAAQUISIÇÃPRESTAÇÃ...
  const corrupted = allContratosV2.filter(c => c.objeto && (c.objeto.includes('AQUISIÇÃPRESTAÇÃ') || c.objeto.includes('CONTRATAÇÃPÚBLICAAQUISIÇÃ') || c.objeto.includes('PÚBLICAÇÃLICITAÇÃMANUTENÇÃ') || c.objeto.length > 500 && c.objeto.includes('ÇÃ')));
  console.log(`Encontrados ${corrupted.length} contratos possivelmente corrompidos.`);
  
  if (corrupted.length === 0) {
    return;
  }
  
  console.log("Baixando contratos (antiga)...");
  offset = 0;
  let allContratos = [];
  while (true) {
    const { data, error } = await supabase.schema('transparencia').from('contratos').select('id, numero, ano, objeto').range(offset, offset + limit - 1);
    if (error) { console.log(error); return; }
    if (data.length === 0) break;
    allContratos.push(...data);
    offset += limit;
  }
  
  let restoredCount = 0;
  let updates = [];
  for (const c of corrupted) {
    if (!c.numero || !c.ano) continue;
    const match = allContratos.find(o => o.numero === c.numero && o.ano === c.ano && o.objeto && !o.objeto.includes('AQUISIÇÃPRESTAÇÃ'));
    if (match) {
      restoredCount++;
      updates.push({ id: c.id, old: c.objeto, new: match.objeto });
    } else {
        console.log(`NÃO ENCONTRADO: ${c.numero} / ${c.ano}`);
    }
  }
  
  console.log(`${restoredCount} dos ${corrupted.length} contratos corrompidos podem ser restaurados via tabela contratos (match por numero/ano).`);
  
  if (updates.length > 0) {
      console.log("Restaurando o primeiro para teste:");
      console.log("ANTES:", updates[0].old.substring(0, 100));
      console.log("DEPOIS:", updates[0].new.substring(0, 100));
      
      // Let's restore them all
      let done = 0;
      for (const u of updates) {
          await supabase.schema('transparencia').from('contratos_v2').update({ objeto: u.new }).eq('id', u.id);
          done++;
      }
      console.log(`Todos os ${done} restaurados com sucesso a partir de contratos!`);
  }
}

checkMapping();
