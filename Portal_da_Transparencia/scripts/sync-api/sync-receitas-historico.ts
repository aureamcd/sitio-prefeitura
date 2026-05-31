import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getNivelFromCodigo,
  getTipoNivelFromNivel,
  computeParentSafe
} from '../../lib/receitas/receitasTree.js';

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
// CONFIG EMPRESAS
// ======================================================

const EMPRESA_TO_FOLDER: Record<string, string> = {
  '1': 'pref',
  '3': 'saude',
  '4': 'fundeb',
  '5': 'fmas',
  '6': 'hospital',
  '7': 'rpps',
  '8': 'direitos',
  '9': 'meio-ambiente',
  '10': 'cultura'
};

// ======================================================
// HELPERS
// ======================================================

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

function limparCodigo(codigo: string): string {
  return codigo.replace(/\./g, '');
}

function parseValor(
  valor: string | number | null | undefined
): number {
  if (valor === null || valor === undefined) {
    return 0;
  }

  if (typeof valor === 'number') {
    return valor;
  }

  let v = String(valor).trim();

  if (!v) {
    return 0;
  }

  // Remove aspas
  v = v.replace(/"/g, '');

  // Caso brasileiro: 1.234,56
  if (v.includes(',') && v.includes('.')) {
    v = v.replace(/\./g, '').replace(',', '.');
  }

  // Caso só com vírgula: 1234,56
  else if (v.includes(',')) {
    v = v.replace(',', '.');
  }

  // Caso americano: 1234.56
  // não faz nada

  const numero = parseFloat(v);

  return isNaN(numero) ? 0 : numero;
}

function isLinhaTotal(codigo: string) {
  return (
    !codigo ||
    codigo.toLowerCase().includes('total')
  );
}

function detectarAnalitica(
  fonteRecurso: string,
  codAplicacao: string
) {
  return !!(
    fonteRecurso?.trim() ||
    codAplicacao?.trim()
  );
}

// ======================================================
// EMPRESAS
// ======================================================

async function buscarEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('codigo, nome')
    .order('codigo');

  if (error) {
    throw error;
  }

  return (data || []).map((e: any) => ({
    codigo: String(e.codigo),
    nome: e.nome
  }));
}

// ======================================================
// CSV
// ======================================================

function lerCsvLinhas(csvPath: string) {
  const csvContent = fs.readFileSync(csvPath, 'latin1');

  return csvContent
    .split(/\r?\n/)
    .filter((line) => line.trim());
}

// ======================================================
// REGISTRO
// ======================================================

function montarRegistro(
  row: string[],
  empresa: Empresa,
  ano: number,
  codigoCount: Map<string, number>
) {
  const codigo = row[0]?.trim();

  if (isLinhaTotal(codigo)) {
    return null;
  }

  const descricao = row[1]?.trim() || '';

  const codAplicacao = row[2]?.trim() || '';

  const fonteStn = row[3]?.trim() || '';

  const fonteRecurso = row[4]?.trim() || '';

  const previstoInicial = row[5]?.trim() || '0';

  const previstoAtualizado = row[6]?.trim() || '0';

  const arrecadadoPeriodo = row[7]?.trim() || '0';

  const arrecadadoTotal = row[8]?.trim() || '0';

  const codigoLimpo = limparCodigo(codigo);

  const countAtual = codigoCount.get(codigo) || 0;
  codigoCount.set(codigo, countAtual + 1);
  const isAnalitica = countAtual > 0;

  const nivelBase = getNivelFromCodigo(codigo);

  const nivel = isAnalitica
    ? nivelBase + 1
    : nivelBase;

  const nomeNivel = isAnalitica
    ? 'Analítica'
    : getTipoNivelFromNivel(nivelBase);

  const codigoPai = gerarCodigoPai(codigo);

  return {
    ano,

    empresa: empresa.codigo,
    empresa_nome: empresa.nome,

    codigo_contabil: codigo,
    codigo_limpo: codigoLimpo,

    descricao,

    nivel,
    nome_nivel: nomeNivel,

    codigo_pai: codigoPai,

    categoria: codigoLimpo[0] || '',
    origem: codigoLimpo[1] || '',
    especie: codigoLimpo[2] || '',
    rubrica: codigoLimpo[3] || '',
    alinea: codigoLimpo.slice(4, 6),
    subalinea: codigoLimpo.slice(6, 10),

    is_analitica: isAnalitica,

    has_children: false,

    fonte_stn: fonteStn,
    fonte_recurso: fonteRecurso,
    cod_aplicacao: codAplicacao,

    previsto_inicial: parseValor(previstoInicial),
    previsto_atualizado: parseValor(previstoAtualizado),
    arrecadado_periodo: parseValor(arrecadadoPeriodo),
    arrecadado_total: parseValor(arrecadadoTotal)
  };
}

