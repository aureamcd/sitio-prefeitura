const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDb() {
    const { data: contratos, error: err1 } = await supabase.from('contratos').select('*').limit(1);
    const { data: docs, error: err2 } = await supabase.from('documentos_contratos').select('*').limit(1);
    
    console.log("Contratos schema:");
    if(contratos && contratos.length > 0) {
        console.log(Object.keys(contratos[0]).join(', '));
        console.log("Sample:", contratos[0]);
    }
    
    console.log("\nDocumentos schema:");
    if(docs && docs.length > 0) {
        console.log(Object.keys(docs[0]).join(', '));
        console.log("Sample:", docs[0]);
    }
    
    const { count, error: err3 } = await supabase.from('contratos').select('*', { count: 'exact', head: true });
    console.log(`\nTotal contratos: ${count}`);
}

inspectDb();
