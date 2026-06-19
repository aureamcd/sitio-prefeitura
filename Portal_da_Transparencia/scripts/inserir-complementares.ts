import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ─── Config Supabase ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const documentos = [
  {
    tipo: "PROGRAMACAO_FINANCEIRA",
    titulo: "Programação Financeira 2026",
    descricao: "Programação financeira do Município de Padre Marcos para o exercício de 2026.",
    ordem: 10,
    arquivo_nome: "tce-10118773-programacao-financeira-2026.pdf",
  },
  {
    tipo: "CRONOGRAMA_DESEMBOLSO",
    titulo: "Cronograma de Execução Mensal de Desembolso 2026",
    descricao: "Cronograma de execução mensal de desembolso do Município de Padre Marcos para 2026.",
    ordem: 11,
    arquivo_nome: "tce-10118771-cronograma-de-execucao-mensal-de-desembolso-2026.pdf",
  },
  {
    tipo: "METAS_BIMESTRAIS",
    titulo: "Desdobramento das Receitas em Metas Bimestrais 2026",
    descricao: "Desdobramento das receitas em metas bimestrais de arrecadação para o exercício de 2026.",
    ordem: 12,
    arquivo_nome: "tce-10118776-desdobramento-das-receitas-em-metas-bimestrais-2026.pdf",
  },
  {
    tipo: "PARECER_CONTROLE_INTERNO",
    titulo: "Parecer do Órgão de Controle Interno 2026",
    descricao: "Parecer do órgão de controle interno sobre as contas do exercício de 2026.",
    ordem: 20,
    arquivo_nome: "tce-10110825-parecer-do-orgao-de-controle-interno-2026.pdf",
  },
  {
    tipo: "CONTRIBUICOES_RPPS_PARCELAMENTO",
    titulo: "Contribuições Previdenciárias RPPS — Parcelamento 2026",
    descricao: "Demonstrativo das contribuições previdenciárias ao RPPS — Parcelamento, exercício 2026.",
    ordem: 30,
    arquivo_nome: "tce-10110665-contribuicoes-previdenciarias-rpps-parcelamento-2026.pdf",
  },
  {
    tipo: "CONTRIBUICOES_RPPS_FOLHA",
    titulo: "Contribuições Previdenciárias RPPS — Folha 2026",
    descricao: "Demonstrativo das contribuições previdenciárias ao RPPS — Folha de pagamento, exercício 2026.",
    ordem: 31,
    arquivo_nome: "tce-10110779-contribuicoes-previdenciarias-rpps-folha-2026.pdf",
  },
  {
    tipo: "PARECER_CONSELHO_FMAS",
    titulo: "Parecer do Conselho Municipal de Assistência Social (FMAS) 2026",
    descricao: "Parecer do Conselho Municipal de Assistência Social sobre o Fundo Municipal de Assistência Social, exercício 2026.",
    ordem: 40,
    arquivo_nome: "tce-10203227-parecer-do-conselho-do-fmas-2026.pdf",
  },
];

async function main() {
  console.log("🚀 Inserindo documentos complementares na tabela planejamento_documentos...\n");

  let inseridos = 0;
  let erros = 0;

  for (const doc of documentos) {
    const arquivoUrl = `${PUBLIC_URL}/planejamento/2026/OUTROS/${doc.arquivo_nome}`;

    const { error } = await supabase
      .schema("transparencia")
      .from("planejamento_documentos")
      .insert({
        categoria: "PLANEJAMENTO_ORCAMENTARIO",
        tipo: doc.tipo,
        titulo: doc.titulo,
        exercicio: 2026,
        descricao: doc.descricao,
        data_publicacao: new Date().toISOString().split("T")[0],
        arquivo_url: arquivoUrl,
        arquivo_nome: doc.arquivo_nome,
        ativo: true,
        ordem: doc.ordem,
      });

    if (error) {
      console.error(`❌ ${doc.titulo}: ${error.message}`);
      erros++;
    } else {
      console.log(`✅ ${doc.titulo}`);
      inseridos++;
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log(`✅ Inseridos: ${inseridos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log("═══════════════════════════════════════");
}

main().catch(console.error);