// ======================================================
// HAS CHILDREN
// ======================================================

function aplicarHasChildren(registros: any[]) {
  const mapa = new Map<string, boolean>();

  for (const item of registros) {
    if (item.codigo_pai) {
      mapa.set(
        `${item.ano}_${item.empresa}_${item.codigo_pai}`,
        true
      );
    }
  }

  for (const item of registros) {
    const key = `${item.ano}_${item.empresa}_${item.codigo_contabil}`;

    item.has_children = mapa.has(key);
  }

  return registros;
}

// ======================================================
// REMOVER DUPLICADOS
// ======================================================

function removerDuplicados(registros: any[]) {
  const map = new Map<string, any>();

  for (const item of registros) {
    const key = [
      item.ano,
      item.empresa,
      item.codigo_contabil,
      item.fonte_stn || '',
      item.fonte_recurso || '',
      item.cod_aplicacao || ''
    ].join('|');

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

// ======================================================
// IMPORTAR EMPRESA
// ======================================================

async function sincronizarEmpresa(
  empresa: Empresa,
  index: number,
  total: number,
  ano: number
) {
  const start = Date.now();

  console.log(`\n[${index}/${total}] ${empresa.nome}`);

  try {
    const folder = EMPRESA_TO_FOLDER[empresa.codigo];

    if (!folder) {
      console.log(
        `  ✗ Pasta não mapeada`
      );
      return;
    }

    const csvPath = path.join(
      __dirname,
      'csv',
      folder,
      `Portal Transparencia Receitas Acumuladas - Exercício ${ano}.csv`
    );

    if (!fs.existsSync(csvPath)) {
      console.log(
        `  ✗ CSV não encontrado: ${csvPath}`
      );
      return;
    }

    console.log(`  [CSV] ${csvPath}`);

    const linhas = lerCsvLinhas(csvPath);

    const registros: any[] = [];
    const codigoCount = new Map<string, number>();

    for (let i = 1; i < linhas.length; i++) {
      const cols = linhas[i].split(';');

      if (cols.length < 9) {
        continue;
      }

      const registro = montarRegistro(
        cols,
        empresa,
        ano,
        codigoCount
      );

      if (registro) {
        registros.push(registro);
      }
    }

    const semDuplicados =
      removerDuplicados(registros);

    aplicarHasChildren(semDuplicados);

    console.log(
      `  → ${semDuplicados.length} registros`
    );

    const CHUNK_SIZE = 200;

    for (
      let i = 0;
      i < semDuplicados.length;
      i += CHUNK_SIZE
    ) {
      const chunk = semDuplicados.slice(
        i,
        i + CHUNK_SIZE
      );

      const { error } = await supabase
        .from('receitas')
        .insert(chunk);

      if (error) {
        throw error;
      }
    }

    const elapsed = (
      (Date.now() - start) /
      1000
    ).toFixed(2);

    console.log(
      `  ✓ Finalizado em ${elapsed}s`
    );
  } catch (error: any) {
    console.error(
      `  ✗ ${empresa.nome}: ${error.message}`
    );
  }
}

// ======================================================
// MAIN
// ======================================================

async function main() {
  const args = process.argv.slice(2);

  const anoStr = args[0];

  if (!anoStr || isNaN(Number(anoStr))) {
    console.error(
      'Informe o ano. Ex: 2025'
    );

    process.exit(1);
  }

  const ANO = Number(anoStr);

  console.log('\n====================================');
  console.log(
    `SINCRONIZAÇÃO RECEITAS ${ANO}`
  );
  console.log('====================================\n');

  const startTotal = Date.now();

  try {
    console.log(
      `Limpando receitas de ${ANO}...`
    );

    const { error: deleteError } =
      await supabase
        .from('receitas')
        .delete()
        .eq('ano', ANO);

    if (deleteError) {
      throw deleteError;
    }

    console.log(
      '✓ Dados antigos removidos'
    );

    const empresas =
      await buscarEmpresas();

    for (
      let i = 0;
      i < empresas.length;
      i++
    ) {
      await sincronizarEmpresa(
        empresas[i],
        i + 1,
        empresas.length,
        ANO
      );
    }

    const elapsed = (
      (Date.now() - startTotal) /
      1000
    ).toFixed(2);

    console.log('\n====================================');
    console.log(
      `✓ FINALIZADO EM ${elapsed}s`
    );
    console.log('====================================\n');
  } catch (error: any) {
    console.error(
      '\nERRO GERAL:',
      error.message
    );
  }
}

main();