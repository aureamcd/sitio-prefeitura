const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const replacements = {
  'CONTRATAO': 'CONTRATAÇÃO',
  'AQUISIO': 'AQUISIÇÃO',
  'PRESTAO': 'PRESTAÇÃO',
  'SERVIOS': 'SERVIÇOS',
  'LOCAO': 'LOCAÇÃO',
  'MANUTENO': 'MANUTENÇÃO',
  'ALIMENTAO': 'ALIMENTAÇÃO',
  'MUNICPIO': 'MUNICÍPIO',
  'SADE': 'SAÚDE',
  'EXERCCIO': 'EXERCÍCIO',
  'TCNICO': 'TÉCNICO',
  'TCNICOS': 'TÉCNICOS',
  'ESPECIALIZAO': 'ESPECIALIZAÇÃO',
  'MDICO': 'MÉDICO',
  'MDICA': 'MÉDICA',
  'VECULOS': 'VEÍCULOS',
  'VECULO': 'VEÍCULO',
  'AGNCIA': 'AGÊNCIA',
  'PBLICO': 'PÚBLICO',
  'CONSTRUO': 'CONSTRUÇÃO',
  'ASSOCIAO': 'ASSOCIAÇÃO',
  'DESTINAO': 'DESTINAÇÃO',
  'PEAS': 'PEÇAS',
  'CLNICA': 'CLÍNICA',
  'CLNICAS': 'CLÍNICAS',
  'INSTALAO': 'INSTALAÇÃO',
  'INSTALAES': 'INSTALAÇÕES',
  'EXECUO': 'EXECUÇÃO',
  'MQUINAS': 'MÁQUINAS',
  'HOSPEDAO': 'HOSPEDAÇÃO', // Wait it's HOSPEDAGEM
  'REPRESENTAO': 'REPRESENTAÇÃO',
  'RESCISO': 'RESCISÃO',
  'MUNICIPAL': 'MUNICIPAL',
  'SECRETARIA': 'SECRETARIA',
  'SO': 'SÃO',
  'JOO': 'JOÃO',
  'PREVENO': 'PREVENÇÃO',
  'MS': 'MÊS',
  'CONCESSO': 'CONCESSÃO',
  'AMBULNCIA': 'AMBULÂNCIA',
  'AMBULNCIAS': 'AMBULÂNCIAS',
  'ODONTOLGICO': 'ODONTOLÓGICO',
  'ODONTOLGICOS': 'ODONTOLÓGICOS',
  'PEDAGGICO': 'PEDAGÓGICO',
  'EDUCAO': 'EDUCAÇÃO',
  'AO': 'AÇÃO',
  'AES': 'AÇÕES',
  'DOAO': 'DOAÇÃO',
  'MVEIS': 'MÓVEIS',
  'GNEROS': 'GÊNEROS',
  'MATERIAL': 'MATERIAL',
  'HOSPEDAGEM': 'HOSPEDAGEM',
  'DEMAIS': 'DEMAIS',
  'ÓRGÃOS': 'ÓRGÃOS',
  'RGOS': 'ÓRGÃOS',
  'RGO': 'ÓRGÃO',
  'PBLICOS': 'PÚBLICOS',
  'ATENO': 'ATENÇÃO',
  'FSICA': 'FÍSICA',
  'FSICO': 'FÍSICO',
  'BSICA': 'BÁSICA',
  'PNEUS': 'PNEUS',
  'VECULOS': 'VEÍCULOS',
  'PESADOS': 'PESADOS',
  'LEVES': 'LEVES',
  'DIRIAS': 'DIÁRIAS',
  'ALOCAO': 'ALOCAÇÃO',
  'ADMINISTRAO': 'ADMINISTRAÇÃO',
  'CONTRATAO': 'CONTRATAÇÃO',
  'AQUISIO': 'AQUISIÇÃO',
  'PRESTAO': 'PRESTAÇÃO',
  'LOCAO': 'LOCAÇÃO'
};

async function fixText(text) {
  if (!text) return text;
  let newText = text;
  
  for (const [bad, good] of Object.entries(replacements)) {
    // Tenta substituir maiúsculo
    newText = newText.split(bad).join(good);
    
    // E Tenta substituir com a primeira letra maiúscula e o resto minúsculo se a string falhou antes
    const badCamel = bad.charAt(0) + bad.slice(1).toLowerCase();
    const goodCamel = good.charAt(0) + good.slice(1).toLowerCase();
    newText = newText.split(badCamel).join(goodCamel);
    
    // E minúsculo
    const badLower = bad.toLowerCase();
    const goodLower = good.toLowerCase();
    newText = newText.split(badLower).join(goodLower);
  }
  
  return newText;
}

async function run() {
  const years = [2021, 2022];
  let updatedCount = 0;
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('*')
      .eq('ano', year)
      .ilike('objeto', '%%');
      
    if (contratos && contratos.length > 0) {
      for (const c of contratos) {
        if (c.objeto && c.objeto.includes('')) {
          const newObj = await fixText(c.objeto);
          
          if (newObj !== c.objeto) {
            await supabase.schema('transparencia').from('contratos_v2').update({ objeto: newObj }).eq('id', c.id);
            console.log(`Corrigido [${c.numero}]: ${newObj.substring(0, 60)}...`);
            updatedCount++;
          }
        }
      }
    }
  }
  
  console.log(`\nFim! Total de descrições corrigidas: ${updatedCount}`);
}
run();
