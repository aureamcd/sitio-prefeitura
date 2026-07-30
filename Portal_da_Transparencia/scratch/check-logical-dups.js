const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function getDocumentType(name) {
  const n = name.toLowerCase();
  if (n.includes('aditivo')) return 'aditivo';
  if (n.includes('rescis') || n.includes('resis')) return 'rescisao';
  if (n.includes('errata') || n.includes('extrato')) return 'extrato';
  if (n.includes('dispensa')) return 'dispensa';
  if (n.includes('ata')) return 'ata';
  if (n.includes('termo')) return 'termo_outros';
  if (n.includes('contrato') || n.includes('ct')) return 'contrato';
  return 'outro';
}

async function run() {
  const years = [2018, 2019, 2020];
  let totalDups = 0;
  
  for (const year of years) {
    const { data: contratos } = await supabase.schema('transparencia')
      .from('contratos_v2')
      .select('id, numero, documentos:contratos_documentos(*)')
      .eq('ano', year);
      
    console.log(`\n=== Ano ${year} ===`);
    
    for (const c of contratos) {
      if (c.documentos && c.documentos.length > 1) {
        const byType = {};
        for (const doc of c.documentos) {
          const type = getDocumentType(doc.nome_arquivo);
          if (!byType[type]) byType[type] = [];
          byType[type].push(doc);
        }
        
        // Se tem mais de 1 documento do tipo "contrato"
        if (byType['contrato'] && byType['contrato'].length > 1) {
          console.log(`\nContrato ${c.numero} tem ${byType['contrato'].length} arquivos de CONTRATO principais:`);
          byType['contrato'].forEach(d => console.log(`  - ${d.nome_arquivo}`));
          totalDups += (byType['contrato'].length - 1);
        }
      }
    }
  }
  console.log(`\nTotal de arquivos "contrato" que podem ser apagados: ${totalDups}`);
}
run();
