const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const realId = '4760e700-1209-47c9-ab3e-4360130add58';
    const dupIds = ['ca2eebd5-afe3-40cf-83d7-1ab34af5a048', '90cf296a-185b-45bb-aeac-cc819465737d'];

    for (const dupId of dupIds) {
        // Mover anexos
        const { error: e1 } = await supabase.schema('transparencia')
            .from('contratos_documentos')
            .update({ contrato_id: realId })
            .eq('contrato_id', dupId);
            
        if (e1) console.log("Erro ao mover anexos:", e1.message);
        
        // Deletar contrato duplicado
        const { error: e2 } = await supabase.schema('transparencia')
            .from('contratos_v2')
            .delete()
            .eq('id', dupId);
            
        if (e2) console.log("Erro ao deletar contrato:", e2.message);
        else console.log(`Deletado contrato duplicado ${dupId}`);
    }
}
run();
