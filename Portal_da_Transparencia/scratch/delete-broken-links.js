const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function run() {
    console.log("Buscando todos os registros do BD...");
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_documentos').select('*').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        allDocs = allDocs.concat(data);
        offset += limit;
    }

    console.log("Testando links para achar os 19 originais da migração...");
    let countDeleted = 0;

    // Test in batches
    const batchSize = 50;
    for (let i = 0; i < allDocs.length; i += batchSize) {
        const batch = allDocs.slice(i, i + batchSize);
        
        const promises = batch.map(async (doc) => {
            // We know they are from MIGRACAO_PROJECT_BACKUP or the ones we accidentally messed up with the fuzzy match
            // So we'll test ALL of them just to be safe. If it's a 404 and it's from the old migration, we delete.
            // Also if it's pointing to that 'CONTRATO.pdf' or directory key which might not be 404 but is a false positive we created:
            if (doc.caminho_r2 === 'concursos/2023/' || doc.caminho_r2 === 'backup contratos/Contratos-20260701T105817Z-3-001/Contratos/CONTRATO.pdf') {
                if (doc.origem === 'MIGRACAO_PROJECT_BACKUP') {
                     await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', doc.id);
                     countDeleted++;
                     console.log(`Deletado falso-positivo: ${doc.nome_arquivo}`);
                }
                return;
            }

            if (!doc.url_arquivo) return;
            
            const isOk = await testUrl(doc.url_arquivo);
            if (!isOk && doc.origem === 'MIGRACAO_PROJECT_BACKUP') {
                const { error } = await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', doc.id);
                if (!error) {
                    countDeleted++;
                    console.log(`Deletado link quebrado: ${doc.nome_arquivo}`);
                }
            }
        });
        
        await Promise.all(promises);
    }
    
    console.log(`\nTotal de links fantasmas deletados com sucesso: ${countDeleted}`);
}

run();
