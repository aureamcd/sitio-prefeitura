const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function determineSemanticType(filename, tipoDocumento) {
    const fn = (filename || '').toLowerCase();
    const tp = (tipoDocumento || '').toLowerCase();
    
    if (fn.includes('sexto') || fn.includes('6º') || fn.includes('6-termo')) return '6º Termo Aditivo';
    if (fn.includes('quinto') || fn.includes('5º') || fn.includes('5-termo')) return '5º Termo Aditivo';
    if (fn.includes('quarto') || fn.includes('4º') || fn.includes('4-termo')) return '4º Termo Aditivo';
    if (fn.includes('terceiro') || fn.includes('3º') || fn.includes('3-termo')) return '3º Termo Aditivo';
    if (fn.includes('segundo') || fn.includes('2º') || fn.includes('2-termo')) return '2º Termo Aditivo';
    if (fn.includes('primeiro') || fn.includes('1º') || fn.includes('1-termo') || tp.includes('primeiro')) return '1º Termo Aditivo';
    if (fn.includes('aditivo') || tp.includes('aditivo')) return '1º Termo Aditivo'; // Default aditivo

    if (fn.includes('distrato') || tp.includes('distrato') || fn.includes('rescis') || tp.includes('rescis')) return 'Distrato/Rescisão';
    
    return 'Contrato Principal'; // Tudo que não é aditivo/distrato entra na mesma cesta para manter apenas 1
}

function calculateScore(filename) {
    let score = 0;
    const fn = (filename || '').toLowerCase();
    
    // Punish generic names or extra stuff
    if (fn.includes('extrato')) score -= 10;
    if (fn.includes('anexo')) score -= 10;
    if (fn.includes('publicacao') || fn.includes('publicação')) score -= 10;
    
    // Reward proper normalized names
    if (/^contrato-(n-)?[0-9]{3}-202[0-9]\.pdf$/.test(fn)) score += 20;
    if (/^contrato-n-[0-9]{3}-202[0-9]\.pdf$/.test(fn)) score += 30; // Very clean
    if (/^[0-9]-termo-aditivo-ao-contrato/.test(fn)) score += 20;

    return score;
}

async function run() {
    let offset = 0;
    const limit = 1000;
    let contratos = [];
    
    console.log("Buscando contratos...");
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        contratos = contratos.concat(data);
        offset += limit;
    }
    
    let docs = [];
    console.log("Buscando documentos...");
    let docsOffset = 0;
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_documentos').select('*').range(docsOffset, docsOffset + limit - 1);
        if (!data || data.length === 0) break;
        docs = docs.concat(data);
        docsOffset += limit;
    }

    const docsByContrato = {};
    for (const d of docs) {
        if (!docsByContrato[d.contrato_id]) docsByContrato[d.contrato_id] = [];
        docsByContrato[d.contrato_id].push(d);
    }
    
    console.log(`Verificando documentos para ${contratos.length} contratos...`);
    
    let toDelete = [];
    
    for (const c of contratos) {
        const contractDocs = docsByContrato[c.id];
        
        if (!contractDocs || contractDocs.length <= 1) continue;
        
        const semanticGroups = {};
        for (const d of contractDocs) {
            const semType = determineSemanticType(d.nome_arquivo, d.tipo_documento);
            if (!semanticGroups[semType]) semanticGroups[semType] = [];
            semanticGroups[semType].push(d);
        }
        
        for (const [type, groupDocs] of Object.entries(semanticGroups)) {
            if (groupDocs.length > 1) {
                // We have multiple docs serving the same semantic role!
                // Prioritize keeping the one with the best filename
                groupDocs.sort((a, b) => calculateScore(b.nome_arquivo) - calculateScore(a.nome_arquivo));
                
                const bestDoc = groupDocs[0];
                const ghosts = groupDocs.slice(1);
                
                console.log(`\nCONTRATO ID: ${c.numero} - SEMÂNTICA: ${type}`);
                console.log(`  🟢 [MANTER] ${bestDoc.nome_arquivo} (Score: ${calculateScore(bestDoc.nome_arquivo)})`);
                for (const g of ghosts) {
                    console.log(`  🔴 [APAGAR] ${g.nome_arquivo} (Score: ${calculateScore(g.nome_arquivo)})`);
                    toDelete.push(g.id);
                }
            }
        }
    }
    
    console.log(`\n============================`);
    console.log(`Encontrados ${toDelete.length} documentos repetidos semanticamente (ex: 2 contratos originais ou 2 extratos para o mesmo contrato).`);
    
    if (toDelete.length > 0) {
        // Execute deletion
        console.log(`Deletando documentos...`);
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            await supabase.schema('transparencia').from('contratos_documentos').delete().in('id', batch);
        }
        console.log(`Deleção concluída!`);
    } else {
        console.log("Nenhum documento semântico duplicado encontrado.");
    }
}

run().catch(console.error);
