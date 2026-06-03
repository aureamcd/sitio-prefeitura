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

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    db: {
      schema: 'transparencia'
    }
  }
);

// ======================================================
// CONFIG
// ======================================================

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

const BASE_URL =
  'https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Despesas';

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

function parseDateBR(date: string | null | undefined) {
  if (!date) return null;

  const onlyDate = date.split(' ')[0];

  const [day, month, year] = onlyDate.split('/');

  if (!day || !month || !year) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function splitCodigoDescricao(
  valor: string | null | undefined
) {
  if (!valor) {
    return {
      codigo: '',
      descricao: ''
    };
  }

  const parts = valor.split(' - ');

  return {
    codigo: parts[0]?.trim() || '',
    descricao:
      parts.slice(1).join(' - ').trim() || ''
  };
}

async function fetchJson(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Erro HTTP ${response.status}`
    );
  }

  return response.json();
}

// ======================================================
// URLS
// ======================================================

function buildDespesasGeraisUrl(
  ano: number,
  empresa: string
) {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem: 'DespesasGerais',
    DiaInicioPeriodo: '01',
    MesInicialPeriodo: '01',
    DiaFinalPeriodo: '31',
    MesFinalPeriodo: '12',
    Ano: String(ano),
    Empresa: empresa,
    MostrarFornecedor: 'True',
    MostraDadosConsolidado: 'False',
    UFParaFiltroCOVID: '',
    MostrarCNPJFornecedor: 'True',
    ApenasIDEmpenho: 'False'
  });

  return `${BASE_URL}/?${params.toString()}`;
}

function buildDetalhesEmpenhoUrl(
  ano: number,
  empresa: string,
  numeroEmpenho: string,
  tipoEmpenho: string
) {
  const params = new URLSearchParams({
    ConectarExercicio: String(ano),
    Listagem:
      'DetalhesEmpenhoPorNumeroEmpenho',
    intNumeroEmpenho: numeroEmpenho,
    strTipoEmpenho: tipoEmpenho,
    Empresa: empresa,
    bolMostrarFornecedor: 'False'
  });

  return `${BASE_URL}/?${params.toString()}`;
}

// ======================================================
// DETALHES
// ======================================================

async function buscarDetalhesEmpenho(
  ano: number,
  empresa: string,
  numeroEmpenho: string,
  tipoEmpenho: string
) {
  try {
    const url = buildDetalhesEmpenhoUrl(
      ano,
      empresa,
      numeroEmpenho,
      tipoEmpenho
    );

    const data = await fetchJson(url);

    return data?.[0] || null;
  } catch {
    return null;
  }
}

// ======================================================
// MONTAR REGISTRO
// ======================================================

async function montarRegistro(
  item: any,
  empresaNome: string,
  ano: number
) {
  const detalhes =
    await buscarDetalhesEmpenho(
      ano,
      item.EMPRESA,
      item.CODIGO,
      item.TPEM
    );

  const orgao = splitCodigoDescricao(
    detalhes?.ORGAO
  );

  const unidade = splitCodigoDescricao(
    detalhes?.UNIDADE
  );

  const funcao = splitCodigoDescricao(
    detalhes?.FUNCAO
  );

  const subfuncao = splitCodigoDescricao(
    detalhes?.SUBFUNCAO
  );

  const programa = splitCodigoDescricao(
    detalhes?.PROGRAMA
  );

  const projetoAtividade =
    splitCodigoDescricao(
      detalhes?.PROJETOATIVIDADE
    );

  const categoriaEconomica =
    splitCodigoDescricao(
      detalhes?.CATEGORIAECONOMICA
    );

  const grupoNatureza =
    splitCodigoDescricao(
      detalhes?.GRUPONATUREZA
    );

  const modalidade =
    splitCodigoDescricao(
      detalhes?.MODALIDADEAPLICACAO
    );

  const natureza = splitCodigoDescricao(
    detalhes?.NATUREZA
  );

  const elemento = splitCodigoDescricao(
    detalhes?.ELEMENTO
  );

  const desdobro = splitCodigoDescricao(
    detalhes?.DESDOBRO
  );

  const fonteGrupo =
    splitCodigoDescricao(
      detalhes?.FONGRUPO
    );

  const fonteCodigo =
    splitCodigoDescricao(
      detalhes?.FONCODIGO
    );

  const fonteStn =
    splitCodigoDescricao(
      detalhes?.FONTE_STN
    );

  const vinculo = splitCodigoDescricao(
    detalhes?.VINCULO
  );

  return {
    ano,

    empresa: item.EMPRESA,
    empresa_nome: empresaNome,

    numero_empenho: item.CODIGO,
    tipo_empenho: item.TPEM,

    pkemp: item.PKEMP,

    data_empenho: parseDateBR(
      item.DATAE
    ),

    credor_nome: item.NOMEFOR,
    credor_documento:
      item.CPFFORMATADO,

    empenhado: parseValor(
      item.EMPENHADO
    ),

    liquidado: parseValor(
      item.LIQUIDADO
    ),

    pago: parseValor(item.PAGO),

    objeto:
      detalhes?.HISTORICO ||
      item.PRODU ||
      '',

    orgao_codigo: orgao.codigo,
    orgao_nome: orgao.descricao,

    unidade_codigo: unidade.codigo,
    unidade_nome: unidade.descricao,

    funcao_codigo: funcao.codigo,
    funcao_nome: funcao.descricao,

    subfuncao_codigo:
      subfuncao.codigo,

    subfuncao_nome:
      subfuncao.descricao,

    programa_codigo:
      programa.codigo,

    programa_nome:
      programa.descricao,

    projeto_atividade_codigo:
      projetoAtividade.codigo,

    projeto_atividade_nome:
      projetoAtividade.descricao,

    natureza_codigo:
      natureza.codigo,

    natureza_nome:
      natureza.descricao,

    categoria_economica_codigo:
      categoriaEconomica.codigo,

    categoria_economica_nome:
      categoriaEconomica.descricao,

    grupo_natureza_codigo:
      grupoNatureza.codigo,

    grupo_natureza_nome:
      grupoNatureza.descricao,

    modalidade_codigo:
      modalidade.codigo,

    modalidade_nome:
      modalidade.descricao,

    elemento_codigo:
      elemento.codigo,

    elemento_nome:
      elemento.descricao,

    desdobro_codigo:
      desdobro.codigo,

    desdobro_nome:
      desdobro.descricao,

    fonte_stn_codigo:
      fonteStn.codigo,

    fonte_stn_nome:
      fonteStn.descricao,

    fonte_grupo_codigo:
      fonteGrupo.codigo,

    fonte_grupo_nome:
      fonteGrupo.descricao,

    fonte_codigo:
      fonteCodigo.codigo,

    fonte_codigo_nome:
      fonteCodigo.descricao,

    vinculo_codigo:
      vinculo.codigo,

    vinculo_nome:
      vinculo.descricao,

    ficha:
      detalhes?.FICHA ||
      item.FICHA ||
      '',

    licitacao_numero:
      item.NUMLICIT || '',

    licitacao_modalidade:
      item.LICIT || '',

    licitacao_descricao:
      item.DESCLICIT_DETALHESEMPENHO ||
      '',

    processo: item.PROC || ''
  };
}

// ======================================================
// IMPORTAÇÃO EMPRESA
// ======================================================

async function importarEmpresa(
  empresa: any,
  ano: number
) {
  console.log(
    `\nImportando ${empresa.nome}`
  );

  const url = buildDespesasGeraisUrl(
    ano,
    empresa.codigo
  );

  console.log(url);

  const data = await fetchJson(url);

  console.log(
    `→ ${data.length} empenhos encontrados`
  );

  const registros: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    console.log(
      `[${i + 1}/${data.length}] ${item.CODIGO}`
    );

    const registro =
      await montarRegistro(
        item,
        empresa.nome,
        ano
      );

    registros.push(registro);
  }

  const CHUNK_SIZE = 100;

  for (
    let i = 0;
    i < registros.length;
    i += CHUNK_SIZE
  ) {
    const chunk = registros.slice(
      i,
      i + CHUNK_SIZE
    );

    const { error } = await supabase
      .from('despesas')
      .insert(chunk);

    if (error) {
      throw error;
    }
  }

  console.log(
    `✓ ${empresa.nome} finalizado`
  );
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  const args = process.argv.slice(2);

  const ano = Number(args[0]);

  if (!ano) {
    console.error(
      'Informe o ano.\nEx: 2025'
    );

    process.exit(1);
  }

  console.log('\n========================');
  console.log(
    `IMPORTAÇÃO DESPESAS ${ano}`
  );
  console.log('========================\n');

  console.log(
    `Limpando despesas ${ano}...`
  );

  const { error: deleteError } =
    await supabase
      .from('despesas')
      .delete()
      .eq('ano', ano);

  if (deleteError) {
    throw deleteError;
  }

  console.log('✓ Dados removidos');

  for (const empresa of EMPRESAS) {
    try {
      await importarEmpresa(
        empresa,
        ano
      );
    } catch (error: any) {
      console.error(
        `✗ ${empresa.nome}:`,
        error.message
      );
    }
  }

  console.log('\n========================');
  console.log('✓ FINALIZADO');
  console.log('========================\n');
}

main();