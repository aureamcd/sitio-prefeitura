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
  
  // As linhas começam a partir do índice 1 porque 0 é o cabeçalho "falso"
  const excelContratos = data.slice(1).map(row => ({
    instrumento: row['__EMPTY_1'],
    objeto: row['__EMPTY_4'],
    ano: row['__EMPTY_8'] ? String(row['__EMPTY_8']).split('/').pop() : null
  })).filter(c => c.instrumento && c.objeto && c.ano);

  console.log(`Carregados ${excelContratos.length} contratos do Excel.`);

  console.log("Baixando contratos_v2 (corrompidos)...");
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
  console.log(`Encontrados ${corrupted.length} contratos possivelmente corrompidos.`);
  
  let restoredCount = 0;
  let updates = [];
  
  for (const c of corrupted) {
    if (!c.numero || !c.ano) continue;
    
    // extrai só números e letras do numero para comparar com o instrumento
    const cleanNum = normalizeStr(c.numero);
    
    // Tenta encontrar o correspondente no excel
    const match = excelContratos.find(o => normalizeStr(o.instrumento) === cleanNum && o.ano === String(c.ano));
    
    if (match) {
      restoredCount++;
      updates.push({ id: c.id, old: c.objeto, new: match.objeto });
    } else {
      // Tenta achar apenas pelo numero
      const match2 = excelContratos.find(o => normalizeStr(o.instrumento) === cleanNum);
      if (match2) {
          restoredCount++;
          updates.push({ id: c.id, old: c.objeto, new: match2.objeto });
      } else {
          console.log(`NÃO ENCONTRADO NO EXCEL: ${c.numero} / ${c.ano}`);
      }
    }
  }
  
  console.log(`${restoredCount} dos ${corrupted.length} contratos corrompidos podem ser restaurados via Excel.`);
  
  if (updates.length > 0) {
      console.log("Restaurando o primeiro para teste:");
      console.log("ANTES:", updates[0].old.substring(0, 100));
      console.log("DEPOIS:", updates[0].new.substring(0, 100));
      
      let done = 0;
      for (const u of updates) {
          await supabase.schema('transparencia').from('contratos_v2').update({ objeto: u.new }).eq('id', u.id);
          done++;
      }
      console.log(`Todos os ${done} restaurados com sucesso a partir do Excel!`);
  }
}

restore();
