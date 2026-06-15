import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ======================================================
// CONFIG
// ======================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ======================================================
// PARÂMETROS
// ======================================================

const ANOS = [2023, 2024, 2025, 2026];

const EMPRESAS: { codigo: string; nome: string }[] = [
  { codigo: '1', nome: 'PREFEITURA MUNICIPAL DE PADRE MARCOS' },
  { codigo: '3', nome: 'FUNDO MUNICIPAL DE SAÚDE' },
  { codigo: '4', nome: 'FUNDEB' },
  { codigo: '5', nome: 'FMAS' },
  { codigo: '6', nome: 'HOSPITAL' },
  { codigo: '7', nome: 'RPPS' },
  { codigo: '8', nome: 'DIREITOS DA CRIANÇA' },
  { codigo: '9', nome: 'MEIO AMBIENTE' },
  { codigo: '10', nome: 'CULTURA' },
];

const BASE_URL =
  'https://contreina.padremarcos.pi.gov.br/Transparencia/versaoJson/Despesas';

// ======================================================
// HELPERS
// ======================================================

function parseValor(valor: any): number {
  if (!valor) return 0;
  const v = String(valor)
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function parseDateBR(date: string | null | undefined): string | null {
  if (!date) return null;
  const onlyDate = date.split(' ')[0];
  const [day, month, year] = onlyDate.split('/');
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
}

function extractMonth(date: string | null | undefined): number | null {
  if (!date) return null;
  const onlyDate = date.split(' ')[0];
  const [, month] = onlyDate.split('/');
  return month ? parseInt(month) : null;
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }
  const text = await response.text();
  const clean = text.replace(/^\uFEFF/, '');
  return JSON.parse(clean);
}

// ======================================================
// MONTAR REGISTRO
// ======================================================

function montarRegistro(item: any, ano: number, empresaNome: string): any {
  return {
    ano,
    mes: extractMonth(item.DTPAG || item.VENCI),
    empresa_codigo: item.CODENTIDADE || item.EMPRESA || null,
    empresa_nome: empresaNome,
    empenho: item.EMPENHO || null,
    tipo_empenho: item.TPEM || null,
    fornecedor: item.FORNECEDOR?.trim() || 'Não identificado',
    cpf_cnpj_fornecedor: item.CGC || null,
    valor_empenho: parseValor(item.VADEM || item.VALOR_EMPENHO),
    valor_pago: parseValor(item.VAPAG),
    valor_desconto: parseValor(item.DESCO),
    valor_liquido_pago: parseValor(item.PAGLIQ),
    data_vencimento: parseDateBR(item.VENCI),
    data_pagamento: parseDateBR(item.DTPAG),
    justificativa: item.JUSTIFICATIVA || null,
    justificativa_texto: item.JUSTIFICATIVA_TEXTO || null,
    data_justificativa: parseDateBR(item.DATAJUSTI),
    tipo_lista: item.TIPOLISTA || null,
    numero_contrato: item.CONTRATO || null,
    categoria_contrato: item.CONTRATO_CATEGORIA || null,
    categoria_contrato_descr: item.CONTRATO_CATEGORIA_DESCR || null,
    processo: item.PROCESSOADM || item.PROCLIC || null,
    unidade_nome: item.UNIDADE_NOME || null,
    autorizador_nome: item.AUTORIZADORDESPESA || null,
    historico: item.PRODU || null,
    notas_fiscais: item.NOTAS || null,
    licitacao: item.LICIT || null,
  };
}

// ======================================================
// IMPORTAR ANO + EMPRESA
// ======================================================

async function importar(
  ano: number,
  empresa: { codigo: string; nome: string },
  tipo: number
): Promise<number> {
  const url = `${BASE_URL}/?ConectarExercicio=${ano}&Listagem=DespesasporExigibilidade&DiaInicioPeriodo=01.01.${ano}&DiaFinalPeriodo=31.12.${ano}&strTipoLista=${tipo}&Empresa=${empresa.codigo}`;

  let data: any[];
  try {
    data = await fetchJson(url);
  } catch (err: any) {
    console.error(`  ❌ Erro ao buscar ${ano}/${empresa.nome}/tipo${tipo}: ${err.message}`);
    return 0;
  }

  if (!Array.isArray(data) || data.length === 0) return 0;

  const registros = data.map((item) =>
    montarRegistro(item, ano, empresa.nome)
  );

  const CHUNK_SIZE = 100;
  for (let i = 0; i < registros.length; i += CHUNK_SIZE) {
    const chunk = registros.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .schema('transparencia')
      .from('ordem_cronologica_pagamentos')
      .insert(chunk);

    if (error) {
      console.error(`    ❌ Erro ao inserir lote: ${error.message}`);
      return 0;
    }
  }

  return registros.length;
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  console.log('========================================');
  console.log('IMPORTAÇÃO - ORDEM CRONOLÓGICA DE PAGAMENTOS');
  console.log('Critério 9.4 do PNTP 2026');
  console.log('========================================\n');

  const totalGeral = { registros: 0 };

  for (const ano of ANOS) {
    console.log(`\n📅 Ano: ${ano}`);
    console.log('─'.repeat(40));

    // Limpar dados existentes desse ano
    const { error: delError } = await supabase
      .schema('transparencia')
      .from('ordem_cronologica_pagamentos')
      .delete()
      .eq('ano', ano);

    if (delError) {
      console.error(`  ❌ Erro ao limpar dados de ${ano}: ${delError.message}`);
      continue;
    }

    for (const empresa of EMPRESAS) {
      for (const tipo of [1, 2, 3]) {
        const qtd = await importar(ano, empresa, tipo);
        if (qtd > 0) {
          console.log(`  ✅ ${empresa.nome} | Tipo ${tipo} → ${qtd} registros`);
          totalGeral.registros += qtd;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log(`📊 TOTAL GERAL: ${totalGeral.registros} registros importados`);
  console.log('✅ Finalizado!');
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
