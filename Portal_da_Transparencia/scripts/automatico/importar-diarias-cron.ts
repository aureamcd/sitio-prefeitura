import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(_dirname, '../../.env')
});

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis Supabase não encontradas.');
}

const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseKey || 'anon',
  {
    db: {
      schema: 'transparencia'
    }
  }
);

const EMPRESAS = [
  { codigo: '1', nome: 'PREFEITURA MUNICIPAL DE PADRE MARCOS' },
  { codigo: '3', nome: 'FUNDO MUNICIPAL DE SAÚDE' },
  { codigo: '4', nome: 'FUNDEB' },
  { codigo: '5', nome: 'FMAS' },
  { codigo: '6', nome: 'HOSPITAL' },
  { codigo: '7', nome: 'RPPS' },
  { codigo: '8', nome: 'DIREITOS DA CRIANÇA' },
  { codigo: '9', nome: 'MEIO AMBIENTE' },
  { codigo: '10', nome: 'CULTURA' }
];

const BASE_URL = 'https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Despesas';

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
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function parseQuantidade(quantStr: any, descricao: string | null | undefined): number {
  if (quantStr && quantStr !== '') {
    const q = parseValor(quantStr);
    if (q > 0) return q;
  }
  if (!descricao) return 1;
  const match = descricao.match(/(\d+([.,]\d+)?)(\s*\(.*?\))?\s*diária/i);
  if (match && match[1]) {
    const q = parseValor(match[1]);
    if (q > 0) return q;
  }
  return 1;
}

function splitCodigoDescricao(valor: string | null | undefined) {
  if (!valor) return { codigo: '', descricao: '' };
  const parts = valor.split(' - ');
  return {
    codigo: parts[0]?.trim() || '',
    descricao: parts.slice(1).join(' - ').trim() || parts[0]?.trim() || ''
  };
}

function buildDiariasUrl(ano: number, empresa: string) {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: 'Diarias',
    DiaInicioPeriodo: '01',
    MesInicialPeriodo: '01',
    DiaFinalPeriodo: '31',
    MesFinalPeriodo: '12',
    Ano: String(ano),
    Empresa: empresa,
    MostraDadosConsolidado: 'False'
  });
  return `${BASE_URL}/?${params.toString()}`;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }
  return response.json();
}

