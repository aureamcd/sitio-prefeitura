/**
 * Script de importação de obras para o banco Supabase
 * 
 * Fontes:
 *  1. obras/listagem_obras.xlsx — 6 obras (listagem simples)
 *  2. obras/obras.xlsx — 8 obras (detalhadas com contratos)
 * 
 * Prevenção de duplicatas: usa o objeto + contratada como chave única.
 */

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nuhkqmuccirxumhttsvk.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51aGtxbXVjY2lyeHVtaHR0c3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NDY0NjYsImV4cCI6MjA1OTMyMjQ2Nn0.6C2Wh2n9jjSlGJQz1-MQJsNcvRZn6TSFqJq8F6gPYbY'
);

// ─── Helpers ───

/** Converte data DD/MM/AAAA para ISO */
function parseBrDate(str: string): string | null {
  if (!str) return null;
  const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

/** Converte serial number Excel para data ISO */
function excelSerialToDate(serial: number): string {
  const d = new Date((serial - 25569) * 86400 * 1000);
  return d.toISOString().split('T')[0];
}

/** Limpa valor monetário brasileiro (ex: "8.623.490,97" → 8623490.97) */
function parseBrMoney(str: string | number | null): number | null {
  if (str === null || str === undefined) return null;
  if (typeof str === 'number') return str;
  const cleaned = str
    .replace(/\./g, '')   // remove separador de milhar
    .replace(',', '.');    // vírgula → ponto decimal
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/** Gera uma chave única para verificar duplicata */
function makeKey(obj: string, contratada: string): string {
  return (obj || '').trim().substring(0, 60) + '|||' + (contratada || '').trim();
}

// ─── Leitura das Planilhas ───

function lerListagemObras(): any[] {
  const wb = XLSX.readFile('obras/listagem_obras.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const obras: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[2]) continue;  // pula linhas vazias

    const dataInicio = parseBrDate(String(r[3] || ''));
    const ano = dataInicio ? dataInicio.substring(0, 4) : '2025';
    const valor = parseBrMoney(r[4]);

    const objeto = String(r[2] || '').trim();

    obras.push({
      objeto,
      localizacao: extrairLocal(objeto),
      situacao: String(r[5] || '').trim(),
      data_inicio: dataInicio,
      data_previsao_fim: null,
      empresa_responsavel: String(r[1] || '').trim(),
      cnpj_empresa: null,
      valor_total: valor,
      valor_executado: null,
      percentual_executado: null,
      contrato_numero: null,
      ano: parseInt(ano),
    });
  }
  return obras;
}

function lerObrasDetalhadas(): any[] {
  const wb = XLSX.readFile('obras/obras.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const obras: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[2]) continue;

    const dataInicio = typeof r[4] === 'number' ? excelSerialToDate(r[4]) : null;
    const dataFim = typeof r[5] === 'number' ? excelSerialToDate(r[5]) : null;
    const ano = dataInicio ? dataInicio.substring(0, 4) : '2026';

    // Extrair licitação do campo 0
    const modalidadeStr = String(r[0] || '');
    const contratoNumero = String(r[1] || '').trim();

    const objeto = String(r[2] || '').trim();

    obras.push({
      objeto,
      localizacao: extrairLocal(objeto),
      situacao: String(r[3] || '').trim(),
      data_inicio: dataInicio,
      data_previsao_fim: dataFim,
      empresa_responsavel: String(r[6] || '').trim(),
      cnpj_empresa: String(r[7] || '').trim(),
      valor_total: null,  // não tem valor na planilha
      valor_executado: null,
      percentual_executado: null,
      contrato_numero: contratoNumero,
      licitacao: modalidadeStr,
      ano: parseInt(ano),
    });
  }
  return obras;
}

/** Tenta extrair localização do objeto da obra */
function extrairLocal(objeto: string): string | null {
  if (!objeto) return null;
  const lower = objeto.toLowerCase();
  
  // Tenta encontrar padrões de localização
  const padroes = [
    /na\s+localidade\s+(.+?)[,\.]/i,
    /na\s+zona\s+(urbana|rural)/i,
    /na\s+sede\s+do\s+munic[ií]pio/i,
    /no\s+munic[ií]pio\s+de\s+padre\s+marcos/i,
    /na\s+zona\s+urbana\s+do\s+munic[ií]pio/i,
  ];

  for (const padrao of padroes) {
    const match = objeto.match(padrao);
    if (match) {
      let loc = match[0]
        .replace(/^(na|no)\s+/, '')
        .replace(/[,\.].*$/, '')
        .trim();
      if (loc.length > 5) return loc.charAt(0).toUpperCase() + loc.slice(1);
    }
  }

  // Fallback: procura por palavras-chave
  if (lower.includes('canto alegre')) return 'Localidade Canto Alegre';
  if (lower.includes('sede')) return 'Sede do Município';
  if (lower.includes('creche')) return 'Zona Urbana';
  
  return 'Não informada';
}

// ─── Main ───

async function main() {
  console.log('📂 Lendo planilhas...\n');

  const obras1 = lerListagemObras();
  console.log(`Planilha "listagem_obras.xlsx": ${obras1.length} obra(s)`);

  const obras2 = lerObrasDetalhadas();
  console.log(`Planilha "obras.xlsx": ${obras2.length} obra(s)`);
  
  // Combinar removendo duplicatas (mesmo objeto + mesma contratada)
  const seen = new Set<string>();
  const todas: any[] = [];

  for (const o of [...obras2, ...obras1]) {
    const key = makeKey(o.objeto, o.empresa_responsavel);
    if (seen.has(key)) {
      console.log(`  ⏭️  Duplicata ignorada: "${o.objeto?.substring(0, 60)}..." — ${o.empresa_responsavel}`);
      continue;
    }
    seen.add(key);
    todas.push(o);
  }

  console.log(`\n📊 Total para importar (após dedup): ${todas.length} obra(s)\n`);

  if (todas.length === 0) {
    console.log('Nenhuma obra para importar.');
    return;
  }

  // Mostrar preview
  console.log('Preview dos dados:');
  todas.forEach((o, i) => {
    console.log(`  ${i + 1}. ${o.objeto?.substring(0, 70)}...`);
    console.log(`     Contratada: ${o.empresa_responsavel || 'N/I'} | Situação: ${o.situacao} | Ano: ${o.ano}`);
    console.log(`     Início: ${o.data_inicio || 'N/I'} | Contrato: ${o.contrato_numero || 'N/I'}`);
    if (o.valor_total) console.log(`     Valor: R$ ${o.valor_total.toLocaleString('pt-BR')}`);
    console.log('');
  });

  // Verificar se já existem obras no banco
  const { count: totalExistentes } = await supabase
    .schema('transparencia').from('obras')
    .select('*', { count: 'exact', head: true });
  console.log(`📦 Obras já existentes no banco: ${totalExistentes || 0}`);
  console.log('');

  // Inserir uma a uma
  let inseridos = 0;
  let erros = 0;

  for (const obra of todas) {
    // Verificar duplicata no banco
    const { data: existente } = await supabase
      .schema('transparencia').from('obras')
      .select('id')
      .ilike('objeto', obra.objeto?.substring(0, 80) + '%')
      .eq('empresa_responsavel', obra.empresa_responsavel)
      .maybeSingle();

    if (existente) {
      console.log(`  ⏭️  Já existe no banco: "${obra.objeto?.substring(0, 60)}..."`);
      continue;
    }

    const { error } = await supabase
      .schema('transparencia').from('obras')
      .insert({
        objeto: obra.objeto,
        localizacao: obra.localizacao,
        situacao: obra.situacao,
        data_inicio: obra.data_inicio,
        data_previsao_fim: obra.data_previsao_fim,
        empresa_responsavel: obra.empresa_responsavel,
        cnpj_empresa: obra.cnpj_empresa,
        valor_total: obra.valor_total,
        valor_executado: obra.valor_executado,
        percentual_executado: obra.percentual_executado,
        contrato_numero: obra.contrato_numero,
        empresa: '1',
        ano: obra.ano,
      });

    if (error) {
      console.error(`  ❌ Erro ao inserir: ${error.message}`);
      console.error(`     ${obra.objeto?.substring(0, 60)}...`);
      erros++;
    } else {
      console.log(`  ✅ Inserida: ${obra.objeto?.substring(0, 60)}...`);
      inseridos++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`📊 RESUMO:`);
  console.log(`   Total lido: ${todas.length}`);
  console.log(`   Inseridos: ${inseridos}`);
  console.log(`   Erros: ${erros}`);
  console.log(`═══════════════════════════════`);

  // Verificar resultado final
  const { count: totalFinal } = await supabase
    .schema('transparencia').from('obras')
    .select('*', { count: 'exact', head: true });
  console.log(`\n📦 Total de obras no banco agora: ${totalFinal || 0}`);
}

main().catch(console.error);
