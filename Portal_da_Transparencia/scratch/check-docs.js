const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // Buscar o contrato 066/2026
    const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('*').ilike('numero', '%066/2026%');
    console.log("Contratos encontrados:", contratos);

    if (contratos && contratos.length > 0) {
        for (const c of contratos) {
            const { data: docs } = await supabase.schema('transparencia').from('contratos_documentos').select('*').eq('contrato_id', c.id);
            console.log(`Documentos do contrato ${c.numero}:`, docs);
        }
    }
}
run();
