const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOldTable() {
    const { data, error } = await supabase.schema('transparencia').from('contratos').select('id, numero_contrato, ano').eq('ano', '2023');
    if (error) {
        console.error("Erro:", error.message);
    } else {
        console.log(`Tabela antiga 'contratos' tem ${data.length} registros para 2023.`);
    }
}

checkOldTable();
