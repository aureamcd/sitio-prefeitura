import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function padronizarTituloDocumento(tituloOriginal: string, tipo: string, exercicio: number): string {
  let limpo = tituloOriginal || "";

  // 1. Limpar prefixos e sufixos repetitivos ou sujos
  limpo = limpo.replace(/^\s*RREO\s*[-–—]\s*/i, "");
  limpo = limpo.replace(/^\s*RGF\s*[-–—]\s*/i, "");
  limpo = limpo.replace(/^\s*Balanço Geral\s*[-–—]\s*/i, "");
  limpo = limpo.replace(/^\s*TCE-PI\s*[-–—]\s*/i, "");
  limpo = limpo.replace(/\s*\(\d{4}\)\s*$/i, "");
  limpo = limpo.replace(/\.pdf$/i, "");
  limpo = limpo.trim();

  // 2. Padronização específica por TIPO
  if (tipo === "RREO") {
    // Identificar Bimestre
    let periodo = "";
    if (/bimestre\s*1|jan.*fev|janeiro.*fevereiro/i.test(limpo)) periodo = "1º Bimestre (Jan/Fev)";
    else if (/bimestre\s*2|mar.*abr|março.*abril|mac.*abril/i.test(limpo)) periodo = "2º Bimestre (Mar/Abr)";
    else if (/bimestre\s*3|mai.*jun|maio.*junho/i.test(limpo)) periodo = "3º Bimestre (Mai/Jun)";
    else if (/bimestre\s*4|jul.*ago|julho.*agosto/i.test(limpo)) periodo = "4º Bimestre (Jul/Ago)";
    else if (/bimestre\s*5|set.*out|setembro.*outubro/i.test(limpo)) periodo = "5º Bimestre (Set/Out)";
    else if (/bimestre\s*6|nov.*dez|novembro.*dezembro/i.test(limpo)) periodo = "6º Bimestre (Nov/Dez)";
    else if (/jan.*dez|janeiro.*dezembro|anual/i.test(limpo)) periodo = "Anual (Exercício Completo)";
    else {
      // Tentar pegar mês avulso se houver
      const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      for (const m of meses) {
        if (new RegExp(m, "i").test(limpo)) { periodo = m; break; }
      }
    }

    // Identificar Anexo e Nome Padrão do RREO
    let nomeRelatorio = limpo;
    if (/Anexo\s*I\b|Balanço Orçamentário/i.test(limpo)) nomeRelatorio = "Anexo 1: Balanço Orçamentário";
    else if (/Anexo\s*II\b|Despesas\s*Função/i.test(limpo)) nomeRelatorio = "Anexo 2: Despesas por Função e Subfunção";
    else if (/Anexo\s*III\b|Receita\s*Corrente\s*Líquida/i.test(limpo)) nomeRelatorio = "Anexo 3: Receita Corrente Líquida (RCL)";
    else if (/Anexo\s*IV\b|Previdenciária/i.test(limpo)) nomeRelatorio = "Anexo 4: Receitas e Despesas Previdenciárias";
    else if (/Anexo\s*VI\b|Primário.*Nominal/i.test(limpo)) nomeRelatorio = "Anexo 6: Resultado Primário e Nominal";
    else if (/Anexo\s*VII\b|Restos\s*a\s*Pagar/i.test(limpo)) nomeRelatorio = "Anexo 7: Restos a Pagar (RP)";
    else if (/Anexo\s*VIII\b|Desenvolvimento.*Ensino|MDE/i.test(limpo)) nomeRelatorio = "Anexo 8: Manutenção e Desenvolvimento do Ensino (MDE)";
    else if (/Anexo\s*IX\b|Operação.*Crédito/i.test(limpo)) nomeRelatorio = "Anexo 9: Operações de Crédito e Despesas de Capital";
    else if (/Anexo\s*X\b|Projeção.*Atuarial/i.test(limpo)) nomeRelatorio = "Anexo 10: Projeção Atuarial do RPPS";
    else if (/Anexo\s*XI\b|Alienação.*Ativos/i.test(limpo)) nomeRelatorio = "Anexo 11: Receitas de Alienação de Ativos";
    else if (/Anexo\s*XII\b|Saúde|ASPS/i.test(limpo)) nomeRelatorio = "Anexo 12: Ações e Serviços Públicos de Saúde (ASPS)";
    else if (/Anexo\s*XIII\b|Parcerias|PPP/i.test(limpo)) nomeRelatorio = "Anexo 13: Parcerias Público-Privadas (PPP)";
    else if (/Anexo\s*XIV\b|Simplificado/i.test(limpo)) nomeRelatorio = "Anexo 14: Demonstrativo Simplificado do RREO";
    else {
      // Limpar nome genérico
      nomeRelatorio = nomeRelatorio.replace(/bimestre\s*\d|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/gi, "").trim();
      nomeRelatorio = nomeRelatorio.replace(/[-–—]+$/, "").trim();
    }

    return periodo ? `RREO — ${nomeRelatorio} — ${periodo} (${exercicio})` : `RREO — ${nomeRelatorio} (${exercicio})`;
  }

  else if (tipo === "RGF") {
    // Identificar Quadrimestre ou Semestre
    let periodo = "";
    if (/quadrimestre\s*1|1.*quad|jan.*abr/i.test(limpo)) periodo = "1º Quadrimestre";
    else if (/quadrimestre\s*2|2.*quad|mai.*ago/i.test(limpo)) periodo = "2º Quadrimestre";
    else if (/quadrimestre\s*3|3.*quad|set.*dez/i.test(limpo)) periodo = "3º Quadrimestre";
    else if (/semestre\s*1|1.*sem|jan.*jun/i.test(limpo)) periodo = "1º Semestre";
    else if (/semestre\s*2|2.*sem|jul.*dez/i.test(limpo)) periodo = "2º Semestre";

    let nomeRelatorio = limpo;
    if (/Pessoal/i.test(limpo)) nomeRelatorio = "Anexo 1: Despesa com Pessoal";
    else if (/Dívida\s*Consolidada/i.test(limpo)) nomeRelatorio = "Anexo 2: Dívida Consolidada Líquida";
    else if (/Garantias/i.test(limpo)) nomeRelatorio = "Anexo 3: Garantias e Contragarantias";
    else if (/Operações.*Crédito/i.test(limpo)) nomeRelatorio = "Anexo 4: Operações de Crédito";
    else if (/Disponibilidade.*Caixa/i.test(limpo)) nomeRelatorio = "Anexo 5: Disponibilidade de Caixa e Restos a Pagar";
    else if (/Simplificado/i.test(limpo)) nomeRelatorio = "Anexo 6: Demonstrativo Simplificado do RGF";
    else {
      nomeRelatorio = nomeRelatorio.replace(/quadrimestre\s*\d|semestre\s*\d/gi, "").trim();
      nomeRelatorio = nomeRelatorio.replace(/[-–—]+$/, "").trim();
    }

    return periodo ? `RGF — ${nomeRelatorio} — ${periodo} (${exercicio})` : `RGF — ${nomeRelatorio} (${exercicio})`;
  }

  else if (tipo === "BALANCO_GERAL") {
    let nomeRelatorio = limpo;
    // Limpar e padronizar nomes contábeis
    nomeRelatorio = nomeRelatorio.replace(/^ANEXO\s*\d+[A-Z]*\s*[-–—]\s*/i, "");
    nomeRelatorio = nomeRelatorio.replace(/^\d+\s*[-–—]\s*/, "");
    
    if (/BALANÇO PATRIMONIAL.*ISOLADO|PATRIMONIAL.*ISOLADO/i.test(nomeRelatorio)) nomeRelatorio = "Balanço Patrimonial (Isolado)";
    else if (/BALANÇO PATRIMONIAL/i.test(nomeRelatorio)) nomeRelatorio = "Balanço Patrimonial (Consolidado)";
    else if (/BALANÇO ORÇAMENTÁRIO/i.test(nomeRelatorio)) nomeRelatorio = "Balanço Orçamentário (Consolidado)";
    else if (/BALANÇO FINANCEIRO/i.test(nomeRelatorio)) nomeRelatorio = "Balanço Financeiro (Consolidado)";
    else if (/FLUXO DE CAIXA/i.test(nomeRelatorio)) nomeRelatorio = "Demonstração dos Fluxos de Caixa (DFC)";
    else if (/VARIAÇÕES PATRIMONIAIS/i.test(nomeRelatorio)) nomeRelatorio = "Demonstração das Variações Patrimoniais (DVP)";
    else if (/DÍVIDA FLUTUANTE/i.test(nomeRelatorio)) nomeRelatorio = "Demonstrativo da Dívida Flutuante";
    else if (/DÍVIDA FUNDADA.*ISOLADO/i.test(nomeRelatorio)) nomeRelatorio = "Demonstrativo da Dívida Fundada (Isolado)";
    else if (/DÍVIDA FUNDADA/i.test(nomeRelatorio)) nomeRelatorio = "Demonstrativo da Dívida Fundada";
    else if (/Comparativo.*Receita/i.test(nomeRelatorio)) nomeRelatorio = "Comparativo da Receita Orçada e Arrecadada";
    else if (/Comparativo.*Despesa/i.test(nomeRelatorio)) nomeRelatorio = "Comparativo da Despesa Autorizada e Realizada";
    else if (/Empenhos.*Emitidos/i.test(nomeRelatorio)) {
      const mes = /dezembro/i.test(nomeRelatorio) ? " — Dezembro" : /novembro/i.test(nomeRelatorio) ? " — Novembro" : /outubro/i.test(nomeRelatorio) ? " — Outubro" : /julho/i.test(nomeRelatorio) ? " — Julho" : /fev/i.test(nomeRelatorio) ? " — Fevereiro" : /jan/i.test(nomeRelatorio) ? " — Janeiro" : "";
      nomeRelatorio = `Relação de Empenhos Emitidos${mes}`;
    }
    else if (/Pagam.*Realizados/i.test(nomeRelatorio)) {
      const mes = /dezembro/i.test(nomeRelatorio) ? " — Dezembro" : /novembro/i.test(nomeRelatorio) ? " — Novembro" : /outubro/i.test(nomeRelatorio) ? " — Outubro" : /julho/i.test(nomeRelatorio) ? " — Julho" : /fev/i.test(nomeRelatorio) ? " — Fevereiro" : /jan/i.test(nomeRelatorio) ? " — Janeiro" : /abril/i.test(nomeRelatorio) ? " — Abril" : /junho/i.test(nomeRelatorio) ? " — Junho" : /mar/i.test(nomeRelatorio) ? " — Março" : "";
      nomeRelatorio = `Relação de Pagamentos Realizados${mes}`;
    }
    else if (/Execução.*Despesa/i.test(nomeRelatorio)) {
      const mes = /dezembro/i.test(nomeRelatorio) ? " — Dezembro" : /novembro/i.test(nomeRelatorio) ? " — Novembro" : /outubro/i.test(nomeRelatorio) ? " — Outubro" : /julho/i.test(nomeRelatorio) ? " — Julho" : /fev/i.test(nomeRelatorio) ? " — Fevereiro" : /jan/i.test(nomeRelatorio) ? " — Janeiro" : /agosto/i.test(nomeRelatorio) ? " — Agosto" : /junho/i.test(nomeRelatorio) ? " — Junho" : /mar/i.test(nomeRelatorio) ? " — Março" : "";
      nomeRelatorio = `Demonstrativo da Execução da Despesa Orçamentária${mes}`;
    }
    else if (/Execução.*Receita/i.test(nomeRelatorio)) {
      const mes = /dezembro/i.test(nomeRelatorio) ? " — Dezembro" : /novembro/i.test(nomeRelatorio) ? " — Novembro" : /outubro/i.test(nomeRelatorio) ? " — Outubro" : /julho/i.test(nomeRelatorio) ? " — Julho" : /fev/i.test(nomeRelatorio) ? " — Fevereiro" : /jan/i.test(nomeRelatorio) ? " — Janeiro" : /agosto/i.test(nomeRelatorio) ? " — Agosto" : /junho/i.test(nomeRelatorio) ? " — Junho" : /mar/i.test(nomeRelatorio) ? " — Março" : "";
      nomeRelatorio = `Demonstrativo da Execução da Receita Orçamentária${mes}`;
    }
    else if (/Créditos.*Adicionais/i.test(nomeRelatorio)) {
      const mes = /dez/i.test(nomeRelatorio) ? " — Dezembro" : /novembro/i.test(nomeRelatorio) ? " — Novembro" : /outubro/i.test(nomeRelatorio) ? " — Outubro" : /julho/i.test(nomeRelatorio) ? " — Julho" : /fev/i.test(nomeRelatorio) ? " — Fevereiro" : /janeiro/i.test(nomeRelatorio) ? " — Janeiro" : /março/i.test(nomeRelatorio) ? " — Março" : /junho/i.test(nomeRelatorio) ? " — Junho" : "";
      nomeRelatorio = `Demonstrativo dos Créditos Adicionais${mes}`;
    }
    else if (/Vínculo com.*Recurso/i.test(nomeRelatorio)) nomeRelatorio = "Despesa por Funções e Programas (por Vínculo de Recursos)";
    else if (/Órgão e Funções|Orgão e Funções/i.test(nomeRelatorio)) nomeRelatorio = "Despesa por Órgão e Funções";
    else if (/Projeto.*Atividade/i.test(nomeRelatorio)) nomeRelatorio = "Despesa por Projetos e Atividades";
    else if (/Receita.*Despesa.*Categoria/i.test(nomeRelatorio)) nomeRelatorio = "Receita e Despesa segundo Categorias Econômicas";
    else if (/Despesa.*Categoria/i.test(nomeRelatorio)) nomeRelatorio = "Despesa segundo as Categorias Econômicas";
    else if (/Receita.*Categoria/i.test(nomeRelatorio)) nomeRelatorio = "Receita segundo as Categorias Econômicas";
    else if (/Conta Caixa/i.test(nomeRelatorio)) nomeRelatorio = "Demonstrativo da Conta Caixa";
    else if (/Natureza.*Despesa.*Órgão|Natureza.*Despesa.*Orgão/i.test(nomeRelatorio)) nomeRelatorio = "Natureza da Despesa por Órgão";
    else if (/Natureza.*Despesa.*SubUnidade|Natureza.*Despesa.*Subunidade/i.test(nomeRelatorio)) nomeRelatorio = "Natureza da Despesa por Subunidade";
    else if (/Natureza.*Despesa.*Unidade/i.test(nomeRelatorio)) nomeRelatorio = "Natureza da Despesa por Unidade";
    else if (/Programa de Trabalho/i.test(nomeRelatorio)) nomeRelatorio = "Programa de Trabalho";
    else if (/Publicações da LRF/i.test(nomeRelatorio)) nomeRelatorio = "Demonstrativo de Publicações da LRF";
    else if (/Receita por Fontes e Despesa por Função/i.test(nomeRelatorio)) nomeRelatorio = "Receita por Fontes e Despesa por Função do Governo";

    // Remover mes sobrando ou tralha no final
    nomeRelatorio = nomeRelatorio.replace(/[-–—]\s*$/, "").trim();
    return `Balanço Geral — ${nomeRelatorio} (${exercicio})`;
  }

  else if (tipo === "PARECER_TCE") {
    return `Parecer Prévio do TCE-PI — Contas do Executivo (${exercicio})`;
  }

  return `${limpo} (${exercicio})`;
}

