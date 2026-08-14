import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=========================================");
  console.log("1. VERIFICAÇÃO DETALHADA DE OBRAS");
  console.log("=========================================");

  const { data: obras, error: obrasError } = await supabase
    .schema('transparencia')
    .from('obras')
    .select('*');

  if (obrasError) {
    console.error("Erro ao buscar obras:", obrasError.message);
  } else {
    console.log(`Total de obras encontradas no banco: ${obras?.length || 0}`);
    
    // Tentar resolver valores zerados usando contratos_v2 ou contratos
    const contratosNumeros = (obras || [])
      .filter(o => !o.valor_total && o.contrato_numero)
      .map(o => o.contrato_numero);

    let contratosMap: Record<string, number> = {};
    if (contratosNumeros.length > 0) {
      const orString = contratosNumeros.map(n => `numero.ilike.%${n.trim()}%`).join(',');
      const { data: contratos } = await supabase
        .schema('transparencia')
        .from('contratos_v2')
        .select('numero, valor')
        .or(orString);

      if (contratos) {
        contratos.forEach(c => {
          if (c.numero && c.valor) contratosMap[c.numero.toLowerCase()] = c.valor;
        });
      }
    }

    obras?.forEach((o, i) => {
      let valorFinal = o.valor_total;
      if (!valorFinal && o.contrato_numero) {
        const key = Object.keys(contratosMap).find(k => k.includes(o.contrato_numero.toLowerCase()));
        if (key) valorFinal = contratosMap[key];
      }
      console.log(`\n[Obra ${i+1}] ${o.objeto}`);
      console.log(`   - Contrato Nº: ${o.contrato_numero || 'Não informado'}`);
      console.log(`   - Empresa: ${o.empresa_responsavel || 'Não informada'}`);
      console.log(`   - Valor Total: R$ ${valorFinal ? valorFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2}) : '0,00'}`);
      console.log(`   - Situação: ${o.situacao} | Progresso: ${o.percentual_execucao ?? '-'}%`);
      console.log(`   - Período: ${o.data_inicio || '-'} até ${o.data_previsao_fim || '-'}`);
    });
  }

  console.log("\n=========================================");
  console.log("2. VERIFICAÇÃO DETALHADA DOS LINKS DE PRESTAÇÃO DE CONTAS");
  console.log("=========================================");

  const { data: planDocs, error: planError } = await supabase
    .schema('transparencia')
    .from('planejamento_documentos')
    .select('*');

  if (planError) {
    console.error("Erro ao buscar planejamento_documentos:", planError.message);
  } else {
    console.log(`Total de documentos em 'planejamento_documentos': ${planDocs?.length || 0}`);

    const tipos = new Set(planDocs?.map(d => d.tipo));
    console.log(`Tipos encontrados:`, Array.from(tipos));

    let okCount = 0;
    let failCount = 0;

    for (const doc of planDocs || []) {
      const url = doc.arquivo_url || doc.url || doc.url_anexo;
      const titulo = doc.titulo || 'Sem título';
      const exercicio = doc.exercicio || 'S/A';

      if (!url) {
        console.warn(`  [AVISO] Documento sem URL: Ex. ${exercicio} | ${titulo}`);
        failCount++;
        continue;
      }

      const check = checkFileOrUrl(url);
      if (check.ok) {
        okCount++;
      } else {
        console.error(`  [ERRO 404/FALTA] Documento não encontrado: Ex. ${exercicio} | ${titulo} -> URL: ${url}`);
        failCount++;
      }
    }

    console.log(`\nResumo da auditoria de links da prestação de contas:`);
    console.log(`  ✓ Válidos e acessíveis: ${okCount}`);
    console.log(`  ❌ Quebrados / Ausentes: ${failCount}`);
  }
}

function checkFileOrUrl(urlStr: string): { ok: boolean; pathOrUrl: string } {
  if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
    return { ok: true, pathOrUrl: urlStr };
  }

  const cleanPath = urlStr.startsWith('/') ? urlStr.substring(1) : urlStr;
  const fullPath = path.join(process.cwd(), 'public', cleanPath);
  
  if (fs.existsSync(fullPath)) {
    return { ok: true, pathOrUrl: fullPath };
  } else {
    return { ok: false, pathOrUrl: fullPath };
  }
}

main().catch(console.error);
