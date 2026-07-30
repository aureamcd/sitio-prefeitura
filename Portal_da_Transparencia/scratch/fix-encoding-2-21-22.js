const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const replacements = {
  'sãob': 'sob',
  'sãobre': 'sobre',
  'pessãoa': 'pessoa',
  'sãom': 'som',
  'assessãoria': 'assessoria',
  'SÃOB': 'SOB',
  'SÃOBRE': 'SOBRE',
  'PESSÃOA': 'PESSOA',
  'SÃOM': 'SOM',
  'ASSESSÃORIA': 'ASSESSORIA'
};

async function fixText(text) {
  if (!text) return text;
  let newText = text;
  
  for (const [bad, good] of Object.entries(replacements)) {
    // case sensitive replace
    newText = newText.split(bad).join(good);
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
      .eq('ano', year);
      
    if (contratos && contratos.length > 0) {
      for (const c of contratos) {
        if (c.objeto) {
          const newObj = await fixText(c.objeto);
          
          if (newObj !== c.objeto) {
            await supabase.schema('transparencia').from('contratos_v2').update({ objeto: newObj }).eq('id', c.id);
            console.log(`Corrigido excesso [${c.numero}]: ${newObj.substring(0, 60)}...`);
            updatedCount++;
          }
        }
      }
    }
  }
  
  console.log(`\nFim! Total de descrições corrigidas: ${updatedCount}`);
}
run();
