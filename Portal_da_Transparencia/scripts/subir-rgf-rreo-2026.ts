/**
 * TASK 3 - Sobe PDFs RGF/RREO 2026 para o Cloudflare R2 e insere no Supabase.
 *
 * Fontes:
 *  - RREO 3º Bimestre (Mai/Jun) 2026: Downloads/RREO 2026 (13 anexos)
 *  - RGF 1º Semestre 2026: Downloads/WhatsApp Unknown 2026-08-11 (6 anexos)
 *
 * Padrões replicados do banco:
 *  - RREO: categoria=PRESTACAO_CONTAS, tipo=RREO, ordem=1..13, data_publicacao=2026-01-01
 *  - RGF:  categoria=PRESTACAO_CONTAS, tipo=RGF, subcategoria=RGF, periodo="1º Semestre", ordem=0
 *  - URLs: planejamento/2026/RREO/<slug>_mai_jun.pdf e planejamento/2026/rgf/<slug>.pdf
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ─── Config R2 ───
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DIR_RREO = "C:/Users/Áurea Letícia/Downloads/RREO 2026";
const DIR_RGF = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch_tarjados_local/rgf2026";

// ─── Definição dos documentos ───
interface DocDef {
  key: string;
  arquivoLocal: string;      // nome do arquivo local (pasta)
  nomeR2: string;            // nome limpo no R2
  titulo: string;
  tipo: "RGF" | "RREO";
  ordem: number;
  arquivo_nome: string;      // nome exibido no portal
}

const DOCS: DocDef[] = [
  // ── RREO — 3º Bimestre (Mai/Jun) 2026 ──
  { key: "RREO_A1",  arquivoLocal: "DM_5620_312_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_01_BO_pag_329.pdf", nomeR2: "Balanco_Orcamentario_-_mai_jun.pdf", titulo: "RREO — Anexo 1: Balanço Orçamentário — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 1,  arquivo_nome: "Balanco_Orcamentario_-_mai_jun.pdf" },
  { key: "RREO_A2",  arquivoLocal: "DM_5620_313_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_02_FUNCAO_pag_333.pdf", nomeR2: "Demonstrativo_das_Despesas_Funcao_Subfuncao_-_mai_jun.pdf", titulo: "RREO — Anexo 2: Despesas por Função e Subfunção — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 2,  arquivo_nome: "Demonstrativo_das_Despesas_Funcao_Subfuncao_-_mai_jun.pdf" },
  { key: "RREO_A3",  arquivoLocal: "DM_5620_314_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_03_RCL_pag_335.pdf", nomeR2: "Receita_Corrente_Liquida_-_mai_jun.pdf", titulo: "RREO — Anexo 3: Receita Corrente Líquida (RCL) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 3,  arquivo_nome: "Receita_Corrente_Liquida_-_mai_jun.pdf" },
  { key: "RREO_A4",  arquivoLocal: "DM_5620_315_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_04_RPPS_pag_336.pdf", nomeR2: "Demonstrativo_das_Receitas_e_Despesas_Previdenciarias_-_mai_jun.pdf", titulo: "RREO — Anexo 4: Receitas e Despesas Previdenciárias — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 4,  arquivo_nome: "Demonstrativo_das_Receitas_e_Despesas_Previdenciarias_-_mai_jun.pdf" },
  { key: "RREO_A6",  arquivoLocal: "DM_5620_316_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_06_PRIMARIO_E_NOMINAL_pag_338.pdf", nomeR2: "Demonstrativo_do_Resultado_Primario_e_Nominal_-_mai_jun.pdf", titulo: "RREO — Anexo 6: Resultado Primário e Nominal — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 5,  arquivo_nome: "Demonstrativo_do_Resultado_Primario_e_Nominal_-_mai_jun.pdf" },
  { key: "RREO_A7",  arquivoLocal: "DM_5620_317_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_07_RESTOS_A_PAGAR_pag_340.pdf", nomeR2: "Demonstrativo_dos_Restos_a_Pagar_por_Poder_e_Orgao_-_mai_jun.pdf", titulo: "RREO — Anexo 7: Restos a Pagar (RP) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 6,  arquivo_nome: "Demonstrativo_dos_Restos_a_Pagar_por_Poder_e_Orgao_-_mai_jun.pdf" },
  { key: "RREO_A8",  arquivoLocal: "DM_5620_318_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_08_MDE_pag_340.pdf", nomeR2: "Demonstrativo_das_Receitas_e_Despesas_com_Manutencao_e_Desenvolvimento_do_Ensino_-_mai_jun.pdf", titulo: "RREO — Anexo 8: Manutenção e Desenvolvimento do Ensino (MDE) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 7,  arquivo_nome: "Demonstrativo_das_Receitas_e_Despesas_com_Manutencao_e_Desenvolvimento_do_Ensino_-_mai_jun.pdf" },
  { key: "RREO_A9",  arquivoLocal: "DM_5620_319_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_09_OP_CREDITO_pag_343.pdf", nomeR2: "Demonstrativo_Receitas_de_Operacao_de_Credito_e_Despesas_de_Capital_-_mai_jun.pdf", titulo: "RREO — Anexo 9: Operações de Crédito e Despesas de Capital — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 8,  arquivo_nome: "Demonstrativo_Receitas_de_Operacao_de_Credito_e_Despesas_de_Capital_-_mai_jun.pdf" },
  { key: "RREO_A10", arquivoLocal: "DM_5620_320_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_10_PROJECAO_RPPS_pag_344.pdf", nomeR2: "Demonstrativo_da_Projecao_Atuarial_do_RPPS_-_mai_jun.pdf", titulo: "RREO — Anexo 10: Projeção Atuarial do RPPS — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 9,  arquivo_nome: "Demonstrativo_da_Projecao_Atuarial_do_RPPS_-_mai_jun.pdf" },
  { key: "RREO_A11", arquivoLocal: "DM_5620_321_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_11_ALIENACAO_pag_345.pdf", nomeR2: "Demonstrativo_da_Receitas_de_Alienacao_de_Ativos_e_Aplicacoes_de_Recursos_-_mai_jun.pdf", titulo: "RREO — Anexo 11: Receitas de Alienação de Ativos — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 10, arquivo_nome: "Demonstrativo_da_Receitas_de_Alienacao_de_Ativos_e_Aplicacoes_de_Recursos_-_mai_jun.pdf" },
  { key: "RREO_A12", arquivoLocal: "DM_5620_322_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_12_SAUDE_pag_346.pdf", nomeR2: "Demonstrativo_das_Receitas_e_Despesas_com_Acoes_e_Servicos_Publicos_de_Saude_-_mai_jun.pdf", titulo: "RREO — Anexo 12: Ações e Serviços Públicos de Saúde (ASPS) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 11, arquivo_nome: "Demonstrativo_das_Receitas_e_Despesas_com_Acoes_e_Servicos_Publicos_de_Saude_-_mai_jun.pdf" },
  { key: "RREO_A13", arquivoLocal: "DM_5620_323_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_13_PPP_pag_348.pdf", nomeR2: "Demonstrativo_das_Parcerias_Publico-Privadas_-_mai_jun.pdf", titulo: "RREO — Anexo 13: Parcerias Público-Privadas (PPP) — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 12, arquivo_nome: "Demonstrativo_das_Parcerias_Publico-Privadas_-_mai_jun.pdf" },
  { key: "RREO_A14", arquivoLocal: "DM_5620_324_Padre_Marcos_LRF_RREO_3_Bimestre_2026_ANEXO_14_SIMPLIFICADO_pag_349.pdf", nomeR2: "Demonstrativo_Simplificado_do_RREO_-_mai_jun.pdf", titulo: "RREO — Anexo 14: Demonstrativo Simplificado do RREO — 3º Bimestre (Mai/Jun) (2026)", tipo: "RREO", ordem: 13, arquivo_nome: "Demonstrativo_Simplificado_do_RREO_-_mai_jun.pdf" },
  // ── RGF — 1º Semestre 2026 ──
  { key: "RGF_A1", arquivoLocal: "RGF ANEXO 1 EXECUTIVO.pdf", nomeR2: "Anexo_1_Despesa_com_Pessoal_1_semestre_2026.pdf", titulo: "RGF — Anexo 1: Despesa com Pessoal — 1º Semestre (2026)", tipo: "RGF", ordem: 0, arquivo_nome: "Anexo_1_Despesa_com_Pessoal_1_semestre_2026.pdf" },
  { key: "RGF_A2", arquivoLocal: "RGF ANEXO 2.pdf", nomeR2: "Anexo_2_Divida_Consolidada_Liquida_1_semestre_2026.pdf", titulo: "RGF — Anexo 2: Dívida Consolidada Líquida — 1º Semestre (2026)", tipo: "RGF", ordem: 0, arquivo_nome: "Anexo_2_Divida_Consolidada_Liquida_1_semestre_2026.pdf" },
  { key: "RGF_A3", arquivoLocal: "RGF ANEXO 3.pdf", nomeR2: "Anexo_3_Garantias_e_Contragarantias_1_semestre_2026.pdf", titulo: "RGF — Anexo 3: Garantias e Contragarantias — 1º Semestre (2026)", tipo: "RGF", ordem: 0, arquivo_nome: "Anexo_3_Garantias_e_Contragarantias_1_semestre_2026.pdf" },
  { key: "RGF_A4", arquivoLocal: "RGF ANEXO 4.pdf", nomeR2: "Anexo_4_Operacoes_de_Credito_1_semestre_2026.pdf", titulo: "RGF — Anexo 4: Operações de Crédito — 1º Semestre (2026)", tipo: "RGF", ordem: 0, arquivo_nome: "Anexo_4_Operacoes_de_Credito_1_semestre_2026.pdf" },
  { key: "RGF_A5", arquivoLocal: "RGF ANEXO 5 EXECUTIVO.pdf", nomeR2: "Anexo_5_Disponibilidade_de_Caixa_e_Restos_a_Pagar_1_semestre_2026.pdf", titulo: "RGF — Anexo 5: Disponibilidade de Caixa e Restos a Pagar — 1º Semestre (2026)", tipo: "RGF", ordem: 0, arquivo_nome: "Anexo_5_Disponibilidade_de_Caixa_e_Restos_a_Pagar_1_semestre_2026.pdf" },
  { key: "RGF_A6", arquivoLocal: "RGF ANEXO 6 EXECUTIVO.pdf", nomeR2: "Anexo_6_Demonstrativo_Simplificado_do_RGF_1_semestre_2026.pdf", titulo: "RGF — Anexo 6: Demonstrativo Simplificado do RGF — 1º Semestre (2026)", tipo: "RGF", ordem: 0, arquivo_nome: "Anexo_6_Demonstrativo_Simplificado_do_RGF_1_semestre_2026.pdf" },
];

// ─── Upload R2 ───
async function uploadParaR2(localPath: string, r2Key: string): Promise<void> {
  const fileBuffer = fs.readFileSync(localPath);
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    })
  );
}

async function main() {
  console.log("🚀 Subindo RGF/RREO 2026 para o Cloudflare R2...\n");
  let upOk = 0;
  let upErro = 0;
  const urls: Record<string, string> = {};

  for (const doc of DOCS) {
    const dir = doc.tipo === "RREO" ? DIR_RREO : DIR_RGF;
    const local = path.join(dir, doc.arquivoLocal);
    const r2Key = doc.tipo === "RREO" ? `planejamento/2026/RREO/${doc.nomeR2}` : `planejamento/2026/rgf/${doc.nomeR2}`;

    if (!fs.existsSync(local)) {
      console.log(`❌ Arquivo não encontrado: ${local}`);
      upErro++;
      continue;
    }

    try {
      console.log(`☁️  ${doc.arquivoLocal}`);
      await uploadParaR2(local, r2Key);
      const url = `${PUBLIC_URL}/${r2Key}`;
      urls[doc.key] = url;
      console.log(`   ✅ ${url}`);
      upOk++;
    } catch (e: any) {
      console.log(`   ❌ Erro: ${e.message}`);
      upErro++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`📤 UPLOAD: ${upOk} ok | ${upErro} erros`);
  console.log(`═══════════════════════════════`);

  if (upErro > 0 || upOk === 0) {
    console.log("Interrompendo (não insere sem upload completo).");
    return;
  }

  // ─── INSERT no Supabase ───
  console.log(`\n🗄️  Inserindo ${DOCS.length} registros no Supabase...`);
  let insOk = 0;
  let insErro = 0;

  for (const doc of DOCS) {
    const { error } = await supabase.schema("transparencia").from("planejamento_documentos").insert({
      categoria: "PRESTACAO_CONTAS",
      subcategoria: doc.tipo === "RGF" ? "RGF" : null,
      tipo: doc.tipo,
      exercicio: 2026,
      periodo: doc.tipo === "RGF" ? "1º Semestre" : null,
      titulo: doc.titulo,
      descricao: doc.tipo === "RGF" ? "Relatório de Gestão Fiscal (2026)" : "Relatório Resumido da Execução Orçamentária (2026)",
      arquivo_url: urls[doc.key],
      arquivo_nome: doc.arquivo_nome,
      data_publicacao: "2026-01-01",
      ordem: doc.ordem,
      ativo: true,
    });
    if (error) {
      console.log(`❌ ${doc.titulo} → ${error.message}`);
      insErro++;
    } else {
      console.log(`✅ ${doc.titulo}`);
      insOk++;
    }
  }

  console.log(`\n═══════════════════════════════`);
  console.log(`🗄️  INSERT: ${insOk} ok | ${insErro} erros`);
  console.log(`═══════════════════════════════`);
}

main().catch(console.error);
