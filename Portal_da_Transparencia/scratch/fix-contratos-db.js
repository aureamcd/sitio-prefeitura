const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Utility to fix text encoding (latin1 -> utf8)
function fixEncoding(text) {
    if (!text) return text;
    // Se o texto tiver o caractere "Ã", é quase certeza que tá quebrado.
    if (text.includes('Ã')) {
        try {
            return Buffer.from(text, 'latin1').toString('utf8');
        } catch(e) {
            return text;
        }
    }
    return text;
}

async function run() {
    console.log("Iniciando a Operação Cirúrgica no Banco de Dados...");
    
    // Pegar todos os contratos de 2017 para o Merge
    const { data: contratos2017, error: err2017 } = await supabase.schema('transparencia').from('contratos_v2').select('*').eq('ano', 2017);
    if (err2017) { console.error("Erro ao puxar 2017:", err2017); return; }

    const byNumber = {};
    for (const c of contratos2017) {
        if (!c.numero) continue;
        const normalized = c.numero.replace('/2017', '').replace('/17', '').trim().padStart(3, '0');
        if (!byNumber[normalized]) byNumber[normalized] = [];
        byNumber[normalized].push(c);
    }

    let mergeCount = 0;
    
    for (const num in byNumber) {
        if (byNumber[num].length > 1) {
            // Temos duplicata!
            // Precisamos achar o Genérico (Valor = 0 ou null, tem "/2017" no número)
            // e o Real (Valor > 0, texto longo, etc)
            
            const generic = byNumber[num].find(c => c.numero.includes('/2017') && (!c.valor || Number(c.valor) === 0));
            const real = byNumber[num].find(c => !c.numero.includes('/2017') || (c.valor && Number(c.valor) > 0));

            if (generic && real && generic.id !== real.id) {
                console.log(`\nFazendo Merge do Contrato ${num}...`);
                
                // 1. Transferir os Anexos do Genérico para o Real
                const { data: anexos, error: errAnex } = await supabase.schema('transparencia')
                    .from('contratos_documentos')
                    .update({ contrato_id: real.id })
                    .eq('contrato_id', generic.id);
                
                if (errAnex) {
                    console.error(`Erro ao transferir anexos do ${generic.id}:`, errAnex);
                    continue;
                }
                console.log(`  -> Anexos transferidos para o Real (${real.id}).`);

                // 2. Corrigir o número e o texto do Real
                const objetoCorrigido = fixEncoding(real.objeto);
                const contratadoCorrigido = fixEncoding(real.contratado);
                const novoNumero = `${num}/2017`;

                const { error: errUpdate } = await supabase.schema('transparencia')
                    .from('contratos_v2')
                    .update({
                        numero: novoNumero,
                        objeto: objetoCorrigido,
                        contratado: contratadoCorrigido
                    })
                    .eq('id', real.id);
                
                if (errUpdate) {
                    console.error(`Erro ao atualizar o Real ${real.id}:`, errUpdate);
                    continue;
                }
                console.log(`  -> Número atualizado de [${real.numero}] para [${novoNumero}] e texto corrigido.`);

                // 3. Deletar o Genérico
                const { error: errDelete } = await supabase.schema('transparencia')
                    .from('contratos_v2')
                    .delete()
                    .eq('id', generic.id);
                
                if (errDelete) {
                    console.error(`Erro ao deletar o Genérico ${generic.id}:`, errDelete);
                    continue;
                }
                console.log(`  -> Contrato Genérico ${generic.id} DELETADO com sucesso.`);
                
                mergeCount++;
            } else {
                // Caso não siga o padrão óbvio, avisar para fazer na mão
                console.log(`\n⚠️ Padrão desconhecido para o contrato ${num}. Não foi possível fazer merge seguro. Analise manualmente.`);
            }
        }
    }

    console.log(`\n============================`);
    console.log(`Merges Concluídos em 2017: ${mergeCount}`);
    console.log(`============================`);

    console.log("\nIniciando Varredura Global de Correção de Textos (Acentos)...");
    
    // Pegar todos os contratos para arrumar os textos corrompidos restantes
    const { data: todosContratos, error: errTodos } = await supabase.schema('transparencia').from('contratos_v2').select('id, objeto, contratado');
    if (errTodos) { console.error("Erro ao puxar todos:", errTodos); return; }

    let textoCorrigidoCount = 0;
    
    for (const c of todosContratos) {
        const objNovo = fixEncoding(c.objeto);
        const contNovo = fixEncoding(c.contratado);
        
        if (objNovo !== c.objeto || contNovo !== c.contratado) {
            const { error: updateErr } = await supabase.schema('transparencia')
                .from('contratos_v2')
                .update({ objeto: objNovo, contratado: contNovo })
                .eq('id', c.id);
            
            if (!updateErr) {
                textoCorrigidoCount++;
                console.log(`Corrigido [ID: ${c.id}]: ${objNovo.substring(0, 50)}...`);
            }
        }
    }

    console.log(`\n============================`);
    console.log(`Contratos com textos corrompidos arrumados: ${textoCorrigidoCount}`);
    console.log(`============================`);
    console.log("Cirurgia Finalizada com Sucesso! 🩺✅");
}

run();
