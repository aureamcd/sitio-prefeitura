const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Baixando documentos do banco de dados...");
    
    const { data: documentos, error } = await supabase.schema('transparencia')
        .from('contratos_documentos')
        .select('id, contrato_id, nome_arquivo, url_arquivo, tipo_documento')
        .order('contrato_id');

    if (error) { console.error(error); return; }

    console.log(`Existem ${documentos.length} anexos no portal.`);

    // Agrupar por contrato
    const byContract = {};
    for (const doc of documentos) {
        if (!byContract[doc.contrato_id]) byContract[doc.contrato_id] = [];
        byContract[doc.contrato_id].push(doc);
    }

    let duplicateNamesCount = 0;
    let possibleDuplicateContents = 0;

    for (const contractId in byContract) {
        const docs = byContract[contractId];
        if (docs.length > 1) {
            // Verificar nomes exatos primeiro (ignorando case)
            const names = new Set();
            for (const doc of docs) {
                const normName = doc.nome_arquivo.toUpperCase().trim();
                if (names.has(normName)) {
                    duplicateNamesCount++;
                }
                names.add(normName);
            }
            
            // Verificar por nomes parecidos: "CONTRATO 044.pdf" vs "CONTRATO 044 (1).pdf"
            for (let i = 0; i < docs.length; i++) {
                for (let j = i + 1; j < docs.length; j++) {
                    const n1 = docs[i].nome_arquivo.toUpperCase().replace('.PDF', '');
                    const n2 = docs[j].nome_arquivo.toUpperCase().replace('.PDF', '');
                    if (n1.startsWith(n2) || n2.startsWith(n1)) {
                        // Muito provável de ser duplicata de conteúdo renomeada
                        possibleDuplicateContents++;
                        console.log(`Possível Duplicata no contrato ${contractId}: [${docs[i].nome_arquivo}] vs [${docs[j].nome_arquivo}]`);
                        break;
                    }
                }
            }
        }
    }

    console.log(`\nAnexos com nomes EXATAMENTE iguais no mesmo contrato: ${duplicateNamesCount}`);
    console.log(`Anexos com nomes PARECIDOS no mesmo contrato (ex: arquivo e arquivo(1)): ${possibleDuplicateContents}`);
}

run();
