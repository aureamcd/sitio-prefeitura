const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

async function testUrl(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
}

async function getAllBucketObjects() {
    let objects = [];
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
        const cmd = new ListObjectsV2Command({
            Bucket: BUCKET,
            ContinuationToken: continuationToken,
        });
        const response = await s3.send(cmd);
        if (response.Contents) {
            objects = objects.concat(response.Contents.map(obj => obj.Key));
        }
        isTruncated = response.IsTruncated;
        continuationToken = response.NextContinuationToken;
    }
    return objects;
}

function normalizeForSearch(filename) {
    return filename.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function run() {
    console.log("Buscando todos os registros do BD...");
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_documentos').select('id, nome_arquivo, url_arquivo').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        allDocs = allDocs.concat(data);
        offset += limit;
    }

    console.log("Baixando lista de todos os arquivos no R2 Cloudflare...");
    const bucketKeys = await getAllBucketObjects();
    console.log(`Encontrados ${bucketKeys.length} arquivos reais no Bucket R2.\n`);

    console.log("Testando novamente todos os links para confirmar os quebrados...");
    let brokenDocs = [];
    for (const doc of allDocs) {
        if (!doc.url_arquivo) {
            brokenDocs.push(doc);
            continue;
        }
        const isOk = await testUrl(doc.url_arquivo);
        if (!isOk) {
            brokenDocs.push(doc);
        }
    }
    
    console.log(`\nForam confirmados ${brokenDocs.length} links quebrados.\n`);
    
    let recoveredCount = 0;
    let deletedCount = 0;

    for (const doc of brokenDocs) {
        const searchName = normalizeForSearch(doc.nome_arquivo.replace(/\.pdf$/i, ''));
        
        console.log(`Buscando alternativas para: ${doc.nome_arquivo}`);
        
        // Find best match in bucket
        let bestMatch = null;
        for (const key of bucketKeys) {
            const keyName = key.split('/').pop();
            const normKey = normalizeForSearch(keyName.replace(/\.pdf$/i, ''));
            
            // If the key in the bucket matches the exact normalized name of the broken link
            if (normKey === searchName || normKey.includes(searchName) || searchName.includes(normKey)) {
                // Ignore if it's too generic like just 'contrato'
                if (searchName.length > 8) {
                    bestMatch = key;
                    break;
                }
            }
        }
        
        if (bestMatch) {
            console.log(`  -> ENCONTRADO NO R2: ${bestMatch}`);
            const newUrl = `${PUBLIC_URL}/${bestMatch}`;
            const { error } = await supabase.schema('transparencia').from('contratos_documentos').update({
                caminho_r2: bestMatch,
                url_arquivo: newUrl
            }).eq('id', doc.id);
            
            if (error) {
                console.error(`  ❌ Erro ao atualizar BD:`, error.message);
            } else {
                console.log(`  ✅ Banco atualizado para usar o arquivo existente!`);
                recoveredCount++;
            }
        } else {
            console.log(`  -> NÃO EXISTE NO R2 DE FORMA ALGUMA. Apagando fantasma do banco...`);
            const { error } = await supabase.schema('transparencia').from('contratos_documentos').delete().eq('id', doc.id);
            if (error) {
                console.error(`  ❌ Erro ao deletar do BD:`, error.message);
            } else {
                console.log(`  🗑️ Deletado com sucesso.`);
                deletedCount++;
            }
        }
    }
    
    console.log(`\n=================================`);
    console.log(`RESUMO DA RECUPERAÇÃO`);
    console.log(`=================================`);
    console.log(`Links Quebrados Originais: ${brokenDocs.length}`);
    console.log(`Recuperados (Link Corrigido): ${recoveredCount}`);
    console.log(`Apagados (Fantasma Confirmado): ${deletedCount}`);
}

run();
