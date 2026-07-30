const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const logContent = fs.readFileSync('C:\\Users\\Áurea Letícia\\.gemini\\antigravity\\brain\\985bf294-df79-490a-a2d6-5bf757c97f15\\.system_generated\\tasks\\task-9605.log', 'utf8');

const missingContracts = [
  'Termo de contrato 005/2023',
  '005',
  'Termo de contrato 06-A/2023',
  '006-A',
  '06-PS/2023',
  '006/2023',
  '006',
  '07-PS/2023',
  '007/2023',
  '007',
  'Termo de contrato 008/2023',
  '008  ',
  '008/2023'
];

async function run() {
  const lines = logContent.split('\n');
  const toInsert = [];

  for(const line of lines) {
    if(line.includes('--- Possível duplicata no ano 2023 - Número Base: 9 ---')) break;
    
    if(line.includes('| Nº: ')) {
      // ID: 70d4ab04-5fde-4fc7-bf98-0c30248c8bfa | Nº: 05-PS/2023 | Valor: 2886.14 | Objeto: A contratação par...
      const match = line.match(/ID: (.*?) \| Nº: (.*?) \| Valor: (.*?) \| Objeto: (.*)/);
      if(match) {
        const id = match[1].trim();
        const numero = match[2].trim();
        const valor = parseFloat(match[3].trim()) || 0;
        const objeto = match[4].trim();
        
        if (missingContracts.map(s => s.trim()).includes(numero)) {
            toInsert.push({
                id,
                ano: 2023,
                numero,
                valor,
                objeto: objeto + ' [RECUPERADO]',
                origem: 'RESTAURACAO'
            });
        }
      }
    }
  }
  
  // Also check if they are already in the DB before inserting to avoid duplicate key errors
  for (const c of toInsert) {
      const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id').eq('id', c.id).single();
      if (!data) {
          console.log(`Inserindo de volta: ${c.numero}`);
          const { error } = await supabase.schema('transparencia').from('contratos_v2').insert([c]);
          if(error) console.error(error.message);
      } else {
          console.log(`Já existe: ${c.numero}`);
      }
  }
}
run();
