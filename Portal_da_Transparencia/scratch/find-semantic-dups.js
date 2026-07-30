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

function parseSemanticType(doc) {
    const name = doc.nome_arquivo.toUpperCase();
    const tipo = (doc.tipo_documento || '').toUpperCase();
    
    // Check for Aditivos
    const aditivoMatch = name.match(/([0-9]+)[º°]?\s*(?:TERMO\s*)?ADITIVO/i) || tipo.match(/([0-9]+)[º°]?\s*(?:TERMO\s*)?ADITIVO/i);
    if (aditivoMatch) return `${aditivoMatch[1]}º ADITIVO`;
    if (name.includes('ADITIVO') || tipo.includes('ADITIVO')) return '1º ADITIVO'; // Assume 1st if not specified
    
    // Check for Apostilamento
    const apostMatch = name.match(/([0-9]+)[º°]?\s*(?:TERMO\s*)?APOSTILAMENTO/i) || tipo.match(/([0-9]+)[º°]?\s*(?:TERMO\s*)?APOSTILAMENTO/i);
    if (apostMatch) return `${apostMatch[1]}º APOSTILAMENTO`;
    if (name.includes('APOSTILA') || tipo.includes('APOSTILA')) return '1º APOSTILAMENTO';
    
    // Rescisão
    if (name.includes('RESCIS') || name.includes('DISTRATO') || tipo.includes('RESCIS')) return 'RESCISAO';
    
    // Extrato
    if (name.includes('EXTRATO') && !name.includes('CONTRATO')) return 'EXTRATO';
    
    // Default to Main Contract
    return 'CONTRATO PRINCIPAL';
}

async function run() {
    console.log("Baixando documentos do banco de dados...");
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_documentos').select('id, contrato_id, nome_arquivo, tipo_documento, url_arquivo').range(offset, offset + limit - 1);
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

    let repetitionGroupsFound = 0;

    for (const [contratoId, docs] of Object.entries(byContract)) {
        if (docs.length < 2) continue;
        
        const bySemantic = {};
        for (const doc of docs) {
            const sem = parseSemanticType(doc);
            if (!bySemantic[sem]) bySemantic[sem] = [];
            bySemantic[sem].push(doc);
        }
        
        for (const [semType, group] of Object.entries(bySemantic)) {
            if (group.length > 1) {
                // Fetch sizes concurrently for the group
                for (const doc of group) {
                    doc.sizeBytes = await getFileSize(doc.url_arquivo);
                    doc.sizeMB = (doc.sizeBytes / (1024 * 1024)).toFixed(2) + ' MB';
                }
                
                repetitionGroupsFound++;
                console.log(`\n⚠️ CONTRATO: ${contractMap[contratoId]} | Tipo repetido: [${semType}]`);
                for (const doc of group) {
                    console.log(`   - ${doc.nome_arquivo} (${doc.sizeMB})`);
                }
            }
        }
    }
    
    console.log(`\n================================`);
    console.log(`Total de grupos com repetição semântica: ${repetitionGroupsFound}`);
}

run();
