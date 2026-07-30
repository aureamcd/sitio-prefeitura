const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    let offset = 0;
    const limit = 1000;
    let contratos = [];
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_v2').select('*').range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        contratos = contratos.concat(data);
        offset += limit;
    }
    
    // Group by base number and year
    const countByNumeroAno = {};
    for (const c of contratos) {
        if (!c.numero) continue;
        
        let baseNum = c.numero.split('/')[0].trim();
        let ano = c.ano || '';
        
        const key = baseNum + '|' + ano;
        if (!countByNumeroAno[key]) countByNumeroAno[key] = [];
        countByNumeroAno[key].push(c);
    }
    
    let toDelete = [];
    let dupes = 0;
    for (const [key, list] of Object.entries(countByNumeroAno)) {
        if (list.length > 1) {
            // Score them to pick the best
            list.sort((a, b) => {
                let scoreA = 0;
                let scoreB = 0;
                
                if (a.has_anexos) scoreA += 100;
                if (b.has_anexos) scoreB += 100;
                
                if (a.numero.includes('/')) scoreA += 50;
                if (b.numero.includes('/')) scoreB += 50;
                
                if (a.cpf_cnpj) scoreA += 10;
                if (b.cpf_cnpj) scoreB += 10;
                
                if (a.valor && a.valor !== '3986.24' && a.valor !== '3.986,24' && a.valor !== 3986.24) scoreA += 5;
                if (b.valor && b.valor !== '3986.24' && b.valor !== '3.986,24' && b.valor !== 3986.24) scoreB += 5;

                return scoreB - scoreA;
            });
            
            const best = list[0];
            const ghosts = list.slice(1);
            
            console.log('\nGrupo Duplicado:', key);
            console.log('  🟢 MANTER:', best.numero, '(ID:', best.id, ') Anexos:', best.has_anexos, 'Valor:', best.valor);
            
            for (const g of ghosts) {
                console.log('  🔴 APAGAR:', g.numero, '(ID:', g.id, ') Anexos:', g.has_anexos, 'Valor:', g.valor);
                toDelete.push(g.id);
            }
            
            dupes++;
        }
    }
    
    console.log('\n=============================');
    console.log('Total grupos duplicados:', dupes);
    console.log('Total contratos para deletar:', toDelete.length);
    
    if (toDelete.length > 0) {
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            await supabase.schema('transparencia').from('contratos_v2').delete().in('id', batch);
        }
        console.log('Todos os', toDelete.length, 'contratos duplicados fantasmas foram deletados com sucesso!');
    }
}
run().catch(console.error);
