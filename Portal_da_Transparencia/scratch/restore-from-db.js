const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeStr = (s) => s ? s.replace(/[^0-9A-Z]/gi, '').toUpperCase() : '';

async function restore() {
  console.log("Baixando contratos_v2 (corrompidos) restantes...");
  let offset = 0;
  const limit = 1000;
  let allContratosV2 = [];
  while (true) {
    const { data: dbData, error } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, ano, objeto').range(offset, offset + limit - 1);
    if (error) { console.log(error); return; }
    if (dbData.length === 0) break;
    allContratosV2.push(...dbData);
    offset += limit;
  }
  
  const corrupted = allContratosV2.filter(c => c.objeto && (c.objeto.includes('AQUISIÇÃPRESTAÇÃ') || c.objeto.includes('CONTRATAÇÃPÚBLICAAQUISIÇÃ') || c.objeto.includes('PÚBLICAÇÃLICITAÇÃMANUTENÇÃ') || (c.objeto.length > 300 && c.objeto.includes('ÇÃ'))));
  console.log(`Encontrados ${corrupted.length} contratos possivelmente corrompidos restantes.`);
  
  if (corrupted.length === 0) {
      console.log("Tudo restaurado!");
      return;
  }

  console.log("Baixando tabela contratos (antiga)...");
  offset = 0;
  let allContratosAntigos = [];
  while (true) {
    const { data: dbData, error } = await supabase.schema('transparencia').from('contratos').select('id, numero_contrato, ano, objeto, objeto_completo').range(offset, offset + limit - 1);
    if (error) { console.log(error); return; }
    if (dbData.length === 0) break;
    allContratosAntigos.push(...dbData);
    offset += limit;
  }
  console.log(`Carregados ${allContratosAntigos.length} da tabela antiga.`);

  let restoredCount = 0;
  let updates = [];
  
  for (const c of corrupted) {
    const cleanNum = normalizeStr(c.numero);
    
    let match = allContratosAntigos.find(o => normalizeStr(o.numero_contrato) === cleanNum && String(o.ano) === String(c.ano));
    if (!match) {
        match = allContratosAntigos.find(o => normalizeStr(o.numero_contrato) === cleanNum);
    }
    
    if (match) {
      restoredCount++;
      const val = match.objeto_completo || match.objeto;
      updates.push({ id: c.id, old: c.objeto, new: val });
    } else {
      console.log(`NÃO ENCONTRADO NA TABELA ANTIGA: ${c.numero} / ${c.ano}`);
      // Forçamos a limpeza do lixo!
      updates.push({ id: c.id, old: c.objeto, new: "CONTRATO" }); // fallback para que não fique lixo no site.
    }
  }
  
  console.log(`${restoredCount} contratos restaurados da tabela antiga.`);
  
  if (updates.length > 0) {
      console.log("Restaurando/Limpando o restante...");
      let done = 0;
      for (const u of updates) {
          await supabase.schema('transparencia').from('contratos_v2').update({ objeto: u.new }).eq('id', u.id);
          done++;
      }
      console.log(`Todos os ${done} atualizados com sucesso!`);
  }
}

restore();
