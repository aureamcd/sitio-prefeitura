const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getFileSize(url) {
    if (!url) return 0;
    try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
            const size = response.headers.get('content-length');
            return size ? parseInt(size, 10) : 0;
        }
    } catch (e) {}
    return 0;
}

const typePriority = {
    'Contrato Original': 1,
    'Contrato': 2,
    'Contrato Administrativo': 3,
    'Termo Aditivo': 4,
    'Aditivo': 5,
    'Extrato': 6,
    'Anexo': 7,
    'Outros': 8
};

function getPriority(tipo) {
    return typePriority[tipo] || 99;
}

async function run() {
    console.log("Baixando documentos do banco de dados...");
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_documentos').select('*').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        allDocs = allDocs.concat(data);
        offset += limit;
    }
    
    // Get contract numbers for display
    const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero');
    const contractMap = {};
    for (const c of contratos) contractMap[c.id] = c.numero;

    const byContract = {};
    for (const doc of allDocs) {
        if (!byContract[doc.contrato_id]) byContract[doc.contrato_id] = [];
        byContract[doc.contrato_id].push(doc);
    }

    let deletedCount = 0;

    for (const [contratoId, docs] of Object.entries(byContract)) {
        if (docs.length < 2) continue;
        
        // Fetch sizes for all docs in this contract
        for (const doc of docs) {
            doc.sizeBytes = await getFileSize(doc.url_arquivo);
        }
        
        // Group by EXACT file size
        const bySize = {};
        for (const doc of docs) {
            if (doc.sizeBytes === 0) continue; // Skip failed requests
            if (!bySize[doc.sizeBytes]) bySize[doc.sizeBytes] = [];
            bySize[doc.sizeBytes].push(doc);
        }
        
        for (const [size, group] of Object.entries(bySize)) {
            if (group.length > 1) {
                // Encontramos arquivos com o EXATO mesmo tamanho no mesmo contrato!
                // São o mesmo arquivo upado repetidas vezes.
                
                // Vamos ordenar para manter o "melhor"
                group.sort((a, b) => {
                    // 1. Prioridade do Tipo de Documento (Contrato Original > Anexo)
                    const pA = getPriority(a.tipo_documento);
                    const pB = getPriority(b.tipo_documento);
                    if (pA !== pB) return pA - pB;
                    
                    // 2. Prioridade de nome limpo (sem caracteres especiais/espaços)
                    const aHasSpecial = /[^a-zA-Z0-9.\-]/.test(a.nome_arquivo);
                    const bHasSpecial = /[^a-zA-Z0-9.\-]/.test(b.nome_arquivo);
                    if (aHasSpecial !== bHasSpecial) return aHasSpecial ? 1 : -1;
                    
                    // 3. Mais recente
                    return new Date(b.created_at) - new Date(a.created_at);
                });
                
                const keep = group[0];
                const toDelete = group.slice(1);
                
                console.log(`\nCONTRATO ID: ${contractMap[contratoId]}`);
                console.log(`  [MANTER] ${keep.nome_arquivo} (${keep.tipo_documento}) - Tamanho: ${keep.sizeBytes} bytes`);
                
                for (const del of toDelete) {
                    console.log(`  [APAGAR] ${del.nome_arquivo} (${del.tipo_documento}) - Tamanho: ${del.sizeBytes} bytes`);
                    const { error } = await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', del.id);
                    if (!error) deletedCount++;
                }
            }
        }
    }
    
    console.log(`\n============================`);
    console.log(`Total de repetições exatas (mesmo tamanho em bytes) apagadas: ${deletedCount}`);
}

run();
