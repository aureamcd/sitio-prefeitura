const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  
  let totalFixed = 0;
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, numero, descricao')
      .eq('ano', year);
      
    if (!contratos) continue;

    for (const c of contratos) {
      if (c.descricao && c.descricao.includes('')) {
        let newDesc = c.descricao;
        
        // Let's print out what it looks like
        console.log(`[${year}] [${c.numero}] Original: ${c.descricao}`);
        
        newDesc = newDesc.replace(/PRESTAO/gi, 'Prestação');
        newDesc = newDesc.replace(/SERVIOS/gi, 'serviços');
        newDesc = newDesc.replace(/CONTRATAO/gi, 'Contratação');
        newDesc = newDesc.replace(/AQUISIO/gi, 'Aquisição');
        newDesc = newDesc.replace(/LOCAO/gi, 'Locação');
        newDesc = newDesc.replace(/MUNICPIO/gi, 'Município');
        newDesc = newDesc.replace(/SO/gi, 'São');
        newDesc = newDesc.replace(/PESSA/gi, 'Pessoa');
        newDesc = newDesc.replace(/JURDICA/gi, 'Jurídica');
        newDesc = newDesc.replace(/TCNICA/gi, 'Técnica');
        newDesc = newDesc.replace(/TCNICOS/gi, 'técnicos');
        newDesc = newDesc.replace(/MANUTENO/gi, 'Manutenção');
        newDesc = newDesc.replace(/VECULO/gi, 'veículo');
        newDesc = newDesc.replace(/VECULOS/gi, 'veículos');
        newDesc = newDesc.replace(/ESPECFICA/gi, 'específica');
        newDesc = newDesc.replace(/FSICA/gi, 'Física');
        newDesc = newDesc.replace(/MATRIA/gi, 'Matéria');
        newDesc = newDesc.replace(/SECRETRIA/gi, 'Secretaria');
        newDesc = newDesc.replace(/SECRETRIO/gi, 'Secretário');
        newDesc = newDesc.replace(/SADE/gi, 'Saúde');
        newDesc = newDesc.replace(/PBLICA/gi, 'Pública');
        newDesc = newDesc.replace(/GNEROS/gi, 'gêneros');
        newDesc = newDesc.replace(/ALIMENTCIOS/gi, 'alimentícios');
        newDesc = newDesc.replace(/RGOS/gi, 'Órgãos');
        newDesc = newDesc.replace(/SITUAO/gi, 'situação');
        newDesc = newDesc.replace(/EXCEO/gi, 'exceção');
        newDesc = newDesc.replace(/LQUIDO/gi, 'líquido');
        newDesc = newDesc.replace(/CONVENINCIA/gi, 'conveniência');
        newDesc = newDesc.replace(/ASSOCIAO/gi, 'Associação');
        newDesc = newDesc.replace(/FORUMO/gi, 'formação'); // maybe?
        newDesc = newDesc.replace(/EDUCAO/gi, 'Educação');
        newDesc = newDesc.replace(/ILUMINAO/gi, 'Iluminação');
        newDesc = newDesc.replace(/CONCESSO/gi, 'concessão');
        newDesc = newDesc.replace(/PEAS/gi, 'peças');
        newDesc = newDesc.replace(/VECULOS/gi, 'veículos');
        newDesc = newDesc.replace(/ASSESSRIA/gi, 'Assessoria');
        newDesc = newDesc.replace(/ASSESSRIOS/gi, 'acessórios');
        newDesc = newDesc.replace(/AO/gi, 'Ação');
        newDesc = newDesc.replace(/AES/gi, 'Ações');
        newDesc = newDesc.replace(/TRIBUTRIA/gi, 'tributária');
        newDesc = newDesc.replace(/RECUPERAO/gi, 'recuperação');
        
        // Capitalize the first letter if needed
        newDesc = newDesc.charAt(0).toUpperCase() + newDesc.slice(1);
        
        if (newDesc !== c.descricao) {
          console.log(`       -> Fixed: ${newDesc}`);
          await supabase.schema('transparencia')
            .from('contratos_v2')
            .update({ descricao: newDesc })
            .eq('id', c.id);
          totalFixed++;
        }
      }
    }
  }
  console.log(`\nFixed ${totalFixed} descriptions!`);
}
run();
