import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data, error } = await supabase
    .schema('transparencia')
    .from('servidores')
    .select('*')
    .or('ativo.eq.false,data_desligamento.not.is.null')
    .limit(1);
    
  console.log("Error:", error);
}

main();
