const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTable(tableName, columnName) {
  console.log(`\nCorrigindo tabela: ${tableName} (coluna: ${columnName})`);
  
  let offset = 0;
  let limit = 1000;
  let allRows = [];
  while (true) {
    const { data, error } = await supabase.schema('transparencia')
      .from(tableName)
      .select(`id, ${columnName}`)
      .range(offset, offset + limit - 1);
      
    if (error) { console.log(error); break; }
    if (data.length === 0) break;
    allRows = allRows.concat(data);
    offset += limit;
  }
  
  let fixedCount = 0;
  
  for (let i = 0; i < allRows.length; i += 100) {
    const chunk = allRows.slice(i, i + 100);
    const updates = [];
    
    for (const row of chunk) {
      if (!row[columnName]) continue;
      
      let fixedText = row[columnName];
      let originalText = fixedText;
      
      if (!fixedText.includes('')) continue;
      
      // Mapeamento de palavras comuns com quebra de UTF-8
      const corrections = {
        'AQUISIO': 'AQUISIÇÃO',
        'PRESTAO': 'PRESTAÇÃO',
        'CONTRATAO': 'CONTRATAÇÃO',
        'SERVIOS': 'SERVIÇOS',
        'LICITAO': 'LICITAÇÃO',
        'MANUTENO': 'MANUTENÇÃO',
        'EDUCAO': 'EDUCAÇÃO',
        'ADMINISTRAO': 'ADMINISTRAÇÃO',
        'SAO': 'SÃO',
        'MUNICPIO': 'MUNICÍPIO',
        'VEICULOS': 'VEÍCULOS',
        'LOCAO': 'LOCAÇÃO',
        'VEICULO': 'VEÍCULO',
        'CONCESSO': 'CONCESSÃO',
        'REALIZAO': 'REALIZAÇÃO',
        'DIVERSOS': 'DIVERSOS', // just in case
        'DIVERSAOS': 'DIVERSOS',
        'ONIBUS': 'ÔNIBUS',
        'MEDICO': 'MÉDICO',
        'MEDICOS': 'MÉDICOS',
        'FARMACIA': 'FARMÁCIA',
        'SAUDE': 'SAÚDE',
        'BASICA': 'BÁSICA',
        'VEICULOS': 'VEÍCULOS',
        'CONSTRUO': 'CONSTRUÇÃO',
        'PAVIMENTAO': 'PAVIMENTAÇÃO',
        'AQUISIÇÃOA': 'AQUISIÇÃO',
        'CONTRATAÇÃOA': 'CONTRATAÇÃO',
        'PRESTAÇÃOA': 'PRESTAÇÃO',
        'VEICULOSA': 'VEÍCULOS',
        'MUNICÍPIOA': 'MUNICÍPIO',
        'PÚBLICAO': 'PÚBLICA',
        'ÓRGÃOS': 'ÓRGÃOS',
        'ÓRGAOS': 'ÓRGÃOS',
        'ÁGUA': 'ÁGUA',
        'DOAÇÃO': 'DOAÇÃO',
        'INSCRIÇÃO': 'INSCRIÇÃO',
        'ÓRGÃO': 'ÓRGÃO',
        'FUNÇÃO': 'FUNÇÃO',
        'AÇÃO': 'AÇÃO',
        'AÇÕES': 'AÇÕES',
        'MÓVEIS': 'MÓVEIS',
        'MÁQUINAS': 'MÁQUINAS',
        'MÉDICA': 'MÉDICA',
        'VEÍCULOS': 'VEÍCULOS',
        'ÚNICA': 'ÚNICA',
        'FAMÍLIA': 'FAMÍLIA',
        'BÁSICOS': 'BÁSICOS',
        'PÚBLICOS': 'PÚBLICOS',
        'TÉCNICOS': 'TÉCNICOS',
        'TÉCNICA': 'TÉCNICA',
        'SECRETÁRIA': 'SECRETÁRIA',
        'SECRETARIA': 'SECRETARIA',
        'GÊNEROS': 'GÊNEROS',
        'ALIMENTÍCIOS': 'ALIMENTÍCIOS',
        'ODONTOLÓGICOS': 'ODONTOLÓGICOS',
        'ODONTOLÓGICO': 'ODONTOLÓGICO',
        'HOSPITALAR': 'HOSPITALAR',
        'HOSPITALARES': 'HOSPITALARES',
        'LABORATÓRIO': 'LABORATÓRIO',
        'LABORATORIAIS': 'LABORATORIAIS',
        'LABORATORIAL': 'LABORATORIAL',
        'PEDAGÓGICO': 'PEDAGÓGICO',
        'PEDAGÓGICOS': 'PEDAGÓGICOS',
        'DIDÁTICOS': 'DIDÁTICOS',
        'DIDÁTICO': 'DIDÁTICO',
        'HIDRÁULICA': 'HIDRÁULICA',
        'ELÉTRICA': 'ELÉTRICA',
        'ELÉTRICO': 'ELÉTRICO',
        'CONCESSAO': 'CONCESSÃO',
        'SERVICOS': 'SERVIÇOS',
        'AQUISICAO': 'AQUISIÇÃO',
        'CONTRATACAO': 'CONTRATAÇÃO',
        'PRESTACAO': 'PRESTAÇÃO',
        'MUNICIPIO': 'MUNICÍPIO'
      };
      
      // Fix case insensitive
      for (const [wrong, right] of Object.entries(corrections)) {
         // Create regex to match the wrong word with or without the replacement character inside it
         // E.g., CONTRATAO -> CONTRATAÇÃO, CONTRATAO -> CONTRATAÇÃO
         // Also match full uppercase or capitalized or lowercase
         
         // 1. replace '' when it separates parts of the word
         let regexStr = wrong.split('').join('*');
         let regex = new RegExp(`\\b${regexStr}\\b`, 'gi');
         fixedText = fixedText.replace(regex, (match) => {
             if (match === match.toUpperCase()) return right;
             if (match === match.toLowerCase()) return right.toLowerCase();
             // Capitalized
             if (match[0] === match[0].toUpperCase()) {
                 return right[0] + right.substring(1).toLowerCase();
             }
             return right;
         });
         
         // 2. Just in case, try regex where '' REPLACES a character, but this is harder, so we'll just do manual common ones
      }
      
      // Manual specific regex for CONTRATAO, CONTRATAO, SERVIOS, AQUISIO, PRESTAO
      fixedText = fixedText.replace(/\bCONTRATA+O\b/g, 'CONTRATAÇÃO');
      fixedText = fixedText.replace(/\bContrata+o\b/g, 'Contratação');
      fixedText = fixedText.replace(/\bcontrata+o\b/g, 'contratação');
      
      fixedText = fixedText.replace(/\bSERVI+OS\b/g, 'SERVIÇOS');
      fixedText = fixedText.replace(/\bServi+os\b/g, 'Serviços');
      fixedText = fixedText.replace(/\bservi+os\b/g, 'serviços');

      fixedText = fixedText.replace(/\bAQUISI+O\b/g, 'AQUISIÇÃO');
      fixedText = fixedText.replace(/\bAquisi+o\b/g, 'Aquisição');
      fixedText = fixedText.replace(/\baquisi+o\b/g, 'aquisição');

      fixedText = fixedText.replace(/\bPRESTA+O\b/g, 'PRESTAÇÃO');
      fixedText = fixedText.replace(/\bPresta+o\b/g, 'Prestação');
      fixedText = fixedText.replace(/\bpresta+o\b/g, 'prestação');

      fixedText = fixedText.replace(/\bMANUTEN+O\b/g, 'MANUTENÇÃO');
      fixedText = fixedText.replace(/\bManuten+o\b/g, 'Manutenção');
      fixedText = fixedText.replace(/\bmanuten+o\b/g, 'manutenção');

      fixedText = fixedText.replace(/\bEDUCA+O\b/g, 'EDUCAÇÃO');
      fixedText = fixedText.replace(/\bEduca+o\b/g, 'Educação');
      fixedText = fixedText.replace(/\beduca+o\b/g, 'educação');

      fixedText = fixedText.replace(/\bMUNIC+PIO\b/g, 'MUNICÍPIO');
      fixedText = fixedText.replace(/\bMunic+pio\b/g, 'Município');
      fixedText = fixedText.replace(/\bmunic+pio\b/g, 'município');

      fixedText = fixedText.replace(/\bS+O\b/g, 'SÃO');
      fixedText = fixedText.replace(/\bS+o\b/g, 'São');
      fixedText = fixedText.replace(/\bs+o\b/g, 'são');
      
      // Cleanup any remaining random '' that might be left between spaces or other words
      // by just removing them or replacing with space if needed, but let's just remove them
      fixedText = fixedText.replace(/\uFFFD/g, '');

      if (fixedText !== originalText) {
        updates.push({ id: row.id, [columnName]: fixedText });
      }
    }

    for (const update of updates) {
      await supabase.schema('transparencia').from(tableName).update({ [columnName]: update[columnName] }).eq('id', update.id);
      fixedCount++;
      console.log(`[${tableName}] Fixed: ${update[columnName]}`);
    }
  }
  
  console.log(`\nFinalizado ${tableName}: ${fixedCount} registros corrigidos!`);
}

async function start() {
  await fixTable('contratos_v2', 'objeto');
  await fixTable('licitacoes', 'objeto');
}

start();
