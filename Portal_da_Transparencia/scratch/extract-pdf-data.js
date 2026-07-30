const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");
const fs = require("fs");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_URL = process.env.R2_PUBLIC_URL || 'https://pub-dc316bdb1d204c4fa9d36b369c385b97.r2.dev';

function extractDataFromText(text) {
    const data = {};
    
    // CNPJ
    const cnpjMatch = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    if (cnpjMatch) data.cnpj_contratado = cnpjMatch[0];
    
    // Licitação (Pregão Eletrônico, Dispensa, Inexigibilidade, Processo Administrativo)
    const licitacaoMatch = text.match(/(?:Pregão Eletrônico|Dispensa de Licitação|Inexigibilidade|Processo Administrativo|Tomada de Preços|Concorrência)(?:\s*(?:Nº|N|nº|n\.º|n\.|n)?\s*\d+\/\d{4})/i);
    if (licitacaoMatch) {
        data.numero_licitacao = licitacaoMatch[0].replace(/\n/g, ' ').trim();
    } else {
        const fallbackLicitacao = text.match(/(?:Pregão|Dispensa|Inexigibilidade)[\s\S]{0,30}\d+\/\d{4}/i);
        if (fallbackLicitacao) data.numero_licitacao = fallbackLicitacao[0].replace(/\n/g, ' ').trim();
    }

    // Vigência
    const vigenciaMatch = text.match(/(?:prazo de vigência|vigência|terá vigência)[\s\S]{0,100}(?:até|findando|terminando)[\s\S]{0,20}(\d{2}\/\d{2}\/\d{4})/i) 
                       || text.match(/vigência[:\s]*(\d{2}\/\d{2}\/\d{4})/i)
                       || text.match(/vigência será de \d+ \(.*?\) dias/i)
                       || text.match(/vigência[\s\S]{0,40}até \d{2} de [a-zA-Z]+ de \d{4}/i)
                       || text.match(/(\d{2}\/\d{2}\/\d{4})[\s\S]{0,30}vigência/i);
    if (vigenciaMatch) {
        data.data_vigencia = (vigenciaMatch[1] || vigenciaMatch[0]).replace(/\n/g, ' ').trim();
        // Fallback max size
        if (data.data_vigencia.length > 50) data.data_vigencia = data.data_vigencia.substring(0, 50) + '...';
    }

    // Data Assinatura (near the end usually)
    // We look at the last 1500 chars
    const lastPart = text.slice(-1500);
    const dataAssinaturaMatch = lastPart.match(/(?:Padre Marcos|Teresina)[-–\s]*PI[,]?\s*(\d{1,2})\s*de\s*([a-zA-Zç]+)\s*de\s*(\d{4})/i)
                             || lastPart.match(/assinado em (\d{2}\/\d{2}\/\d{4})/i);
    if (dataAssinaturaMatch && dataAssinaturaMatch[1] && dataAssinaturaMatch[2] && dataAssinaturaMatch[3]) {
        const dia = dataAssinaturaMatch[1].padStart(2, '0');
        const mesStr = dataAssinaturaMatch[2].toLowerCase();
        const meses = {janeiro:'01',fevereiro:'02',março:'03',abril:'04',maio:'05',junho:'06',julho:'07',agosto:'08',setembro:'09',outubro:'10',novembro:'11',dezembro:'12'};
        const mes = meses[mesStr];
        const ano = dataAssinaturaMatch[3];
        if (mes) data.data_assinatura = `${ano}-${mes}-${dia}`;
    }

    // Valor (R$)
    const valorMatch = text.match(/R\$\s*([\d\.,]+)/);
    if (valorMatch) {
        // Just extract it but we might not overwrite if already present
        data.valor_encontrado = valorMatch[1];
    }

    return data;
}

