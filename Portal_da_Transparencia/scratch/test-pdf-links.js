const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok; // true if HTTP status is 200-299
    } catch (e) {
        return false;
    }
}

async function run() {
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data, error } = await supabase.schema('transparencia').from('contratos_documentos').select('id, contrato_id, nome_arquivo, url_arquivo').range(offset, offset + limit - 1);
        if (error) {
            console.error("Erro fetch DB:", error);
            return;
        }
        if (!data || data.length === 0) break;
        allDocs = allDocs.concat(data);
        offset += limit;
    }

    console.log(`Analisando ${allDocs.length} documentos registrados no banco de dados...\n`);

    // 1. CHECAR REPETIÇÕES (Duplicatas)
    console.log(`--- VERIFICANDO REPETIÇÕES NO BANCO ---`);
    const urlsCount = {};
    const contractDocsCount = {};
    let dbDuplicatesCount = 0;

    for (const doc of allDocs) {
        if (!doc.url_arquivo) continue;
        
        // Verifica URLs repetidas globalmente
        if (!urlsCount[doc.url_arquivo]) urlsCount[doc.url_arquivo] = [];
        urlsCount[doc.url_arquivo].push(doc.id);
        
        // Verifica arquivos com o mesmo nome dentro do MESMO contrato
        const key = `${doc.contrato_id}-${doc.nome_arquivo}`;
        if (!contractDocsCount[key]) contractDocsCount[key] = [];
        contractDocsCount[key].push(doc.id);
    }

    for (const [url, ids] of Object.entries(urlsCount)) {
        if (ids.length > 1) {
            console.log(`⚠️ URL repetida ${ids.length} vezes: ${url}`);
            dbDuplicatesCount += (ids.length - 1);
        }
    }
    
    for (const [key, ids] of Object.entries(contractDocsCount)) {
        if (ids.length > 1) {
            console.log(`⚠️ Nome de arquivo repetido no mesmo contrato (IDs: ${ids.join(', ')}): ${key.split('-').slice(1).join('-')}`);
        }
    }
    console.log(`Total de URLs repetidas no banco: ${dbDuplicatesCount}\n`);

    // 2. TESTAR LINKS (Acessibilidade)
    console.log(`--- TESTANDO TODOS OS LINKS ONLINE (Isso pode levar um minuto) ---`);
    let brokenLinks = [];
    let checked = 0;

    // Test in batches of 50 concurrent requests
    const batchSize = 50;
    for (let i = 0; i < allDocs.length; i += batchSize) {
        const batch = allDocs.slice(i, i + batchSize);
        
        const promises = batch.map(async (doc) => {
            if (!doc.url_arquivo) {
                brokenLinks.push({ id: doc.id, nome: doc.nome_arquivo, erro: 'URL Vazia' });
                return;
            }
            const isOk = await testUrl(doc.url_arquivo);
            if (!isOk) {
                brokenLinks.push({ id: doc.id, url: doc.url_arquivo, nome: doc.nome_arquivo });
            }
        });
        
        await Promise.all(promises);
        checked += batch.length;
        process.stdout.write(`Progresso: ${checked}/${allDocs.length}\r`);
    }

    console.log(`\n\n============================`);
    console.log(`RESULTADO DO TESTE DE LINKS`);
    console.log(`============================`);
    console.log(`Total checado: ${checked}`);
    console.log(`Links FUNCIONANDO: ${checked - brokenLinks.length}`);
    console.log(`Links QUEBRADOS: ${brokenLinks.length}`);
    
    if (brokenLinks.length > 0) {
        console.log(`\nExemplos de links quebrados (ERRO 404 - Não Encontrado):`);
        for (let i = 0; i < Math.min(10, brokenLinks.length); i++) {
            console.log(`- ${brokenLinks[i].nome} -> ${brokenLinks[i].url}`);
        }
    }
}

run();