async function importarEmpresaAno(empresa: { codigo: string; nome: string }, ano: number) {
  const url = buildDiariasUrl(ano, empresa.codigo);
  console.log(`📡 Consultando [Empresa ${empresa.codigo} - ${empresa.nome}] para ${ano}...`);
  
  let data;
  try {
    data = await fetchJson(url);
  } catch (e: any) {
    console.log(`   ❌ Erro de rede ao buscar dados: ${e.message}`);
    return 0; // Se falhar a rede, NÃO deletamos os dados do banco (Delta-sync safe)
  }

  if (!Array.isArray(data) || data.length === 0) {
    console.log(`   📭 Nenhum registro para ${empresa.nome} em ${ano}. (Deletando do banco se houver lixo)`);
    await supabase.from('diarias').delete().eq('ano', ano).eq('empresa', empresa.codigo);
    return 0;
  }

  const mapRegistros = new Map<string, any>();

  for (let idx = 0; idx < data.length; idx++) {
    const item = data[idx];
    const nempg = item.NEMPG || `sem_empenho_${empresa.codigo}_${idx}`;
    const key = `${ano}_${nempg}`;

    const orgaoSplit = splitCodigoDescricao(item.ORGAO);
    const orgaoCod = item.CODORGAO || orgaoSplit.codigo || null;
    const orgaoNome = item.NOMEORGAO || orgaoSplit.descricao || null;

    const unidSplit = splitCodigoDescricao(item.UNIDADE);
    const unidCod = item.CODUNIDADE || unidSplit.codigo || null;
    const unidNome = item.NOMEUNIDADE || unidSplit.descricao || null;

    const valorAtual = parseValor(item.VALOR);
    const valorAnuladoAtual = parseValor(item.VALORANULADO);
    const quantAtual = parseQuantidade(item.QUANT, item.DESCRICAO);
    const dataAtual = parseDateBR(item.DATA);

    if (mapRegistros.has(key)) {
      const ex = mapRegistros.get(key);
      ex.valor += valorAtual;
      ex.valor_anulado += valorAnuladoAtual;
      if (dataAtual && (!ex.data || dataAtual > ex.data)) {
        ex.data = dataAtual;
      }
      if (item.ORDEMPAGAMENTO && !String(ex.ordem_pagamento || '').includes(String(item.ORDEMPAGAMENTO))) {
        ex.ordem_pagamento = ex.ordem_pagamento ? `${ex.ordem_pagamento}, ${item.ORDEMPAGAMENTO}` : item.ORDEMPAGAMENTO;
      }
      if ((item.DESCRICAO || '').length > (ex.descricao || '').length) {
        ex.descricao = item.DESCRICAO;
      }
      ex.quantidade += quantAtual;
    } else {
      mapRegistros.set(key, {
        ano,
        nempg: item.NEMPG || null,
        numero_liquidacao: item.NUMEROLIQUIDACAO || null,
        ordem_pagamento: item.ORDEMPAGAMENTO || null,
        data: dataAtual,
        valor: valorAtual,
        valor_anulado: valorAnuladoAtual,
        descricao: item.DESCRICAO || '',
        favorecido: item.FAVORECIDO || 'NÃO INFORMADO',
        cargo: item.CARGO || '',
        cpf_formatado: item.CPFFORMATADO || '',
        orgao_codigo: orgaoCod,
        orgao_nome: orgaoNome,
        unidade_codigo: unidCod,
        unidade_nome: unidNome,
        elemento_nome: item.NOME_ELEMENTO || '',
        quantidade: quantAtual,
        origem: 'Contreina API',
        empresa: item.EMPRESA || empresa.codigo,
        empresa_nome: empresa.nome
      });
    }
  }

  const registros = Array.from(mapRegistros.values());
  console.log(`   📄 Encontrados ${data.length} itens brutos -> ${registros.length} empenhos/diárias consolidados.`);

  // Delta Sync: agora que baixamos com sucesso, deletamos APENAS os registros deste ano e desta empresa
  await supabase.from('diarias').delete().eq('ano', ano).eq('empresa', empresa.codigo);

  const CHUNK_SIZE = 100;
  for (let i = 0; i < registros.length; i += CHUNK_SIZE) {
    const chunk = registros.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('diarias').insert(chunk);
    if (error) {
      console.error(`   ✗ Erro ao inserir lote:`, error.message);
      throw error;
    }
  }

  console.log(`   ✓ Inseridos ${registros.length} registros para ${empresa.nome} (${ano})`);
  return registros.length;
}

export async function executarImportacaoDiarias() {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  
  // Vamos puxar sempre o ano anterior e o atual para garantir fechamentos (ex: Dezembro fechando em Janeiro)
  const anos = [anoAtual - 1, anoAtual];
  
  console.log('\n========================================');
  console.log(`SINCRONIZAÇÃO DE DIÁRIAS VIA API CONTREINA`);
  console.log(`Anos a processar: ${anos.join(', ')}`);
  console.log('========================================\n');

  for (const ano of anos) {
    console.log(`\n=== 📅 EXERCÍCIO ${ano} ===`);
    let totalAno = 0;
    for (const emp of EMPRESAS) {
      try {
        const count = await importarEmpresaAno(emp, ano);
        totalAno += count;
      } catch (e: any) {
        console.error(`✗ Erro crítico na empresa ${emp.nome} em ${ano}:`, e.message);
      }
    }
    console.log(`--- Total de diárias em ${ano}: ${totalAno} ---\n`);
  }

  console.log('========================================');
  console.log('✓ SINCRONIZAÇÃO DE DIÁRIAS CONCLUÍDA');
  console.log('========================================\n');
}

// Para execução manual no terminal
if (typeof require !== 'undefined' && require.main === module) {
    executarImportacaoDiarias();
}