async function executarPadronizacao() {
  console.log("=== INICIANDO PADRONIZAÇÃO DEFINITIVA DE PRESTAÇÃO DE CONTAS ===");
  const { data: docs, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo, tipo, exercicio")
    .eq("categoria", "PRESTACAO_CONTAS");

  if (error || !docs) {
    console.error("Erro ao buscar documentos:", error?.message);
    return;
  }

  console.log(`Analisando ${docs.length} documentos no banco de dados...`);
  let atualizados = 0;

  for (const doc of docs) {
    const tituloPadronizado = padronizarTituloDocumento(doc.titulo || "", doc.tipo || "", doc.exercicio || 2024);

    if (doc.titulo !== tituloPadronizado) {
      const { error: updErr } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .update({ titulo: tituloPadronizado })
        .eq("id", doc.id);

      if (!updErr) {
        atualizados++;
        console.log(`✨ [${doc.exercicio}] ${doc.tipo}\n   ANTES:  ${doc.titulo}\n   DEPOIS: ${tituloPadronizado}\n---`);
      } else {
        console.error(`Erro ao atualizar ID ${doc.id}:`, updErr.message);
      }
    }
  }

  console.log(`\n✅ Padronização Concluída! ${atualizados} de ${docs.length} documentos foram atualizados para o padrão mestre no portal.`);
}

executarPadronizacao();
