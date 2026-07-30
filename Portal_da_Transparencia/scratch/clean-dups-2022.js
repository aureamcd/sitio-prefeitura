const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const { S3Client, HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

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
    console.log("Iniciando exclusão de PDFs duplicados de 2022 (Priorizando a Pasta Local)...");
    
    const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('id, numero').eq('ano', 2022);
    const cIds = contratos.map(c => c.id);

    const { data: documentos } = await supabase.schema('transparencia')
        .from('contratos_documentos')
        .select('*')
        .in('contrato_id', cIds);

    const byContract = {};
    for (const doc of documentos) {
        if (!byContract[doc.contrato_id]) byContract[doc.contrato_id] = [];
        byContract[doc.contrato_id].push(doc);
    }

    let deletedCount = 0;

    for (const contractId of Object.keys(byContract)) {
        const docs = byContract[contractId];
        if (docs.length > 1) {
            
            // 1. Pegar tamanhos
            for (const doc of docs) {
                if (doc.caminho_r2) {
                    try {
                        const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: doc.caminho_r2 }));
                        doc.size = head.ContentLength;
                    } catch (e) {
                        doc.size = -1; 
                    }
                } else {
                    doc.size = -2;
                }
            }

            // 2. Agrupar por tamanho (apenas tamanhos válidos > 0)
            const bySize = {};
            for (const doc of docs) {
                if (doc.size > 0) {
                    if (!bySize[doc.size]) bySize[doc.size] = [];
                    bySize[doc.size].push(doc);
                }
            }

            // 3. Processar grupos de mesmo tamanho
            for (const size in bySize) {
                const dupGroup = bySize[size];
                if (dupGroup.length > 1) {
                    // ORDENAÇÃO CUSTOMIZADA PARA 2022: 
                    // Queremos priorizar (manter no topo = index 0) o arquivo cuja origem seja 'importacao-desktop-2022'
                    dupGroup.sort((a, b) => {
                        const aIsRecent = a.origem === 'importacao-desktop-2022';
                        const bIsRecent = b.origem === 'importacao-desktop-2022';
                        if (aIsRecent && !bIsRecent) return -1; // A ganha
                        if (!aIsRecent && bIsRecent) return 1;  // B ganha
                        // Se ambos forem iguais nesse critério, ordenar por ID
                        return a.id.localeCompare(b.id);
                    });
                    
                    const survivor = dupGroup[0];
                    const toDelete = dupGroup.slice(1);
                    
                    console.log(`\nLimpando contrato ${contractId} (Tamanho: ${size} bytes)`);
                    console.log(`  🟢 MANTENDO: ${survivor.nome_arquivo} (Origem: ${survivor.origem || 'Desconhecida'})`);

                    for (const docDel of toDelete) {
                        console.log(`  🔴 DELETANDO: ${docDel.nome_arquivo} (Origem: ${docDel.origem || 'Desconhecida'})`);
                        
                        const { error: dbErr } = await supabase.schema('transparencia')
                            .from('contratos_documentos')
                            .delete()
                            .eq('id', docDel.id);
                            
                        if (dbErr) {
                            console.error(`     Erro Supabase:`, dbErr.message);
                            continue;
                        }

                        try {
                            await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: docDel.caminho_r2 }));
                            console.log(`     -> R2 deletado com sucesso.`);
                            deletedCount++;
                        } catch (s3Err) {
                            console.error(`     Erro R2:`, s3Err.message);
                        }
                    }
                }
            }
        }
    }

    console.log(`\n============================`);
    console.log(`Total de Arquivos Duplicados Excluídos com Sucesso: ${deletedCount}`);
    console.log(`============================`);
}

run();
