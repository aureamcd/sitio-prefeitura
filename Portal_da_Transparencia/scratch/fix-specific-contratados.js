const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
    const corrections = [
        { find: 'VALQUÃRIA DA CONCEIÇÃO SILVA', replace: 'VALQUÍRIA DA CONCEIÇÃO SILVA' },
        { find: 'VALQUÃRIA DA CONCEIÃÃÃ SILVA', replace: 'VALQUÍRIA DA CONCEIÇÃO SILVA' },
        { find: 'ELITÃNIA MARIA CONCEIÇÃO', replace: 'ELITÂNIA MARIA CONCEIÇÃO' },
        { find: 'ELITÃNIA MARIA CONCEIÃÃÃ', replace: 'ELITÂNIA MARIA CONCEIÇÃO' },
        { find: 'ANA FLÃVIA CONCEIÇÃO SOUSA MACÃDO', replace: 'ANA FLÁVIA CONCEIÇÃO SOUSA MACÊDO' },
        { find: 'GILSON JOÃO DE CARVALHO', replace: 'GILSON JOÃO DE CARVALHO' } // if it's JOÃO
    ];
    
    const { data: dbData } = await supabase.schema('transparencia').from('contratos_v2').select('id, contratado');
    
    let count = 0;
    for (const row of dbData) {
        if (!row.contratado) continue;
        
        let newName = row.contratado;
        
        // Let's just fix the specific words regardless of the full string to be safe
        newName = newName.replace(/VALQUÃRIA/g, 'VALQUÍRIA');
        newName = newName.replace(/VALQURIA/g, 'VALQUÍRIA');
        newName = newName.replace(/ELITÃNIA/g, 'ELITÂNIA');
        newName = newName.replace(/ELITNIA/g, 'ELITÂNIA');
        newName = newName.replace(/FLÃVIA/g, 'FLÁVIA');
        newName = newName.replace(/MACÃDO/g, 'MACÊDO');
        newName = newName.replace(/JOÃÃ/g, 'JOÃO'); // just in case
        newName = newName.replace(/CONCEIÃÃÃ/g, 'CONCEIÇÃO');
        newName = newName.replace(/CONCEIÃÃ/g, 'CONCEIÇÃO');
        
        if (newName !== row.contratado) {
            console.log(`Fixing: ${row.contratado} -> ${newName}`);
            await supabase.schema('transparencia').from('contratos_v2').update({ contratado: newName }).eq('id', row.id);
            count++;
        }
    }
    
    console.log(`Corrigidos manualmente ${count} contratados.`);
}

fix();
