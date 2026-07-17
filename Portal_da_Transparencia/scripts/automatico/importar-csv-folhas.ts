/**
 * importar-csv-folhas.ts
 *
 * Importa arquivos CSV exportados do portal de transparência Fiorilli (Servidores.ASPX)
 * para a tabela `transparencia.remuneracoes` no Supabase.
 *
 * Uso:
 *   npx tsx scripts/automatico/importar-csv-folhas.ts
 *   npx tsx scripts/automatico/importar-csv-folhas.ts --arquivo=csv/folhas/2025_05_folha-mensal.csv
 *   npx tsx scripts/automatico/importar-csv-folhas.ts --ano=2023
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';

dotenv.config();

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não definidas (fallback em tempo de build).');
}

const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder-key',
  {
    db: { schema: 'transparencia' },
  }
);

// ---------------------------------------------------------------------------
// Mapeamento mês → nome em português (para construir a referência)
// ---------------------------------------------------------------------------

const MESES_NOME: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

// ---------------------------------------------------------------------------
// Mapeamento tipo do arquivo → tipo no banco
// ---------------------------------------------------------------------------

const TIPO_MAP: Record<string, string> = {
  'folha-mensal': 'Folha Mensal',
  'rescisao': 'Rescisão',
  'complementar-com-encargos': 'Folha Complementar c/ Encargos',
  'complementar-sem-encargos': 'Folha Complementar s/ Encargos',
  'complementar-rescisao': 'Folha Compl. Rescisão',
  'ferias': 'Férias',
  'adiantamento-13': 'Adiantamento 13º Salário',
  'fechamento-13': 'Fechamento 13º',
  'geral': 'Geral', // Suporte para arquivos que contém todos os tipos
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const BATCH_SIZE = 200;
const CSV_DIR = path.resolve(process.cwd(), 'csv', 'folhas');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function obterTipoFolha(referenciaNome: any): string {
  if (!referenciaNome) return 'Folha Mensal';
  const texto = String(referenciaNome).trim();
  if (texto.includes(' - ')) {
    return texto.split(' - ')[0].trim();
  }
  return texto;
}

function converterNumero(valor: any): number | null {
  if (!valor) return null;
  const numero = Number(
    String(valor)
      .replace(/\./g, '')
      .replace(',', '.')
      .trim(),
  );
  return isNaN(numero) ? null : numero;
}

function limparTexto(valor: any): string | null {
  if (valor === undefined || valor === null || valor === '') return null;
  return String(valor).normalize('NFC').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Detecção flexível de colunas
// ---------------------------------------------------------------------------

interface ColumnMap {
  referencia: number;
  nome: number;
  matricula: number;
  cargo: number;
  vinculo: number;
  secretaria: number;
  lotacao: number;
  carga_horaria: number;
  remuneracao_bruta: number;
  descontos: number;
  remuneracao_liquida: number;
}

function detectarColunas(headers: string[]): ColumnMap {
  const lower = headers.map((h) => h.toLowerCase().trim());

  function encontrar(...keywords: string[]): number {
    for (const kw of keywords) {
      const idx = lower.findIndex((h) => h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  }

  const map: ColumnMap = {
    referencia: encontrar('referência', 'referencia'),
    nome: encontrar('nome'),
    matricula: encontrar('matrícula', 'matricula', 'registro'),
    cargo: encontrar('cargo'),
    vinculo: encontrar('vínculo', 'vinculo', 'função', 'funcao'),
    secretaria: encontrar('divisão', 'divisao', 'secretaria'),
    lotacao: encontrar('subdivisão', 'subdivisao', 'unidade', 'lotação', 'lotacao'),
    carga_horaria: encontrar('carga', 'horasemanal', 'hora'),
    remuneracao_bruta: encontrar('provento', 'rendimento'),
    descontos: encontrar('desconto'),
    remuneracao_liquida: encontrar('líquido', 'liquido'),
  };

  // Validação mínima
  const obrigatorios: (keyof ColumnMap)[] = ['nome', 'matricula'];
  for (const campo of obrigatorios) {
    if (map[campo] === -1) {
      throw new Error(
        `Coluna obrigatória "${campo}" não encontrada. Headers: ${headers.join(' | ')}`,
      );
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Leitura do CSV com detecção de encoding
// ---------------------------------------------------------------------------

function lerArquivoCSV(caminho: string): string {
  const buffer = fs.readFileSync(caminho);

  // Tenta UTF-8 primeiro
  const utf8 = buffer.toString('utf-8');
  // Heurística: se contém caractere de substituição, provavelmente não é UTF-8 válido
  if (!utf8.includes('\uFFFD')) {
    // Verifica se parece ok — procura acentos comuns do português
    const temAcentos = /[áéíóúàâêôãõçÁÉÍÓÚÀÂÊÔÃÕÇ]/.test(utf8);
    const temGarbled = /Ã[¡£©]/u.test(utf8); // Padrão comum de latin1 lido como UTF-8

    if (temAcentos && !temGarbled) {
      return utf8;
    }
  }

  // Fallback: ler como latin1 / windows-1252
  try {
    return iconv.decode(buffer, 'win1252');
  } catch {
    // Se iconv não estiver disponível, usa latin1 nativo do Node
    return buffer.toString('latin1');
  }
}

// ---------------------------------------------------------------------------
// Parser de CSV simples (semicolon-delimited, com suporte a aspas)
// ---------------------------------------------------------------------------

function parsearCSV(conteudo: string): string[][] {
  const linhas: string[][] = [];
  const texto = conteudo.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = texto.split('\n');

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed) continue;

    const campos: string[] = [];
    let atual = '';
    let dentroAspas = false;

    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];

      if (char === '"') {
        if (dentroAspas && trimmed[i + 1] === '"') {
          atual += '"';
          i++; // pula aspas duplicadas
        } else {
          dentroAspas = !dentroAspas;
        }
      } else if (char === ';' && !dentroAspas) {
        campos.push(atual.trim());
        atual = '';
      } else {
        atual += char;
      }
    }
    campos.push(atual.trim());
    linhas.push(campos);
  }

  return linhas;
}

// ---------------------------------------------------------------------------
// Extração de metadados do nome do arquivo
// ---------------------------------------------------------------------------

interface MetadadosArquivo {
  ano: number;
  mes: number;
  tipo: string;
  tipoSlug: string;
}

function extrairMetadados(nomeArquivo: string): MetadadosArquivo {
  const base = path.basename(nomeArquivo, '.csv');
  // Formato: {ano}_{mes}_{tipo}
  const match = base.match(/^(\d{4})_(\d{1,2})_(.+)$/);

  if (!match) {
    throw new Error(
      `Nome de arquivo inválido: "${nomeArquivo}". Esperado formato: {ano}_{mes}_{tipo}.csv`,
    );
  }

  const ano = parseInt(match[1], 10);
  const mes = parseInt(match[2], 10);
  const tipoSlug = match[3];
  const tipo = TIPO_MAP[tipoSlug];

  if (!tipo) {
    throw new Error(
      `Tipo desconhecido: "${tipoSlug}". Tipos válidos: ${Object.keys(TIPO_MAP).join(', ')}`,
    );
  }

  return { ano, mes, tipo, tipoSlug };
}

// ---------------------------------------------------------------------------
// Importação de um único arquivo
// ---------------------------------------------------------------------------

async function importarArquivo(
  caminhoArquivo: string,
): Promise<{ inseridos: number; erros: number }> {
  const nomeArquivo = path.basename(caminhoArquivo);
  console.log(`\n📄 Processando: ${nomeArquivo}`);

  // 1. Extrair metadados do nome
  const { ano, mes, tipo } = extrairMetadados(nomeArquivo);
  console.log(`   📅 Ano: ${ano} | Mês: ${mes} | Tipo: ${tipo}`);

  // 2. Ler e parsear CSV
  const conteudo = lerArquivoCSV(caminhoArquivo);
  const linhas = parsearCSV(conteudo);

  if (linhas.length < 2) {
    console.warn(`   ⚠️  Arquivo vazio ou sem dados.`);
    return { inseridos: 0, erros: 0 };
  }

  // 3. Detectar colunas pelo cabeçalho
  const headers = linhas[0];
  console.log(`   📊 Colunas detectadas: ${headers.join(' | ')}`);

  let colMap: ColumnMap;
  try {
    colMap = detectarColunas(headers);
  } catch (err: any) {
    console.error(`   ❌ ${err.message}`);
    return { inseridos: 0, erros: 1 };
  }

  // 5. Montar registros
  const registros: any[] = [];
  const dataRows = linhas.slice(1);

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];

    // Pular linhas vazias ou que parecem totalizadores
    const matriculaRaw = colMap.matricula !== -1 ? row[colMap.matricula] : null;
    const nomeRaw = colMap.nome !== -1 ? row[colMap.nome] : null;

    if (!matriculaRaw && !nomeRaw) continue;
    if (!matriculaRaw || matriculaRaw.trim() === '') continue;

    const cargo = colMap.cargo !== -1 ? limparTexto(row[colMap.cargo]) : null;

    // Define a referência e o tipo a partir da coluna, ou cai para o padrão do arquivo
    const refLinha = colMap.referencia !== -1 && row[colMap.referencia] ? limparTexto(row[colMap.referencia]) : null;
    const tipoLinha = refLinha ? obterTipoFolha(refLinha) : tipo;
    const referenciaFinal = refLinha || nomeArquivo;

    const registro = {
      ano,
      mes,
      matricula: limparTexto(matriculaRaw),
      nome: limparTexto(nomeRaw),
      cargo,
      funcao: cargo, // funcao = mesmo que cargo
      vinculo: colMap.vinculo !== -1 ? limparTexto(row[colMap.vinculo]) : null,
      lotacao: colMap.lotacao !== -1 ? limparTexto(row[colMap.lotacao]) : null,
      secretaria: colMap.secretaria !== -1 ? limparTexto(row[colMap.secretaria]) : null,
      carga_horaria: colMap.carga_horaria !== -1 ? limparTexto(row[colMap.carga_horaria]) : null,
      remuneracao_bruta:
        colMap.remuneracao_bruta !== -1 ? converterNumero(row[colMap.remuneracao_bruta]) : null,
      descontos: colMap.descontos !== -1 ? converterNumero(row[colMap.descontos]) : null,
      remuneracao_liquida:
        colMap.remuneracao_liquida !== -1 ? converterNumero(row[colMap.remuneracao_liquida]) : null,
      tipo: tipoLinha,
      // Armazena a referência lida da linha (ou nome do arquivo como fallback)
      raw_json: { REFERENCIA_NOME: referenciaFinal },
    };

    registros.push(registro);
  }

  // Referência agora é extraída linha a linha, log omitido para evitar ruído.

  console.log(`   📋 ${registros.length} registros preparados para importação.`);

  if (registros.length === 0) {
    return { inseridos: 0, erros: 0 };
  }

  // 6. Deduplicar registros por matricula+tipo (evita conflitos de PK dentro do mesmo lote)
  // O PostgreSQL (Supabase) tem uma trava de unicidade (UNIQUE CONSTRAINT) em (matricula, ano, mes, tipo).
  // Se enviarmos duas linhas com a mesma matrícula e mesmo tipo no mesmo lote, o banco recusa todas as linhas do lote inteiro!
  const remMap = new Map<string, any>();
  for (const r of registros) {
    if (r.matricula) {
      remMap.set(`${r.matricula}_${r.ano}_${r.mes}_${r.tipo}_${r.cargo}_${r.remuneracao_liquida}`, r);
    }
  }
  const registrosDedup = Array.from(remMap.values());

  if (registrosDedup.length !== registros.length) {
    console.log(`   🔄 Deduplicado em memória: ${registros.length} → ${registrosDedup.length} registros únicos`);
  }

  // 7. Inserir em lotes na tabela remuneracoes (INSERT — histórico acumulativo)
  let inseridos = 0;
  let erros = 0;
  let jaExistem = 0;
  const totalBatches = Math.ceil(registrosDedup.length / BATCH_SIZE);

  for (let batch = 0; batch < totalBatches; batch++) {
    const inicio = batch * BATCH_SIZE;
    const fim = Math.min(inicio + BATCH_SIZE, registrosDedup.length);
    const lote = registrosDedup.slice(inicio, fim);

    // Trocado de insert() para upsert() para permitir atualizações sem dar erro de chave duplicada
    const { error: remError } = await supabase
      .from('remuneracoes')
      .upsert(lote, { onConflict: 'matricula,ano,mes,tipo,cargo,remuneracao_liquida' });

    if (remError) {
      // Se for erro de chave duplicada, significa que já foi importado antes
      if (remError.message?.includes('remuneracoes_unique') || remError.code === '23505') {
        jaExistem += lote.length;
        process.stdout.write(
          `   ⏭️  Lote ${batch + 1}/${totalBatches} — já importado anteriormente\r`,
        );
      } else {
        console.error(
          `   ❌ Erro no lote ${batch + 1}/${totalBatches}: ${remError.message}`,
        );
        erros += lote.length;
      }
    } else {
      inseridos += lote.length;
      process.stdout.write(
        `   ✅ Lote ${batch + 1}/${totalBatches} (${inseridos}/${registrosDedup.length})\r`,
      );
    }
  }

  if (jaExistem > 0 && inseridos === 0) {
    console.log(`\n   ⏭️  ${ano}/${mes} (${tipo}) já importado anteriormente — pulando.`);
  } else if (inseridos > 0) {
    console.log(`\n   ✅ remuneracoes: ${inseridos} inseridos.`);
  }

  // 8. Atualizar tabela servidores (upsert — mantém dados mais recentes)
  // Nota: PostgreSQL não permite upsert de múltiplas linhas com a mesma chave.
  // Precisamos deduplicar por matricula (fica apenas o último registro de cada servidor).
  const servidoresMap = new Map<string, any>();
  for (const r of registros) {
    if (r.matricula) {
      servidoresMap.set(r.matricula, {
        matricula: r.matricula,
        nome: r.nome,
        cargo: r.cargo,
        funcao: r.funcao,
        vinculo: r.vinculo,
        lotacao: r.lotacao,
        secretaria: r.secretaria,
        carga_horaria: r.carga_horaria,
        raw_json: r.raw_json,
      });
    }
  }
  const servidoresDedup = Array.from(servidoresMap.values());

  console.log(`   👤 Atualizando servidores (${servidoresDedup.length} únicos de ${registros.length})...`);
  let servidoresOk = 0;
  let servidoresErro = 0;
  const totalBatchesSrv = Math.ceil(servidoresDedup.length / BATCH_SIZE);

  for (let batch = 0; batch < totalBatchesSrv; batch++) {
    const inicio = batch * BATCH_SIZE;
    const fim = Math.min(inicio + BATCH_SIZE, servidoresDedup.length);
    const lote = servidoresDedup.slice(inicio, fim);

    const { error: srvError } = await supabase
      .from('servidores')
      .upsert(lote, { onConflict: 'matricula' });

    if (srvError) {
      console.error(`   ❌ Erro servidores lote ${batch + 1}: ${srvError.message}`);
      servidoresErro += lote.length;
    } else {
      servidoresOk += lote.length;
    }
  }
  console.log(`   👤 servidores: ${servidoresOk} atualizados, ${servidoresErro} erros.`);

  // 9. Apagar o CSV apenas se não houve erros
  const totalErros = erros + servidoresErro;
  if (totalErros === 0) {
    // try {
    //   fs.unlinkSync(caminhoArquivo);
    //   console.log(`   🗑️  CSV apagado: ${path.basename(caminhoArquivo)}`);
    // } catch (unlinkErr: any) {
    //   console.error(`   ⚠️  Erro ao apagar CSV: ${unlinkErr.message}`);
    // }
    console.log(`   📝  (Exclusão temporariamente desativada) CSV preservado: ${path.basename(caminhoArquivo)}`);
  } else {
    console.log(`   ⚠️  CSV preservado para re-tentativa (${totalErros} erro(s)).`);
  }

  return { inseridos, erros: totalErros };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  // Flags
  const arquivoArg = args.find((a) => a.startsWith('--arquivo='));
  const arquivoCaminho = arquivoArg ? arquivoArg.split('=').slice(1).join('=') : null;

  const anoArg = args.find((a) => a.startsWith('--ano='));
  const anoFiltro = anoArg ? anoArg.split('=')[1].trim() : null;

  console.log('🚀 Importador de CSV de Folhas de Pagamento → Supabase');
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log('   🗑️  CSV será apagado após importação bem-sucedida.');

  let arquivos: string[] = [];

  if (arquivoCaminho) {
    // Importar arquivo específico
    const caminhoCompleto = path.resolve(process.cwd(), arquivoCaminho);
    if (!fs.existsSync(caminhoCompleto)) {
      console.error(`❌ Arquivo não encontrado: ${caminhoCompleto}`);
      process.exit(1);
    }
    arquivos = [caminhoCompleto];
  } else {
    // Importar todos os CSV do diretório
    if (!fs.existsSync(CSV_DIR)) {
      console.error(`❌ Diretório não encontrado: ${CSV_DIR}`);
      console.error(`   Crie o diretório e coloque os arquivos CSV nele.`);
      process.exit(1);
    }

    arquivos = fs
      .readdirSync(CSV_DIR)
      .filter((f) => f.endsWith('.csv'))
      .filter((f) => {
        if (!anoFiltro) return true;
        // Assumimos que o nome do arquivo começa com o ano, ex: 2023_01_geral.csv
        return f.startsWith(`${anoFiltro}_`);
      })
      .sort()
      .map((f) => path.join(CSV_DIR, f));

    if (arquivos.length === 0) {
      console.warn('⚠️  Nenhum arquivo CSV encontrado em:', CSV_DIR);
      process.exit(0);
    }

    console.log(`\n📂 ${arquivos.length} arquivo(s) encontrado(s) em ${CSV_DIR}`);
  }

  // Processar cada arquivo
  let totalInseridos = 0;
  let totalErros = 0;

  for (const arquivo of arquivos) {
    try {
      const resultado = await importarArquivo(arquivo);
      totalInseridos += resultado.inseridos;
      totalErros += resultado.erros;
    } catch (err: any) {
      console.error(`\n❌ Erro ao processar ${path.basename(arquivo)}: ${err.message}`);
      totalErros++;
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log(`   Arquivos processados: ${arquivos.length}`);
  console.log(`   Registros inseridos/atualizados: ${totalInseridos}`);
  console.log(`   Erros: ${totalErros}`);
  console.log('='.repeat(60));

  process.exit(totalErros > 0 ? 1 : 0);
}

main();
