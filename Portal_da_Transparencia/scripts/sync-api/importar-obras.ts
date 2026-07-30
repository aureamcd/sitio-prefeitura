import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(_dirname, '../../.env') });

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

function getEmpresaCode(orgao: string): string {
  const upper = (orgao || '').toUpperCase();
  if (upper.includes('SAÚDE') || upper.includes('SAUDE') || upper.includes('F. M. S.')) return '3';
  if (upper.includes('FUNDEB') || upper.includes('EDUCAÇÃO') || upper.includes('EDUCACAO')) return '4';
  if (upper.includes('ASSISTÊNCIA') || upper.includes('ASSISTENCIA') || upper.includes('F. M. A. S.')) return '5';
  if (upper.includes('HOSPITAL') || upper.includes('UNIDADE MISTA')) return '6';
  if (upper.includes('PREVIDÊNCIA') || upper.includes('PREVIDENCIA') || upper.includes('RPPS')) return '7';
  if (upper.includes('DIREITOS DA CRIANÇA')) return '8';
  if (upper.includes('MEIO AMBIENTE')) return '9';
  if (upper.includes('CULTURA')) return '10';
  return '1'; // Default: PREFEITURA
}

export async function importarObras() {
  const dirPath = path.resolve(_dirname, 'csv', 'obras');
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Pasta não encontrada: ${dirPath}`);
    return;
  }
  
  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.csv'));
  
  console.log(`Buscando obras já cadastradas na tabela obras...`);

  // Busca obras existentes para UPSERT
  const { data: existentes, error: errorFetch } = await supabase
    .schema('transparencia')
    .from('obras')
    .select('id, objeto');

  if (errorFetch) {
    console.error('Erro ao buscar obras:', errorFetch);
    process.exit(1);
  }

  // Mapa rudimentar para tentar achar pelo objeto (já que a planilha não vem com ID)
  const objMap = new Map<string, string>();
  for (const row of (existentes || [])) {
    if (row.objeto) {
        objMap.set(row.objeto.substring(0, 100).toLowerCase(), row.id);
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
      if (!row['Descrição'] && !row['Órgão/UG']) continue;

      const orgao = row['Órgão/UG'] || '';
      const executante = row['Executante'] || 'NÃO INFORMADO';
      const descricao = row['Descrição'] || '';
      const dtInicio = parseDate(row['Dt Início']);
      const valorPrevisto = parseCurrency(row['Valor Previsto']);
      const situacao = row['Situação'] || 'NÃO INFORMADO';

      const anoStr = dtInicio ? dtInicio.split('-')[0] : new Date().getFullYear().toString();
      const ano = parseInt(anoStr, 10);
      const empresaCode = getEmpresaCode(orgao);

      const record = {
        ano: isNaN(ano) ? new Date().getFullYear() : ano,
        empresa: empresaCode,
        data_inicio: dtInicio,
        objeto: descricao,
        empresa_responsavel: executante,
        situacao: situacao,
        valor_total: valorPrevisto
      };

      const key = descricao.substring(0, 100).toLowerCase();
      const existingId = objMap.get(key);

      if (existingId) {
        const { error } = await supabase
          .schema('transparencia')
          .from('obras')
          .update(record)
          .eq('id', existingId);
          
        if (error) {
          console.error(`[ERRO UPDATE] ID ${existingId}: ${error.message}`);
          comErros++;
        } else {
          atualizadas++;
        }
      } else {
        const { error, data: inserted } = await supabase
          .schema('transparencia')
          .from('obras')
          .insert(record)
          .select('id')
          .single();
          
        if (error) {
          console.error(`[ERRO INSERT]: ${error.message}`);
          comErros++;
        } else if (inserted) {
          objMap.set(key, inserted.id); // atualiza cache local
          inseridas++;
        }
      }
    }
  }

  console.log(`\n=== RESUMO DA IMPORTAÇÃO DE OBRAS ===`);
  console.log(`Novas obras: ${inseridas}`);
  console.log(`Obras atualizadas: ${atualizadas}`);
  console.log(`Erros: ${comErros}`);
}

// Para execução manual no terminal
if (typeof require !== 'undefined' && require.main === module) {
    importarObras();
}
