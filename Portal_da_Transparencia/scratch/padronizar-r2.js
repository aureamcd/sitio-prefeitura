const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, CopyObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

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

function standardizeName(filename) {
    let name = filename.toLowerCase();
    name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    name = name.replace(/[\s_]+/g, '-');
    name = name.replace(/[^a-z0-9\-.]/g, '');
    name = name.replace(/-+/g, '-');
    name = name.replace(/-\./g, '.');
    return name;
}

async function run() {
    let offset = 0;
    const limit = 1000;
    let allDocs = [];
    while (true) {
        const { data, error } = await supabase.schema('transparencia').from('contratos_documentos').select('id, caminho_r2, nome_arquivo').range(offset, offset + limit - 1);
        if (error) {
            console.error("Erro fetch DB:", error);
            return;
        }
        if (!data || data.length === 0) break;
        allDocs = allDocs.concat(data);
        offset += limit;
    }

    console.log(`Encontrados ${allDocs.length} documentos.`);
    
    let padronizados = 0;
    let erros = 0;
    
    const existingPaths = new Set(allDocs.map(d => d.caminho_r2));

    for (const doc of allDocs) {
        if (!doc.caminho_r2 || !doc.nome_arquivo) continue;
        
        const folderPath = doc.caminho_r2.substring(0, doc.caminho_r2.lastIndexOf('/') + 1);
        const originalFileName = doc.caminho_r2.substring(doc.caminho_r2.lastIndexOf('/') + 1);
        
        let standardizedFileName = standardizeName(doc.nome_arquivo);
        let newR2Key = `${folderPath}${standardizedFileName}`;
        
        if (doc.caminho_r2 === newR2Key) {
            continue;
        }

        // Deal with duplicates
        let counter = 1;
        while (existingPaths.has(newR2Key)) {
            const extMatch = standardizedFileName.match(/(\.[^.]+)$/);
            const ext = extMatch ? extMatch[1] : '';
            const base = extMatch ? standardizedFileName.slice(0, -ext.length) : standardizedFileName;
            standardizedFileName = `${base}-v${counter}${ext}`;
            newR2Key = `${folderPath}${standardizedFileName}`;
            counter++;
        }

        console.log(`\nPadronizando: [${originalFileName}] -> [${standardizedFileName}]`);
        
        try {
            const copySource = encodeURI(`${BUCKET}/${doc.caminho_r2}`);
            
            await s3.send(
                new CopyObjectCommand({
                    Bucket: BUCKET,
                    CopySource: copySource,
                    Key: newR2Key,
                    ContentType: "application/pdf"
                })
            );
            
            const urlArquivo = `${PUBLIC_URL}/${newR2Key}`;
            const { error: updateErr } = await supabase.schema('transparencia').from('contratos_documentos').update({
                caminho_r2: newR2Key,
                nome_arquivo: standardizedFileName,
                url_arquivo: urlArquivo
            }).eq('id', doc.id);
            
            if (updateErr) {
                console.error(`Erro ao atualizar DB para ${doc.id}:`, updateErr.message);
                erros++;
                continue;
            }
            
            await s3.send(
                new DeleteObjectCommand({
                    Bucket: BUCKET,
                    Key: doc.caminho_r2
                })
            );
            
            existingPaths.add(newR2Key);
            existingPaths.delete(doc.caminho_r2);
            
            console.log(`✅ Sucesso!`);
            padronizados++;
        } catch (err) {
            console.error(`❌ Erro no R2 para ${originalFileName}:`, err.message);
            erros++;
        }
    }
    
    console.log(`\n============================`);
    console.log(`RESUMO DA PADRONIZAÇÃO R2`);
    console.log(`============================`);
    console.log(`Total documentos processados: ${allDocs.length}`);
    console.log(`Arquivos renomeados: ${padronizados}`);
    console.log(`Erros: ${erros}`);
}

run();
