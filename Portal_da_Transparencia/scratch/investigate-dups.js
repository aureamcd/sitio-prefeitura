const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigate() {
  const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('*, documentos:contratos_documentos(*)').in('ano', [2017, 2018]);
  
  for (const c of contratos) {
    if (!c.documentos || c.documentos.length < 2) continue;
    
    const bySize = {};
    for (const doc of c.documentos) {
      if (!doc.tamanho) continue;
      if (!bySize[doc.tamanho]) bySize[doc.tamanho] = [];
      bySize[doc.tamanho].push(doc);
    }
    
    for (const size in bySize) {
      if (bySize[size].length > 1) {
        console.log(`\nContrato ${c.numero}/${c.ano} tem anexos duplicados de tamanho ${size}:`);
        for (const doc of bySize[size]) {
           console.log(` - ${doc.nome_arquivo} | R2? ${!!doc.caminho_r2} | URL: ${doc.url_arquivo.substring(0, 40)}...`);
        }
      }
    }
  }
}
investigate();
