import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ======================================================
// CONFIG
// ======================================================

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'transparencia' }
});

// ======================================================
// TYPES
// ======================================================

interface Empresa {
  codigo: string;
  nome: string;
}

// ======================================================
// HELPERS
// ======================================================

function limparCodigo(codigo: string): string {
  return codigo.replace(/\./g, '');
}

// Retorna nome do nível
function getNomeNivel(nivel: number): string {
  const map: Record<number, string> = {
    1: 'Categoria',
    2: 'Origem',
    3: 'Espécie',
    4: 'Rubrica',
    5: 'Alínea',
    6: 'Subalínea',
    7: 'Detalhamento',
    8: 'Desdobramento 2',
    9: 'Desdobramento 3',
    10: 'Analítica'
  };
  return map[nivel] || 'Item';
}

// 3. Gerar código pai
function gerarCodigoPai(codigo: string): string | null {
  const partes = codigo.split('.');

  if (partes.length !== 5) return null;

  const pai = [...partes];

  for (let i = pai.length - 1; i >= 0; i--) {
    const valor = pai[i];

    if (valor !== '00' && valor !== '0' && valor !== '000') {
      pai[i] = '0'.repeat(valor.length);

      for (let j = i + 1; j < pai.length; j++) {
        pai[j] = '0'.repeat(pai[j].length);
      }

      break;
    }
  }

  const resultado = pai.join('.');

  if (resultado === codigo) return null;

  return resultado;
}

function parseValor(valor: string | number | null | undefined): number {
  if (!valor) return 0;
  if (typeof valor === 'number') return valor;
  const limpo = valor.replace(/\./g, '').replace(',', '.');
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

// ======================================================
// AGRUPAR DADOS API
// ======================================================

// Função agruparDadosApi removida para manter os dados originais da API

// ======================================================
// MONTAR REGISTRO
// ======================================================

function montarRegistro(dadoApi: any, empresa: Empresa) {
  const codigoLimpo = limparCodigo(dadoApi.CODIGO);
  // Usa a ORDEM da API diretamente como nível (1 a 10)
  const nivel = parseInt(dadoApi.ORDEM, 10) || 8;
  const nomeNivel = getNomeNivel(nivel);
  const codigoPai = gerarCodigoPai(dadoApi.CODIGO);

  const padded = codigoLimpo.padEnd(10, '0');

  const categoria = padded.substring(0, 1);
  const origem = padded.substring(1, 2);
  const especie = padded.substring(2, 3);
  const rubrica = padded.substring(3, 4);
  const alinea = padded.substring(4, 6);
  const subalinea = padded.substring(6, 10);

  return {
    ano: 2026,
    empresa: empresa.codigo,
    empresa_nome: empresa.nome,
    codigo_contabil: dadoApi.CODIGO,
    codigo_limpo: codigoLimpo,
    descricao: dadoApi.NOME,
    nivel,
    nome_nivel: nomeNivel,
    codigo_pai: codigoPai,
    categoria,
    origem,
    especie,
    rubrica,
    alinea,
    subalinea,
    has_children: false,
    is_analitica: nivel >= 7,
    fonte_stn: dadoApi.FONTESTN || '',
    fonte_recurso: dadoApi.FONTE || '',
    cod_aplicacao: dadoApi.VINCODIGO || '',
    previsto_inicial: parseValor(dadoApi.PREVISAO_INICIAL),
    previsto_atualizado: parseValor(dadoApi.PREVISAO_ATUALIZADA),
    arrecadado_periodo: parseValor(dadoApi.ARRECADADO_PERIODO),
    arrecadado_total: parseValor(dadoApi.ARRECADADO_TOTAL)
  };
}

// ======================================================
// EMPRESAS
// ======================================================

async function buscarEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase.from('empresas').select('codigo, nome').order('codigo');
  if (error) throw error;
  return (data || []).map((e: any) => ({ codigo: String(e.codigo), nome: e.nome }));
}

// ======================================================
// API
// ======================================================

async function buscarReceitasEmpresa(empresa: string) {
  const url = `https://contreina.padremarcos.pi.gov.br/transparencia/VersaoJson/Receitas/?ConectarExercicio=2026&Listagem=ReceitaOrcamentaria&DiaInicioPeriodo=01&MesInicialPeriodo=01&DiaFinalPeriodo=31&MesFinalPeriodo=12&Ano=2026&Empresa=${empresa}&MostraDadosConsolidado=False`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Erro ao converter JSON');
  }
}

// ======================================================
// SINCRONIZAR EMPRESA
// ======================================================

async function sincronizarEmpresa(empresa: Empresa, index: number, total: number) {
  const start = Date.now();
  console.log(`\\n[${index}/${total}] ${empresa.nome}`);

  try {
    const dadosApiRaw = await buscarReceitasEmpresa(empresa.codigo);
    if (!Array.isArray(dadosApiRaw)) throw new Error('API inválida');

    // Removemos o agrupamento para manter todos os registros originais
    const registros = dadosApiRaw.map(dado => montarRegistro(dado, empresa));

    console.log(`→ ${registros.length} registros (sem agrupar)`);

    const CHUNK_SIZE = 200;
    for (let i = 0; i < registros.length; i += CHUNK_SIZE) {
      const chunk = registros.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from('receitas').insert(chunk);
      if (error) throw error;
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✓ Finalizado em ${elapsed}s`);
  } catch (error: any) {
    console.error(`✗ ${empresa.nome}`, error.message);
  }
}

// ======================================================
// HAS CHILDREN & ANALITICAS
// ======================================================

async function atualizarHasChildren() {
  console.log('\\nAtualizando has_children...');
  const { error } = await supabase.rpc('atualizar_receitas_has_children');
  // Se a RPC falhar, não damos throw para não quebrar tudo caso não exista no DB
  if (error) {
    console.log('RPC atualizar_receitas_has_children falhou (pode não existir).');
  } else {
    console.log('✓ has_children atualizado');
  }
}

async function atualizarAnaliticas() {
  console.log('\\nAtualizando is_analitica...');
  const { error } = await supabase.rpc('atualizar_receitas_analiticas');
  if (error) {
    console.log('RPC atualizar_receitas_analiticas falhou (pode não existir).');
  } else {
    console.log('✓ is_analitica atualizado');
  }
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  console.log('\\n====================================');
  console.log('SINCRONIZAÇÃO RECEITAS 2026');
  console.log('====================================\\n');

  const startTotal = Date.now();
  try {
    console.log('Limpando dados antigos de 2026...');
    const { error: deleteError } = await supabase.from('receitas').delete().eq('ano', 2026);
    if (deleteError) {
      console.error('Erro ao limpar a tabela:', deleteError.message);
      return;
    }
    console.log('✓ Tabela limpa.');

    const empresas = await buscarEmpresas();
    for (let i = 0; i < empresas.length; i++) {
      await sincronizarEmpresa(empresas[i], i + 1, empresas.length);
    }

    await atualizarHasChildren();
    await atualizarAnaliticas();

    const elapsed = ((Date.now() - startTotal) / 1000).toFixed(2);
    console.log('\\n====================================');
    console.log(`✓ SINCRONIZAÇÃO FINALIZADA (${elapsed}s)`);
    console.log('====================================\\n');
  } catch (error: any) {
    console.error('\\nERRO GERAL:', error.message);
  }
}

main();