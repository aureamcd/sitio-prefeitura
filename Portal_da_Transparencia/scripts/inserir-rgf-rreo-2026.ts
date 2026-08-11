/**
 * TASK 3 - Relatórios RGF e RREO (2026)
 * ======================================
 * Insere na tabela transparencia.planejamento_documentos:
 *   - 13 anexos do RREO — 3º Bimestre (Mai/Jun) 2026
 *   - 6 anexos do RGF — 1º Semestre 2026
 *
 * COMO USAR:
 * 1. Suba os PDFs no Cloudflare R2 (você faz isso manualmente).
 * 2. Cole as URLs públicas no array R2_URLS abaixo, NA MESMA ORDEM dos arquivos.
 * 3. Rode: npx tsx scripts/inserir-rgf-rreo-2026.ts
 *
 * Padrão replicado do banco (verificado):
 *   RREO: categoria=PRESTACAO_CONTAS, tipo=RREO, ordem=1..13, data_publicacao=2026-01-01
 *   RGF:  categoria=PRESTACAO_CONTAS, tipo=RGF, subcategoria=RGF, periodo="1º Semestre", ordem=0
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* ════════════════════════════════════════════════════════════════════
   COLE AQUI AS URLs DO CLOUDFLARE R2 (após subir os arquivos)
   NA MESMA ORDEM da lista abaixo.
   ════════════════════════════════════════════════════════════════════ */
const R2_URLS: Record<string, string> = {
  // ── RREO 3º Bimestre 2026 (13 anexos) ──
  "RREO_A1": "COLE_A_URL_AQUI",
  "RREO_A2": "COLE_A_URL_AQUI",
  "RREO_A3": "COLE_A_URL_AQUI",
  "RREO_A4": "COLE_A_URL_AQUI",
  "RREO_A6": "COLE_A_URL_AQUI",
  "RREO_A7": "COLE_A_URL_AQUI",
  "RREO_A8": "COLE_A_URL_AQUI",
  "RREO_A9": "COLE_A_URL_AQUI",
  "RREO_A10": "COLE_A_URL_AQUI",
  "RREO_A11": "COLE_A_URL_AQUI",
  "RREO_A12": "COLE_A_URL_AQUI",
  "RREO_A13": "COLE_A_URL_AQUI",
  "RREO_A14": "COLE_A_URL_AQUI",
  // ── RGF 1º Semestre 2026 (6 anexos) ──
  "RGF_A1": "COLE_A_URL_AQUI",
  "RGF_A2": "COLE_A_URL_AQUI",
  "RGF_A3": "COLE_A_URL_AQUI",
  "RGF_A4": "COLE_A_URL_AQUI",
  "RGF_A5": "COLE_A_URL_AQUI",
  "RGF_A6": "COLE_A_URL_AQUI",
};

/* ════════════════════════════════════════════════════════════════════
   DEFINIÇÃO DOS DOCUMENTOS (ordem = exibição na página)
   ════════════════════════════════════════════════════════════════════ */
interface DocDef {
  key: string;
  titulo: string;
  tipo: "RGF" | "RREO";
  exercicio: number;
  periodo: string | null;
  ordem: number;
  arquivo_nome: string;
}

