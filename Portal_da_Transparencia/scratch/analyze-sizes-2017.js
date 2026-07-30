const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");

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

async function run() {
    console.log("Analisando PDFs duplicados de 2017...");
    
    // Pegar contratos de 2017
    const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero').eq('ano', 2017);
    const cIds = contratos.map(c => c.id);

    // Pegar documentos desses contratos
    const { data: documentos } = await supabase.schema('transparencia')
        .from('contratos_documentos')
        .select('*')
        .in('contrato_id', cIds);

    const byContract = {};
    for (const doc of documentos) {
        if (!byContract[doc.contrato_id]) byContract[doc.contrato_id] = [];
        byContract[doc.contrato_id].push(doc);
    }

    let exactDups = 0;

    for (const contractId of Object.keys(byContract)) {
        const docs = byContract[contractId];
        if (docs.length > 1) {
            // Pegar tamanho de cada arquivo no R2
            for (const doc of docs) {
                if (doc.caminho_r2) {
                    try {
                        const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: doc.caminho_r2 }));
                        doc.size = head.ContentLength;
                    } catch (e) {
                        doc.size = -1; // Erro ao ler
                    }
                }
            }

            // Comparar tamanhos
            for (let i = 0; i < docs.length; i++) {
                for (let j = i + 1; j < docs.length; j++) {
                    const d1 = docs[i];
                    const d2 = docs[j];
                    if (d1.size && d1.size === d2.size && d1.size > 0) {
                        console.log(`\nDUPLICATA REAL ENCONTRADA (Contrato ID: ${contractId})`);
                        console.log(`  File 1: ${d1.nome_arquivo} (${d1.size} bytes)`);
                        console.log(`  File 2: ${d2.nome_arquivo} (${d2.size} bytes)`);
                        exactDups++;
                    } else if (d1.nome_arquivo.toUpperCase() === d2.nome_arquivo.toUpperCase()) {
                        console.log(`\nMESMO NOME MAS TAMANHO DIFERENTE? (Contrato ID: ${contractId})`);
                        console.log(`  File 1: ${d1.nome_arquivo} (${d1.size} bytes)`);
                        console.log(`  File 2: ${d2.nome_arquivo} (${d2.size} bytes)`);
                    }
                }
            }
        }
    }

    console.log(`\nTotal de duplicatas idênticas (mesmo tamanho em bytes) em 2017: ${exactDups}`);
}

run();
