const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatField(text) {
    if (!text) return text;
    return text.toUpperCase().replace(/\s+/g, ' ').trim();
}

async function run() {
    let offset = 0;
    const limit = 1000;
    let allRecords = [];
    while (true) {
        const { data, error } = await supabase.schema('transparencia').from('contratos_v2').select('id, contratado, objeto').range(offset, offset + limit - 1);
        if (error) {
            console.error("Erro fetch DB:", error);
            return;
        }
        if (!data || data.length === 0) break;
        allRecords = allRecords.concat(data);
        offset += limit;
    }

    console.log(`Verificando ${allRecords.length} contratos...`);
    
    let atualizados = 0;
    
    for (const record of allRecords) {
        let changed = false;
        const updates = {};
        
        if (record.contratado) {
            const formatted = formatField(record.contratado);
            if (formatted !== record.contratado) {
                updates.contratado = formatted;
                changed = true;
            }
        }
        
        if (record.objeto) {
            const formatted = formatField(record.objeto);
            if (formatted !== record.objeto) {
                updates.objeto = formatted;
                changed = true;
            }
        }
        
        if (changed) {
            const { error } = await supabase.schema('transparencia').from('contratos_v2').update(updates).eq('id', record.id);
            if (!error) {
                atualizados++;
            } else {
                console.error(`Erro ao atualizar ID ${record.id}:`, error.message);
            }
        }
    }
    
    console.log(`\n============================`);
    console.log(`RESUMO DA PADRONIZAÇÃO DB`);
    console.log(`============================`);
    console.log(`Registros formatados (MAIÚSCULAS/espaços): ${atualizados} de ${allRecords.length}`);
}

run();
