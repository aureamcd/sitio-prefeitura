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

function getEmpresaCode(orgao: string): string | null {
  const upper = orgao.toUpperCase();
  if (upper.includes('SAÚDE') || upper.includes('SAUDE') || upper.includes('F. M. S.')) return '3';
  if (upper.includes('FUNDEB') || upper.includes('EDUCAÇÃO') || upper.includes('EDUCACAO')) return '4';
  if (upper.includes('ASSISTÊNCIA') || upper.includes('ASSISTENCIA') || upper.includes('F. M. A. S.')) return '5';
  if (upper.includes('HOSPITAL') || upper.includes('UNIDADE MISTA')) return '6';
  if (upper.includes('PREVIDÊNCIA') || upper.includes('PREVIDENCIA') || upper.includes('RPPS')) return '7';
  if (upper.includes('DIREITOS DA CRIANÇA')) return '8';
  if (upper.includes('MEIO AMBIENTE')) return '9';
  if (upper.includes('CULTURA')) return '10';
  if (upper.includes('P. M.') || upper.includes('PREFEITURA')) return '1';
  return null;
}

async function main() {
  const dirPath = path.resolve(__dirname, 'csv', 'licitações');
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.csv'));
  
  console.log(`Buscando licitações já cadastradas na licitacoes_v2...`);

  // Removido a exclusão em lote para não apagar edições manuais (fiscais) e PDFs (anexos) inseridos pela Lorena.
  // O script agora fará apenas o UPSERT (update se existir, insert se não existir).

  const { data: existentes, error: errorFetch } = await supabase
    .schema('transparencia')
    .from('licitacoes_v2')
    .select('id, proclic, numero, processo');

  if (errorFetch) {
    console.error('Erro ao buscar licitações_v2:', errorFetch);
    process.exit(1);
  }

  const procTceMap = new Map<string, string>();
  const numMap = new Map<string, string>();
  for (const row of (existentes || [])) {
    if (row.proclic) procTceMap.set(row.proclic, row.id);
    if (row.numero) {
      const match = row.numero.match(/(\d+)[/-](\d{4})/);
      if (match) {
        numMap.set(`${parseInt(match[1], 10)}/${match[2]}`, row.id);
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
    const rows = xlsx.utils.sheet_to_json<any>(ws);

    for (const row of rows) {
      const proclic = row['N° proc. TCE'];
      if (!row['Nº Procedimento'] && !row['Objeto']) continue;

      const anoStr = parseDate(row['Dt Cadastro'] || row['Dt Abert/Julg'])?.split('-')[0] || new Date().getFullYear().toString();
      const ano = parseInt(anoStr, 10);

      const numero = row['Nº Procedimento'];
      const modalidade = row['Modalidade'];
      const tipo = row['Tipo Objeto'];
      const dataAbertura = parseDate(row['Dt Abert/Julg']);
      const dataEncerramento = parseDate(row['Dt Finalização'] || row['Dt Homologação'] || row['Dt Adjudicação']);
      const valor = parseCurrency(row['Valor']);
      const situacao = row['Status'];
      const objeto = row['Objeto'];
      const orgao = row['Órgão'] || '';
      const empresaCode = getEmpresaCode(orgao);

      const record = {
        ano: isNaN(ano) ? new Date().getFullYear() : ano,
        proclic: proclic || null,
        numero: numero || null,
        processo: numero || null,
        modalidade: modalidade || null,
        tipo_licitacao: tipo || null,
        data_abertura: dataAbertura,
        data_encerramento: dataEncerramento,
        objeto: objeto || null,
        situacao: situacao || null,
        valor_estimado: valor,
        empresa: empresaCode,
        empresa_nome: orgao || null,
        origem: 'IMPORTACAO_XLSX',
        link_tce: row['Caminho detalhamento licitação'] || null
      };

      let extractedNum = '';
      if (numero) {
        const matchNum = numero.match(/(\d+)[/-](\d{4})/);
        if (matchNum) extractedNum = `${parseInt(matchNum[1], 10)}/${matchNum[2]}`;
      }

      const existingId = (proclic && procTceMap.get(proclic)) || (extractedNum && numMap.get(extractedNum));

      if (existingId) {
        const { error } = await supabase
          .schema('transparencia')
          .from('licitacoes_v2')
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
          .from('licitacoes_v2')
          .insert([record])
          .select('id')
          .single();
          
        if (error) {
          console.error(`[ERRO INSERT] Procedimento ${numero}: ${error.message}`);
          comErros++;
        } else {
          inseridas++;
          if (proclic) procTceMap.set(proclic, data.id);
        }
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`RESUMO DA IMPORTAÇÃO (licitacoes_v2)`);
  console.log(`- Novas Inseridas: ${inseridas}`);
  console.log(`- Existentes Atualizadas: ${atualizadas}`);
  console.log(`- Erros: ${comErros}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
