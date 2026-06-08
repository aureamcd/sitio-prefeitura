import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const fiorilliUrl = process.env.FIORILLI_API_URL || 'https://contreina.padremarcos.pi.gov.br/Transparencia';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ANOS = [2023, 2024, 2025, 2026];

// Helper to convert DD/MM/YYYY HH:MM:SS to YYYY-MM-DD
function parseDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

// Helper to convert "139245,83" to 139245.83
function parseCurrency(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/\./g, '').replace(',', '.'));
}

async function run() {
  console.log('--- Iniciando importação de Transferências entre Entidades ---');

  for (const ano of ANOS) {
    console.log(`\nImportando ano: ${ano}`);
    
    try {
      // Usando Empresa=1 (Prefeitura) por padrão, ou iterando se necessário. 
      // A cartilha pede os dados do ente como um todo. A entidade de origem/destino vem no JSON.
      const url = `${fiorilliUrl}/VersaoJson/Transferencias/?ConectarExercicio=${ano}&Listagem=Transf&Empresa=1&MostraDadosConsolidado=False`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Erro na requisição para ${ano}: ${response.status} ${response.statusText}`);
        continue;
      }

      const text = await response.text();
      // Remover BOM se houver
      const cleanText = text.replace(/^\uFEFF/, '');
      const data = JSON.parse(cleanText);

      if (!Array.isArray(data) || data.length === 0) {
        console.log(`Sem dados para ${ano}`);
        continue;
      }

      console.log(`Recebidos ${data.length} registros para ${ano}. Processando...`);

      const registros = data.map((item: any) => ({
        exercicio: ano,
        mes: parseInt(item.MES) || null,
        entidade_pagadora: item.ENTIDADE_PAGADORA?.trim(),
        entidade_recebedora: item.ENTIDADE_RECEBEDORA?.trim(),
        cnpj_pagadora: item.CNPJPAGADORA?.trim(),
        cnpj_recebedora: item.CNPJRECEBEDORA?.trim(),
        repasse: parseCurrency(item.REPASSE),
        devolucao: parseCurrency(item.DEVOLUCAO),
        previsto: parseCurrency(item.PREVISTO),
        data_lancamento: parseDate(item.DTLAN),
        data_importacao: new Date().toISOString(),
      }));

      // Excluir os antigos desse ano para evitar duplicação
      const { error: delError } = await supabase
        .schema('transparencia')
        .from('transferencias_entre_entidades')
        .delete()
        .eq('exercicio', ano);

      if (delError) {
        console.error(`Erro ao limpar dados de ${ano}:`, delError);
      }

      // Inserir os novos
      const { error: insError } = await supabase
        .schema('transparencia')
        .from('transferencias_entre_entidades')
        .insert(registros);

      if (insError) {
        console.error(`Erro ao inserir dados de ${ano}:`, insError);
      } else {
        console.log(`✅ ${registros.length} registros inseridos com sucesso para ${ano}!`);
      }

    } catch (err: any) {
      console.error(`Erro processando ${ano}: ${err.message}`);
    }
  }

  console.log('\n--- Finalizado ---');
}

run();