const DOCS: DocDef[] = [
  // ── RREO — 3º Bimestre (Mai/Jun) 2026 ──
  { key: "RREO_A1",  titulo: "RREO — Anexo 1: Balanço Orçamentário — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 1,  arquivo_nome: "DM_5620_312_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_01_BO_pag_329.pdf" },
  { key: "RREO_A2",  titulo: "RREO — Anexo 2: Despesas por Função e Subfunção — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 2,  arquivo_nome: "DM_5620_313_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_02_FUNCAO_pag_333.pdf" },
  { key: "RREO_A3",  titulo: "RREO — Anexo 3: Receita Corrente Líquida (RCL) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 3,  arquivo_nome: "DM_5620_314_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_03_RCL_pag_335.pdf" },
  { key: "RREO_A4",  titulo: "RREO — Anexo 4: Receitas e Despesas Previdenciárias — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 4,  arquivo_nome: "DM_5620_315_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_04_RPPS_pag_336.pdf" },
  { key: "RREO_A6",  titulo: "RREO — Anexo 6: Resultado Primário e Nominal — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 5,  arquivo_nome: "DM_5620_316_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_06_PRIMARIO_E_NOMINAL_pag_338.pdf" },
  { key: "RREO_A7",  titulo: "RREO — Anexo 7: Restos a Pagar (RP) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 6,  arquivo_nome: "DM_5620_317_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_07_RESTOS_A_PAGAR_pag_340.pdf" },
  { key: "RREO_A8",  titulo: "RREO — Anexo 8: Manutenção e Desenvolvimento do Ensino (MDE) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 7,  arquivo_nome: "DM_5620_318_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_08_MDE_pag_340.pdf" },
  { key: "RREO_A9",  titulo: "RREO — Anexo 9: Operações de Crédito e Despesas de Capital — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 8,  arquivo_nome: "DM_5620_319_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_09_OP_CREDITO_pag_343.pdf" },
  { key: "RREO_A10", titulo: "RREO — Anexo 10: Projeção Atuarial do RPPS — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 9,  arquivo_nome: "DM_5620_320_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_10_PROJECAO_RPPS_pag_344.pdf" },
  { key: "RREO_A11", titulo: "RREO — Anexo 11: Receitas de Alienação de Ativos — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 10, arquivo_nome: "DM_5620_321_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_11_ALIENACAO_pag_345.pdf" },
  { key: "RREO_A12", titulo: "RREO — Anexo 12: Ações e Serviços Públicos de Saúde (ASPS) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 11, arquivo_nome: "DM_5620_322_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_12_SAUDE_pag_346.pdf" },
  { key: "RREO_A13", titulo: "RREO — Anexo 13: Parcerias Público-Privadas (PPP) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 12, arquivo_nome: "DM_5620_323_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_13_PPP_pag_348.pdf" },
  { key: "RREO_A14", titulo: "RREO — Anexo 14: Demonstrativo Simplificado do RREO — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", exercicio: 2026, periodo: null, ordem: 13, arquivo_nome: "DM_5620_324_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_14_SIMPLIFICADO_pag_349.pdf" },
  // ── RGF — 1º Semestre 2026 ──
  { key: "RGF_A1", titulo: "RGF — Anexo 1: Despesa com Pessoal — 1º Semestre (2026)", tipo: "RGF", exercicio: 2026, periodo: "1º Semestre", ordem: 0, arquivo_nome: "RGF ANEXO 1 EXECUTIVO.pdf" },
  { key: "RGF_A2", titulo: "RGF — Anexo 2: Dívida Consolidada Líquida — 1º Semestre (2026)", tipo: "RGF", exercicio: 2026, periodo: "1º Semestre", ordem: 0, arquivo_nome: "RGF ANEXO 2.pdf" },
  { key: "RGF_A3", titulo: "RGF — Anexo 3: Garantias e Contragarantias — 1º Semestre (2026)", tipo: "RGF", exercicio: 2026, periodo: "1º Semestre", ordem: 0, arquivo_nome: "RGF ANEXO 3.pdf" },
  { key: "RGF_A4", titulo: "RGF — Anexo 4: Operações de Crédito — 1º Semestre (2026)", tipo: "RGF", exercicio: 2026, periodo: "1º Semestre", ordem: 0, arquivo_nome: "RGF ANEXO 4.pdf" },
  { key: "RGF_A5", titulo: "RGF — Anexo 5: Disponibilidade de Caixa e Restos a Pagar — 1º Semestre (2026)", tipo: "RGF", exercicio: 2026, periodo: "1º Semestre", ordem: 0, arquivo_nome: "RGF ANEXO 5 EXECUTIVO.pdf" },
  { key: "RGF_A6", titulo: "RGF — Anexo 6: Demonstrativo Simplificado do RGF — 1º Semestre (2026)", tipo: "RGF", exercicio: 2026, periodo: "1º Semestre", ordem: 0, arquivo_nome: "RGF ANEXO 6 EXECUTIVO.pdf" },
];

/* ════════════════════════════════════════════════════════════════════
   MAIN
   ════════════════════════════════════════════════════════════════════ */
async function main() {
  // Valida que as URLs foram preenchidas
  const pendentes = DOCS.filter((d) => !R2_URLS[d.key] || R2_URLS[d.key] === "COLE_A_URL_AQUI");
  if (pendentes.length > 0) {
    console.log(`⚠️  ${pendentes.length} documento(s) ainda sem URL no R2.`);
    console.log("   Preencha o objeto R2_URLS no topo do script e rode novamente.\n");
    pendentes.forEach((d) => console.log(`   - ${d.titulo}`));
    return;
  }

  console.log(`🚀 Inserindo ${DOCS.length} documentos (${DOCS.filter((d) => d.tipo === "RREO").length} RREO + ${DOCS.filter((d) => d.tipo === "RGF").length} RGF)...\n`);

  let ok = 0;
  let erros = 0;

  for (const doc of DOCS) {
    const row = {
      categoria: "PRESTACAO_CONTAS",
      subcategoria: doc.tipo === "RGF" ? "RGF" : null,
      tipo: doc.tipo,
      exercicio: doc.exercicio,
      periodo: doc.periodo,
      titulo: doc.titulo,
      descricao: doc.tipo === "RGF"
        ? `Relatório de Gestão Fiscal (${doc.exercicio})`
        : `Relatório Resumido da Execução Orçamentária (${doc.exercicio})`,
      arquivo_url: R2_URLS[doc.key],
      arquivo_nome: doc.arquivo_nome,
      data_publicacao: "2026-01-01",
      ordem: doc.ordem,
      ativo: true,
    };

    const { error } = await supabase.schema("transparencia").from("planejamento_documentos").insert([row]);
    if (error) {
      console.log(`❌ ${doc.titulo} → ${error.message}`);
      erros++;
    } else {
      console.log(`✅ ${doc.titulo}`);
      ok++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`📊 RESUMO: ${ok} inseridos | ${erros} erros`);
  console.log(`═══════════════════════════════`);
}

main().catch(console.error);
