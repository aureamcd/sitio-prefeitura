const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('numero').eq('ano', 2018);
    const nums = contratos.map(c => c.numero).filter(Boolean);
    console.log("Exemplos de números em 2018 no BD:");
    console.log(nums.slice(0, 30));
}
run();
