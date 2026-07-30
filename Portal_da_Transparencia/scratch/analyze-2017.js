const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Analisando contratos de 2017...");
    const { data, error } = await supabase.schema('transparencia').from('contratos_v2').select('*').eq('ano', 2017);
    if (error) {
        console.error("Erro:", error);
        return;
    }

    console.log(`Encontrados ${data.length} contratos em 2017.`);
    
    // Check for encoding errors
    const withEncodingErrors = data.filter(c => c.objeto && c.objeto.includes('Ã'));
    console.log(`Contratos com erro de codificação (ex: Ã§Ã£o): ${withEncodingErrors.length}`);

    // Check for duplicates
    const byNumber = {};
    for (const c of data) {
        if (!c.numero) continue;
        const normalized = c.numero.replace('/2017', '').replace('/17', '').trim().padStart(3, '0');
        if (!byNumber[normalized]) byNumber[normalized] = [];
        byNumber[normalized].push(c);
    }

    let duplicateCount = 0;
    for (const num in byNumber) {
        if (byNumber[num].length > 1) {
            duplicateCount++;
            console.log(`\nDuplicata encontrada para o número ${num}:`);
            for (const c of byNumber[num]) {
                console.log(`  - ID: ${c.id} | Numero: ${c.numero} | Valor: ${c.valor} | Objeto: ${c.objeto?.substring(0, 50)}...`);
            }
        }
    }

    console.log(`\nTotal de grupos duplicados: ${duplicateCount}`);
}

run();
