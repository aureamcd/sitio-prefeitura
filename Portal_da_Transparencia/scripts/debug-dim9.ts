import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("=== LICITACOES ===");
  const { data: lic } = await supabase.schema('transparencia').from('licitacoes_v2').select('*').limit(1);
  if (lic && lic.length > 0) {
    console.log(Object.keys(lic[0]));
  } else {
    const { data: lic2 } = await supabase.schema('transparencia').from('licitacoes').select('*').limit(1);
    if (lic2 && lic2.length > 0) console.log(Object.keys(lic2[0]));
    else console.log("No licitacoes found");
  }

  console.log("\n=== CONTRATOS ===");
  const { data: con } = await supabase.schema('transparencia').from('contratos_v2').select('*').limit(1);
  if (con && con.length > 0) {
    console.log(Object.keys(con[0]));
  } else {
    const { data: con2 } = await supabase.schema('transparencia').from('contratos').select('*').limit(1);
    if (con2 && con2.length > 0) console.log(Object.keys(con2[0]));
    else console.log("No contratos found");
  }
}

inspect();
