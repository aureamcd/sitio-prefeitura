import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function humanizarTituloContabil(tituloOriginal: string, exercicio: number): string {
  let limpo = tituloOriginal;

  // Remover prefixos repetitivos
  limpo = limpo.replace(/^Balanço Geral \d{4}\s*—\s*/i, "");
  limpo = limpo.replace(/^RREO \d{4}\s*—\s*/i, "");
  limpo = limpo.replace(/^RGF \d{4}\s*—\s*/i, "");
  limpo = limpo.replace(/^ANEXO\s*\d+[A-Z]*\s*[-–—]\s*/i, "");
  limpo = limpo.replace(/^\d+\s*[-–—]\s*/, "");
  limpo = limpo.replace(/\.pdf$/i, "");

  // Substituir termos gritando em CAIXA ALTA e formatações feias
  const substituicoes: [RegExp, string][] = [
    [/BALANÇO PATRIMONIAL/gi, "Balanço Patrimonial"],
    [/BALANÇO ORÇAMENTÁRIO/gi, "Balanço Orçamentário"],
    [/BALANÇO FINANCEIRO/gi, "Balanço Financeiro"],
    [/DEMONSTRATIVO DAS VARIAÇÕES PATRIMONIAIS/gi, "Demonstração das Variações Patrimoniais (DVP)"],
    [/DEMONSTRATIVO DO FLUXO DE CAIXA/gi, "Demonstração dos Fluxos de Caixa (DFC)"],
    [/DÍVIDA FLUTUANTE/gi, "Demonstrativo da Dívida Flutuante"],
    [/DÍVIDA FUNDADA/gi, "Demonstrativo da Dívida Fundada"],
    [/\s*-\s*CONJUNTO/gi, " (Consolidado)"],
    [/\s*CONJUNTO/gi, " (Consolidado)"],
    [/\s*-\s*ISOLADO/gi, " (Isolado)"],
    [/\s*ISOLADO/gi, " (Isolado)"],
    [/\s*-\s*CONSOLIDADO/gi, " (Consolidado)"],
    [/\s*CONSOLIDADO/gi, " (Consolidado)"],
    [/Segundo as Categorias Econômicas/gi, "segundo as Categorias Econômicas"],
    [/Segundo a Categoria Econômica/gi, "segundo a Categoria Econômica"],
    [/por Orgão e Unidade/gi, "por Órgão e Unidade"],
    [/por Orgão/gi, "por Órgão"],
    [/SubUnidade/gi, "Subunidade"],
    [/Pagamamentos/gi, "Pagamentos"],
    [/Funções, SubFun\. e Programas Conforme Vínculo com Recursos/gi, "Funções e Programas (por Vínculo de Recursos)"],
    [/Funções, SubFunções e Programas por Projetos e Atividades/gi, "Funções, Subfunções e Programas por Atividade"]
  ];

  for (const [regex, sub] of substituicoes) {
    limpo = limpo.replace(regex, sub);
  }

  // Corrigir abreviações de meses ou sufixos de período
  const sufixos: Record<string, string> = {
    " jan": " — Janeiro", " fev": " — Fevereiro", " mar": " — Março",
    " abr": " — Abril", " abril": " — Abril", " maio": " — Maio",
    " jun": " — Junho", " jul": " — Julho", " julho": " — Julho",
    " ago": " — Agosto", " set": " — Setembro", " out": " — Outubro",
    " nov": " — Novembro", " dez": " — Dezembro / Anual"
  };

  for (const [suf, compl] of Object.entries(sufixos)) {
    if (limpo.toLowerCase().endsWith(suf)) {
      limpo = limpo.slice(0, -suf.length) + compl;
      break;
    }
  }

  // Limpeza de parênteses duplos ou espaços extras
  limpo = limpo.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\(\s*\)/g, "").replace(/\s+/g, " ").trim();

  // Primeira letra maiúscula
  if (limpo.length > 0) {
    limpo = limpo.charAt(0).toUpperCase() + limpo.slice(1);
  }

  return `${limpo} (${exercicio})`;
}

async function testarContabilidade() {
  const { data } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio")
    .in("tipo", ["BALANCO_GERAL", "RREO", "RGF"])
    .limit(20);

  console.log("=== PREVIEW HUMANIZADO (PRESTAÇÃO DE CONTAS) ===");
  data?.forEach(d => {
    const novo = humanizarTituloContabil(d.titulo || "", d.exercicio || 2024);
    if (d.titulo !== novo) {
      console.log(`❌ ANTES: ${d.titulo}\n✨ DEPOIS: ${novo}\n---`);
    }
  });
}

testarContabilidade();