async function run() {
    let offset = 0;
    const limit = 500;
    let contratos = [];
    
    console.log("Buscando contratos com campos nulos...");
    while (true) {
        const { data } = await supabase.schema('transparencia').from('contratos_v2')
            .select('id, numero, ano, valor, data_assinatura, data_fim, cpf_cnpj, contratado, modalidade')
            .range(offset, offset + limit - 1);
        if (!data || data.length === 0) break;
        contratos = contratos.concat(data);
        offset += limit;
    }
    
    // Filter only those that actually need updates
    const needsUpdate = contratos.filter(c => !c.data_fim || !c.cpf_cnpj || !c.modalidade || !c.data_assinatura);
    console.log(`${needsUpdate.length} contratos precisam de extração.`);

    let updatedCount = 0;
    
    async function processContract(c, index) {
        console.log(`[${index+1}/${needsUpdate.length}] Iniciando ${c.numero}/${c.ano}...`);
        // Fetch docs
        const { data: docs } = await supabase.schema('transparencia').from('contratos_documentos').select('*').eq('contrato_id', c.id);
        if (!docs || docs.length === 0) {
            console.log(`[${index+1}/${needsUpdate.length}] Sem anexos para ${c.numero}/${c.ano}.`);
            return;
        }
        
        let targetDoc = docs.find(d => (d.nome_arquivo||'').toLowerCase().includes('contrato') && !d.nome_arquivo.toLowerCase().includes('aditivo'));
        if (!targetDoc) targetDoc = docs[0]; // fallback
        
        let fileUrl = targetDoc.url_arquivo;
        if (!fileUrl.startsWith('http')) {
            fileUrl = `${BUCKET_URL}/${fileUrl}`;
        }
        console.log(`[${index+1}/${needsUpdate.length}] Baixando ${fileUrl}...`);
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
            
            const res = await fetch(fileUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) return;
            const buffer = await res.arrayBuffer();
            
            const pdfPromise = pdfParse(buffer);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('pdfParse timeout')), 10000)
            );
            const pdfData = await Promise.race([pdfPromise, timeoutPromise]);
            
            console.log(`[${index+1}/${needsUpdate.length}] PDF Lido ${c.numero}. Texto: ${pdfData.text.length} chars`);
            const text = pdfData.text;
            
            if (!text || text.trim().length < 100) return;
            
            const extracted = extractDataFromText(text);
            const updatePayload = {};
            
            if (!c.cpf_cnpj && extracted.cnpj_contratado) updatePayload.cpf_cnpj = extracted.cnpj_contratado;
            
            if (!c.data_fim && extracted.data_vigencia) {
                const parts = extracted.data_vigencia.split('/');
                if (parts.length === 3) updatePayload.data_fim = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
            
            if (!c.modalidade && extracted.numero_licitacao) updatePayload.modalidade = extracted.numero_licitacao;
            if (!c.data_assinatura && extracted.data_assinatura) updatePayload.data_assinatura = extracted.data_assinatura;
            if ((!c.valor || c.valor == 0) && extracted.valor_encontrado) updatePayload.valor = parseFloat(extracted.valor_encontrado.replace(/\./g, '').replace(',', '.'));
            
            if (Object.keys(updatePayload).length > 0) {
                await supabase.schema('transparencia').from('contratos_v2').update(updatePayload).eq('id', c.id);
                updatedCount++;
                console.log(`[${index+1}/${needsUpdate.length}] Contrato ${c.numero}/${c.ano} atualizado:`, updatePayload);
            } else {
                console.log(`[${index+1}/${needsUpdate.length}] Contrato ${c.numero}/${c.ano} lido, mas nada novo extraído.`);
            }
        } catch (e) {
            console.log(`[${index+1}/${needsUpdate.length}] Erro PDF ${c.numero}/${c.ano}: ${e.message}`);
        }
    }

    const CONCURRENCY = 10;
    for (let i = 0; i < needsUpdate.length; i += CONCURRENCY) {
        const batch = needsUpdate.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((c, idx) => processContract(c, i + idx)));
    }
    
    console.log(`Extração finalizada! ${updatedCount} contratos foram enriquecidos.`);
}

run().catch(console.error);
