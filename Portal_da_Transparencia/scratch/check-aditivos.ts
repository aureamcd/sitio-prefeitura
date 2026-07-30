import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: credentials missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAditivos() {
  const { data, error } = await supabase
    .schema('transparencia')
    .from('contratos_v2')
    .select('id, numero, objeto')
    .or('objeto.ilike.%aditivo%,numero.ilike.%aditivo%');

  if (error) {
    console.error("Error fetching from contratos_v2:", error);
    return;
  }
  
  console.log(`Found ${data.length} records in contratos_v2 matching 'aditivo'`);
  if (data.length > 0) {
      console.log("Sample records:");
      console.log(data.slice(0, 5));
  }
}

checkAditivos();
