const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/º|°/g, '')
        .replace(/[^a-z0-9]/g, ''); // Removes spaces, hyphens, everything except letters and numbers
}

async function run() {
    console.log("Buscando todos os registros de documentos no BD...");
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_documentos').select('*').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        allDocs = allDocs.concat(data);
        offset += limit;
    }

    // Agrupar por contrato
    const byContract = {};
    for (const doc of allDocs) {
        if (!byContract[doc.contrato_id]) byContract[doc.contrato_id] = [];
        byContract[doc.contrato_id].push(doc);
    }

    let deletedCount = 0;

    for (const [contratoId, docs] of Object.entries(byContract)) {
        if (docs.length < 2) continue; // No duplicates possible
        
        // Agrupar por nome normalizado
        const byNormName = {};
        for (const doc of docs) {
            const norm = normalizeName(doc.nome_arquivo);
            if (!byNormName[norm]) byNormName[norm] = [];
            byNormName[norm].push(doc);
        }
        
        for (const [norm, group] of Object.entries(byNormName)) {
            if (group.length > 1) {
                // Encontramos uma repetição!
                // Vamos ordenar: preferimos manter o arquivo que tem nome padronizado sem caracteres estranhos
                // Ou o mais recente.
                group.sort((a, b) => {
                    // Preferir os que não tem espaços nem º
                    const aHasSpecial = /[^a-zA-Z0-9.\-]/.test(a.nome_arquivo);
                    const bHasSpecial = /[^a-zA-Z0-9.\-]/.test(b.nome_arquivo);
                    
                    if (aHasSpecial !== bHasSpecial) {
                        return aHasSpecial ? 1 : -1; // b is better (no special chars)
                    }
                    // Desempate: mais recente primeiro
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                
                const keep = group[0];
                const toDelete = group.slice(1);
                
                console.log(`\nCONTRATO ID: ${contratoId}`);
                console.log(`  [MANTER] ${keep.nome_arquivo} (${keep.tipo_documento}) - Origem: ${keep.origem}`);
                
                for (const del of toDelete) {
                    console.log(`  [APAGAR] ${del.nome_arquivo} (${del.tipo_documento}) - Origem: ${del.origem}`);
                    const { error } = await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', del.id);
                    if (!error) deletedCount++;
                }
            }
        }
    }
    
    console.log(`\n============================`);
    console.log(`Total de repetições (anexos idênticos no mesmo contrato) apagadas: ${deletedCount}`);
}

run();
