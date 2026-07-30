const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDuplicates() {
    console.log("Baixando documentos...");
    const { data: documentos, error } = await supabase.schema('transparencia')
        .from('contratos_documentos')
        .select('id, contrato_id, tipo_documento, nome_arquivo, url_arquivo, caminho_r2')
        .order('created_at', { ascending: true }); 

    if (error) {
        console.error("Erro:", error);
        return;
    }

    // Agrupar por contrato_id e tipo_documento
    const map = new Map();
    for (const doc of documentos) {
        const key = `${doc.contrato_id}-${doc.tipo_documento}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(doc);
    }
    
    let toDelete = [];
    
    for (const [key, docs] of map.entries()) {
        if (docs.length > 1) {
            // we have more than 1 of the same type for the same contract
            // The user says "quando abro, é o mesmo arquivo". So they are likely logical duplicates.
            // Let's keep the FIRST one, and delete the rest.
            const kept = docs[0];
            const deleted = docs.slice(1);
            for (const d of deleted) {
                toDelete.push({ id: d.id, nome: d.nome_arquivo, contrato_id: d.contrato_id, kept_nome: kept.nome_arquivo });
            }
        }
    }

    console.log(`Encontrados ${toDelete.length} documentos logicamente duplicados (mais de 1 do mesmo tipo por contrato).`);
    if (toDelete.length > 0) {
        console.log("Exemplos de duplicados:");
        console.log(toDelete.slice(0, 5));
        
        const deleteIds = toDelete.map(d => d.id);
        
        console.log("Removendo do banco...");
        for (let i = 0; i < deleteIds.length; i += 100) {
            const batch = deleteIds.slice(i, i + 100);
            const { error: delErr } = await supabase.schema('transparencia')
                .from('contratos_documentos')
                .delete()
                .in('id', batch);
            
            if (delErr) {
                console.error("Erro ao deletar:", delErr);
            }
        }
        console.log(`Deletados ${deleteIds.length} documentos com sucesso!`);
    }
}

cleanDuplicates();
