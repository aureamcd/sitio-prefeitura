const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const fs = require('fs');
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const folder = "C:\\Users\\Áurea Letícia\\Desktop\\contratos\\Contratos\\2017";

const normalizeStr = (s) => s.replace(/[^0-9A-Z]/gi, '').toUpperCase();

async function run() {
    const { data: contratos, error } = await supabase.schema('transparencia').from('contratos_v2').select('numero, processo').eq('ano', 2017);
    if (error) { console.log(error); return; }

    const files = fs.readdirSync(folder).filter(f => f.endsWith('.pdf'));
    
    console.log(`Existem ${contratos.length} contratos no BD para 2017.`);
    console.log(`Existem ${files.length} PDFs na pasta 2017.`);

    const dbNumeros = contratos.map(c => c.numero).filter(Boolean);
    console.log("\nAlguns números no BD:", dbNumeros.slice(0, 10));

    let orphans = [];
    for (const file of files) {
        const fn = file.toUpperCase();
        const regex1 = /CONTRATO(?:S)?\s+(?:ADM(?:INISTRATIVO)?\s+)?(?:N[º°]?\s*)?([0-9A-Z\-\/]+)/;
        const match = fn.match(regex1);
        if (match) {
            const num = match[1].replace('.PDF', '').trim().replace(/[-\/]$/, '');
            const normalized = normalizeStr(num);
            const found = contratos.find(c => c.numero && normalizeStr(c.numero) === normalized);
            if (!found) orphans.push({ file, num, normalized });
        } else {
            orphans.push({ file, num: "N/A", normalized: "N/A" });
        }
    }

    console.log(`\nArquivos que NÃO tem correspondência no BD (${orphans.length}):`);
    for (let i = 0; i < Math.min(20, orphans.length); i++) {
        console.log(`  File: ${orphans[i].file} -> extracted: ${orphans[i].num} -> norm: ${orphans[i].normalized}`);
    }
}
run();
