import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function humanizarTituloContabil(tituloOriginal: string, exercicio: number): string {
  let limpo = tituloOriginal;

  // Remover prefixos repetitivos do script antigo
  limpo = limpo.replace(/^Balanço Geral \d{4}\s*—\s*/i, "");
  limpo = limpo.replace(/^RREO \d{4}\s*—\s*/i, "");
  limpo = limpo.replace(/^RGF \d{4}\s*—\s*/i, "");
  limpo = limpo.replace(/^ANEXO\s*\d+[A-Z]*\s*[-–—]\s*/i, "");
  limpo = limpo.replace(/^\d+\s*[-–—]\s*/, "");
  limpo = limpo.replace(/\.pdf$/i, "");

  // Termos contábeis padronizados e sem CAIXA ALTA
  const padroes: [RegExp, string][] = [
    [/BALANÇO PATRIMONIAL\s*[-–—]?\s*CONJUNTO/gi, "Balanço Patrimonial Consolidado"],
    [/BALANÇO PATRIMONIAL\s*[-–—]?\s*ISOLADO/gi, "Balanço Patrimonial Isolado"],
    [/BALANÇO PATRIMONIAL/gi, "Balanço Patrimonial"],
    [/BALANÇO ORÇAMENTÁRIO\s*[-–—]?\s*CONJUNTO/gi, "Balanço Orçamentário Consolidado"],
    [/BALANÇO ORÇAMENTÁRIO\s*[-–—]?\s*CONSOLIDADO/gi, "Balanço Orçamentário Consolidado"],
    [/BALANÇO ORÇAMENTÁRIO/gi, "Balanço Orçamentário"],
    [/BALANÇO FINANCEIRO\s*[-–—]?\s*CONJUNTO/gi, "Balanço Financeiro Consolidado"],
    [/BALANÇO FINANCEIRO/gi, "Balanço Financeiro"],
    [/DEMONSTRATIVO DAS VARIAÇÕES PATRIMONIAIS\s*[-–—]?\s*CONJUNTO/gi, "Demonstração das Variações Patrimoniais (Consolidado)"],
    [/DEMONSTRATIVO DAS VARIAÇÕES PATRIMONIAIS/gi, "Demonstração das Variações Patrimoniais"],
    [/DEMONSTRATIVO DO FLUXO DE CAIXA\s*[-–—]?\s*CONJUNTO/gi, "Demonstração dos Fluxos de Caixa (Consolidado)"],
    [/DEMONSTRATIVO DO FLUXO DE CAIXA/gi, "Demonstração dos Fluxos de Caixa"],
    [/DÍVIDA FLUTUANTE\s*[-–—]?\s*CONJUNTO/gi, "Demonstrativo da Dívida Flutuante (Consolidado)"],
    [/DÍVIDA FUNDADA\s*[-–—]?\s*CONJUNTO/gi, "Demonstrativo da Dívida Fundada (Consolidado)"],
    [/DÍVIDA FUNDADA\s*[-–—]?\s*ISOLADO/gi, "Demonstrativo da Dívida Fundada (Isolado)"],
    [/Segundo as Categorias Econômicas/gi, "segundo as Categorias Econômicas"],
    [/por Orgão e Unidade/gi, "por Órgão e Unidade"],
    [/por Orgão/gi, "por Órgão"],
    [/SubUnidade/gi, "Subunidade"],
    [/Pagamamentos/gi, "Pagamentos"],
    [/Funções, SubFun\. e Programas Conforme Vínculo com Recursos/gi, "Despesa por Funções e Programas (por Vínculo de Recursos)"],
    [/Funções, SubFunções e Programas por Projetos e Atividades/gi, "Despesa por Projetos e Atividades"]
  ];

  for (const [regex, sub] of padroes) {
    limpo = limpo.replace(regex, sub);
  }

  // Corrigir meses e bimestres/quadrimestres de forma limpa
  const sufixos: [RegExp, string][] = [
    [/\s+dez$/i, " - Dezembro / Anual"],
    [/\s+out$/i, " - Outubro"],
    [/\s+julho$/i, " - Julho"],
    [/\s+jul$/i, " - Julho"],
    [/\s+fev$/i, " - Fevereiro"],
    [/\s+jan\s+fev$/i, " - 1º Bimestre (Jan-Fev)"],
    [/\s+mar\s+abril$/i, " - 2º Bimestre (Mar-Abr)"],
    [/\s+març\s+abril$/i, " - 2º Bimestre (Mar-Abr)"],
    [/\s+março\s+abril$/i, " - 2º Bimestre (Mar-Abr)"],
    [/\s+mac\s+abril$/i, " - 2º Bimestre (Mar-Abr)"],
    [/\s+mai\s+abril$/i, " - 2º Bimestre (Mar-Abr)"],
    [/\s+mar\s+fev$/i, " - 1º Bimestre (Jan-Fev)"],
    [/\s+jav\s+fev$/i, " - 1º Bimestre (Jan-Fev)"],
    [/\s+jan\s+dez$/i, " - Anual (Jan-Dez)"]
  ];

  for (const [regex, compl] of sufixos) {
    if (regex.test(limpo)) {
      limpo = limpo.replace(regex, compl);
      break;
    }
  }

  // Limpar espaços, traços duplicados e pontuação solta
  limpo = limpo.replace(/\s+/g, " ").replace(/-\s+-/g, "-").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim();

  // Se a string ficou minúscula ou misturada, capitalizar a primeira letra
  if (limpo.length > 0) {
    limpo = limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }

  return limpo;
}

async function atualizarTudo() {
  console.log("=== BUSCANDO DOCUMENTOS DE PRESTAÇÃO DE CONTAS ===");
  const { data: docs, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio")
    .eq("categoria", "PRESTACAO_CONTAS");

  if (error || !docs) {
    console.error("Erro ao buscar documentos:", error?.message);
    return;
  }

  console.log(`Analisando ${docs.length} documentos...`);
  let atualizados = 0;

  for (const doc of docs) {
    const tituloBonito = humanizarTituloContabil(doc.titulo || "", doc.exercicio || 2024);
    
    // Prefixar levemente com o tipo para ficar bem organizado na listagem, se já não tiver
    let tituloFinal = tituloBonito;
    if (doc.tipo === "BALANCO_GERAL" && !tituloFinal.toLowerCase().includes("balanço") && !tituloFinal.toLowerCase().includes("demonstra")) {
      tituloFinal = `Balanço Geral — ${tituloBonito}`;
    } else if (doc.tipo === "RREO" && !tituloFinal.startsWith("RREO")) {
      tituloFinal = `RREO — ${tituloBonito}`;
    } else if (doc.tipo === "RGF" && !tituloFinal.startsWith("RGF")) {
      tituloFinal = `RGF — ${tituloBonito}`;
    }

    if (doc.titulo !== tituloFinal) {
      const { error: updErr } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .update({ titulo: tituloFinal })
        .eq("id", doc.id);

      if (!updErr) {
        atualizados++;
        console.log(`✨ [${doc.exercicio}] ${doc.titulo} \n   -> ${tituloFinal}`);
      } else {
        console.error(`Erro ao atualizar ID ${doc.id}:`, updErr.message);
      }
    }
  }

  console.log(`\n✅ Concluído! ${atualizados} títulos foram humanizados no portal.`);
}

atualizarTudo();
