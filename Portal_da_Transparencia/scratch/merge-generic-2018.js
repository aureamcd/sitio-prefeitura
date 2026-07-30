const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: contratos } = await supabase.schema('transparencia').from('contratos_v2').select('*').eq('ano', 2018);
    
    // Separar genéricos (valor = 0) dos reais (valor > 0)
    const generic = contratos.filter(c => c.valor === 0 || c.valor === '0.00' || c.valor === '0');
    const reals = contratos.filter(c => c.valor > 0);

    console.log(`Genéricos encontrados: ${generic.length}`);
    console.log(`Reais encontrados: ${reals.length}`);

    let mergedCount = 0;

    for (const g of generic) {
        if (!g.numero) continue;
        
        // Pega o número base. ex: "062/2018" -> "062"
        const baseNumMatch = g.numero.match(/^0*([1-9][0-9]*)/); 
        if (!baseNumMatch) continue;
        
        const baseNum = baseNumMatch[1]; // "62"
        
        // Procurar o real que corresponde
        const real = reals.find(r => {
            if (!r.numero) return false;
            const rBaseMatch = r.numero.match(/^0*([1-9][0-9]*)/);
            if (!rBaseMatch) return false;
            return rBaseMatch[1] === baseNum;
        });

        if (real) {
            console.log(`\nMesclando:`);
            console.log(`  Genérico (Id: ${g.id}) -> ${g.numero} | Objeto: ${g.objeto?.substring(0,30)}`);
            console.log(`  Real     (Id: ${real.id}) -> ${real.numero} | Valor: ${real.valor}`);
            
            // 1. Mover anexos
            const { error: moveErr } = await supabase.schema('transparencia')
                .from('contratos_documentos')
                .update({ contrato_id: real.id })
                .eq('contrato_id', g.id);
                
            if (moveErr) {
                console.error("  Erro ao mover anexos:", moveErr.message);
                continue;
            }
            
            // 2. Deletar genérico
            const { error: delErr } = await supabase.schema('transparencia')
                .from('contratos_v2')
                .delete()
                .eq('id', g.id);
                
            if (delErr) {
                console.error("  Erro ao deletar:", delErr.message);
            } else {
                console.log(`  ✅ Mesclado e deletado com sucesso.`);
                mergedCount++;
            }
        }
    }
    
    console.log(`\nTotal mesclado: ${mergedCount}`);
}

run();
