import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('ERRO: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return null;
}

function parseCurrency(valStr: string | number | undefined | null): number {
  if (valStr === undefined || valStr === null) return 0;
  if (typeof valStr === 'number') return valStr;
  let s = valStr.toString().trim();
  s = s.replace(/[^\d,\.-]/g, '');
  s = s.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

async function main() {
  const dirPath = path.resolve(__dirname, 'csv', 'contratos');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.csv'));
  
  console.log(`Buscando contratos já cadastrados na contratos_v2...`);

  // Removemos as importações parciais criadas anteriormente que ficaram duplicadas
  console.log('Removendo duplicatas da importação anterior...');
  await supabase.schema('transparencia').from('contratos_v2').delete().eq('origem', 'IMPORTACAO_XLSX');

  const { data: existentes, error: errorFetch } = await supabase
    .schema('transparencia')
    .from('contratos_v2')
    .select('id, numero, processo');

  if (errorFetch) {
    console.error('Erro ao buscar contratos_v2:', errorFetch);
    process.exit(1);
  }

  const numMap = new Map<string, string>();
  for (const row of (existentes || [])) {
    if (row.numero) {
      // Tentar extrair XXX/YYYY ou simplesmente usar como está
      const match = row.numero.match(/(\d+)[/-](\d{4})/);
      if (match) {
        numMap.set(`${parseInt(match[1], 10)}/${match[2]}`, row.id);
      } else {
        numMap.set(row.numero.trim(), row.id);
      }
    }
  }

  let inseridas = 0;
  let atualizadas = 0;
  let comErros = 0;

  for (const file of files) {
    console.log(`\nProcessando arquivo: ${file}`);
    const filePath = path.join(dirPath, file);
    
    const wb = xlsx.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json<any>(ws, { range: 1 });

    for (const row of rows) {
      if (!row['instrumento'] && !row['objeto']) continue;

      const anoStr = parseDate(row['dt assinatura'] || row['dt cadastro'])?.split('-')[0] || new Date().getFullYear().toString();
      const ano = parseInt(anoStr, 10);
      
      const numero = row['instrumento'] || row['proc. tce'];
      const modalidade = row['tipo'];
      const dataAssinatura = parseDate(row['dt assinatura']);
      const dataInicio = parseDate(row['dt ini vig atual'] || row['dt ini 1a vig']);
      const dataFim = parseDate(row['dt fim vig atual']);
      const valor = parseCurrency(row['valor']);
      const situacao = row['status'];
      const objeto = row['objeto'];
      const contratado = row['contratado'];
      const processo = row['proc. tce'];

      const record = {
        ano: isNaN(ano) ? new Date().getFullYear() : ano,
        numero: numero || 'S/N',
        processo: processo || null,
        modalidade: modalidade || null,
        data_assinatura: dataAssinatura,
        data_inicio: dataInicio,
        data_fim: dataFim,
        objeto: objeto || null,
        situacao: situacao || null,
        valor: valor,
        contratado: contratado || null,
        origem: 'IMPORTACAO_XLSX',
        link_tce: row['Caminho detalhamento contrato'] || null
      };

      let extractedNum = numero ? numero.trim() : '';
      if (numero) {
        const matchNum = numero.match(/(\d+)[/-](\d{4})/);
        if (matchNum) extractedNum = `${parseInt(matchNum[1], 10)}/${matchNum[2]}`;
      }

      const existingId = numMap.get(extractedNum) || (numero && numMap.get(numero.trim()));

      if (existingId) {
        const { error } = await supabase
          .schema('transparencia')
          .from('contratos_v2')
          .update(record)
          .eq('id', existingId);
          
        if (error) {
          console.error(`[ERRO UPDATE] ID ${existingId}: ${error.message}`);
          comErros++;
        } else {
          atualizadas++;
        }
      } else {
        const { error, data } = await supabase
          .schema('transparencia')
          .from('contratos_v2')
          .insert([record])
          .select('id')
          .single();
          
        if (error) {
          console.error(`[ERRO INSERT] Contrato ${numero}: ${error.message}`);
          comErros++;
        } else {
          inseridas++;
          numMap.set(extractedNum, data.id);
        }
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`RESUMO DA IMPORTAÇÃO (contratos_v2)`);
  console.log(`- Novas Inseridas: ${inseridas}`);
  console.log(`- Existentes Atualizadas: ${atualizadas}`);
  console.log(`- Erros: ${comErros}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
