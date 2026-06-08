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
const TIPOS = [
  { id: 'UNIAO', listagem: 'ReceitaUniao' },
  { id: 'ESTADO', listagem: 'ReceitaEstado' }
];

// Helper to convert "6077613,25" to 6077613.25
function parseCurrency(val: string | undefined): number {
  if (!val) return 0;
  return parseFloat(val.replace(/\./g, '').replace(',', '.'));
}

async function run() {
  console.log('--- Iniciando importação de Receitas (União e Estado) ---');

  for (const tipo of TIPOS) {
    console.log(`\n>>> Processando tipo: ${tipo.id} (${tipo.listagem})`);
    
    for (const ano of ANOS) {
      console.log(`Importando ano: ${ano}`);
      
      try {
        const url = `${fiorilliUrl}/VersaoJson/Receitas/?ConectarExercicio=${ano}&Listagem=${tipo.listagem}&DiaInicioPeriodo=01&MesInicialPeriodo=01&DiaFinalPeriodo=31&MesFinalPeriodo=12&Ano=${ano}&Empresa=1&MostraDadosConsolidado=False`;
        
        const response = await fetch(url);
        if (!response.ok) {
          console.error(`Erro na requisição para ${ano}: ${response.status} ${response.statusText}`);
          continue;
        }

        const text = await response.text();
        const cleanText = text.replace(/^\uFEFF/, '');
        const data = JSON.parse(cleanText);

        if (!Array.isArray(data) || data.length === 0) {
          console.log(`Sem dados para ${ano}`);
          continue;
        }

        console.log(`Recebidos ${data.length} registros para ${ano}. Processando...`);

        const registros = data.map((item: any) => ({
          exercicio: ano,
          tipo: tipo.id,
          ordem: parseInt(item.ORDEM) || null,
          codigo: item.CODIGO?.trim(),
          especificacao: item.NOME?.trim(),
          previsao_inicial: parseCurrency(item.PREVISAO_INICIAL),
          previsao_atualizada: parseCurrency(item.PREVISAO_ATUALIZADA),
          arrecadado_periodo: parseCurrency(item.ARRECADADO_PERIODO),
          arrecadado_total: parseCurrency(item.ARRECADADO_TOTAL),
          data_importacao: new Date().toISOString(),
        }));

        // Excluir os antigos desse ano e tipo
        const { error: delError } = await supabase
          .schema('transparencia')
          .from('receitas_transferencias')
          .delete()
          .eq('exercicio', ano)
          .eq('tipo', tipo.id);

        if (delError) {
          console.error(`Erro ao limpar dados de ${ano}:`, delError);
        }

        // Inserir os novos
        const { error: insError } = await supabase
          .schema('transparencia')
          .from('receitas_transferencias')
          .insert(registros);

        if (insError) {
          console.error(`Erro ao inserir dados de ${ano}:`, insError);
        } else {
          console.log(`✅ ${registros.length} registros de ${tipo.id} inseridos com sucesso para ${ano}!`);
        }

      } catch (err: any) {
        console.error(`Erro processando ${ano}: ${err.message}`);
      }
    }
  }

  console.log('\n--- Finalizado ---');
}

run();
