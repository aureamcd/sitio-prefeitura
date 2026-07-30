const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const normalizeStr = (s) => s ? s.replace(/[^0-9A-Z]/gi, '').toUpperCase() : '';

async function run() {
    const { data: contratos, error } = await supabase.schema('transparencia')
        .from('contratos_v2')
        .select('*')
        .eq('ano', 2018);
        
    if (error) { console.error(error); return; }
    console.log(`\nExistem ${contratos.length} contratos no BD para 2018.`);

    const byNumber = {};
    for (const c of contratos) {
        if (!c.numero) continue;
        const norm = normalizeStr(c.numero);
        if (!byNumber[norm]) byNumber[norm] = [];
        byNumber[norm].push(c);
    }

    let dupsCount = 0;
    for (const norm in byNumber) {
        if (byNumber[norm].length > 1) {
            dupsCount++;
            console.log(`\nDuplicata de número: ${norm}`);
            byNumber[norm].forEach(c => {
                console.log(`  - ID: ${c.id} | Num: ${c.numero} | Valor: ${c.valor} | Contratado: ${c.contratado?.substring(0, 30)}`);
            });
        }
    }
    
    console.log(`\nTotal de grupos duplicados em 2018: ${dupsCount}`);
}
run();
