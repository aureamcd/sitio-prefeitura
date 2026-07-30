const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const xlsx = require('xlsx');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeStr = (s) => s ? s.replace(/[^0-9A-Z]/gi, '').toUpperCase() : '';

async function restore() {
  console.log("Lendo Excel...");
  const wb = xlsx.readFile('C:\\Users\\Áurea Letícia\\Downloads\\contratos (1).xlsx');
  const sheetName = wb.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
  
  const excelContratos = data.slice(1).map(row => ({
    instrumento: row['__EMPTY_1'],
    contratado: row['__EMPTY_6'],
    ano: row['__EMPTY_8'] ? String(row['__EMPTY_8']).split('/').pop() : null
  })).filter(c => c.instrumento && c.contratado && c.ano);

  console.log(`Carregados ${excelContratos.length} contratos do Excel.`);

  console.log("Baixando tabela contratos (antiga) para fallback...");
  let offset = 0;
  const limit = 1000;
  let allContratosAntigos = [];
  while (true) {
    const { data: dbData, error } = await supabase.schema('transparencia').from('contratos').select('id, numero_contrato, ano, fornecedor').range(offset, offset + limit - 1);
    if (error) { console.log(error); return; }
    if (dbData.length === 0) break;
    allContratosAntigos.push(...dbData);
    offset += limit;
  }
  console.log(`Carregados ${allContratosAntigos.length} da tabela antiga.`);

  console.log("Baixando contratos_v2...");
  offset = 0;
  let allContratosV2 = [];
  while (true) {
    const { data: dbData, error } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero, ano, contratado').range(offset, offset + limit - 1);
    if (error) { console.log(error); return; }
    if (dbData.length === 0) break;
    allContratosV2.push(...dbData);
    offset += limit;
  }
  
  const corrupted = allContratosV2.filter(c => c.contratado && c.contratado.includes('\uFFFD'));
  console.log(`Encontrados ${corrupted.length} contratados com caracteres quebrados.`);
  
  if (corrupted.length === 0) {
      console.log("Tudo restaurado!");
      return;
  }

  let restoredCount = 0;
  let updates = [];
  
  for (const c of corrupted) {
    if (!c.numero) continue;
    
    const cleanNum = normalizeStr(c.numero);
    
    // 1. Tenta excel
    let match = excelContratos.find(o => normalizeStr(o.instrumento) === cleanNum && o.ano === String(c.ano));
    if (!match) match = excelContratos.find(o => normalizeStr(o.instrumento) === cleanNum);
    
    let novoContratado = match ? match.contratado : null;
    
    // 2. Tenta BD antigo se excel falhar
    if (!novoContratado) {
        let matchDb = allContratosAntigos.find(o => normalizeStr(o.numero_contrato) === cleanNum && String(o.ano) === String(c.ano));
        if (!matchDb) matchDb = allContratosAntigos.find(o => normalizeStr(o.numero_contrato) === cleanNum);
        if (matchDb) novoContratado = matchDb.fornecedor;
    }
    
    if (novoContratado) {
      restoredCount++;
      updates.push({ id: c.id, old: c.contratado, new: novoContratado });
    } else {
      console.log(`NÃO ENCONTRADO: ${c.numero} / ${c.ano}. Texto antigo: ${c.contratado}`);
      let manualFix = c.contratado.replace(/\uFFFD\uFFFD/g, 'ÇÃ');
      manualFix = manualFix.replace(/\uFFFD/g, 'Ã');
      updates.push({ id: c.id, old: c.contratado, new: manualFix });
    }
  }
  
  console.log(`${restoredCount} contratados recuperados das fontes originais.`);
  
  if (updates.length > 0) {
      console.log("Restaurando o primeiro para teste:");
      console.log("ANTES:", updates[0].old);
      console.log("DEPOIS:", updates[0].new);
      
      let done = 0;
      for (const u of updates) {
          await supabase.schema('transparencia').from('contratos_v2').update({ contratado: u.new }).eq('id', u.id);
          done++;
      }
      console.log(`Todos os ${done} atualizados com sucesso!`);
  }
}

restore();
