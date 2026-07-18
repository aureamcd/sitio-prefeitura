import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ─── Config ─────────────────────────────────────────────────────────────────
const s3 = new S3Client({
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

// ─── Caminho base dos downloads ─────────────────────────────────────────────
const DOWNLOADS = "C:\\Users\\Áurea Letícia\\Downloads";
const CONTREINA = path.join(DOWNLOADS, "Contreina");

// ─── Mapeamento: pasta → categoria + tipo ───────────────────────────────────
interface CategoriaMap {
  categoria: string;
  tipo: string;
  tituloPrefix: string;
}

function getCategoria(subfolder: string): CategoriaMap | null {
  const map: Record<string, CategoriaMap> = {
    "Balanços":  { categoria: "PRESTACAO_CONTAS", tipo: "BALANCO_GERAL", tituloPrefix: "Balanço Geral" },
    "RGF":       { categoria: "PRESTACAO_CONTAS", tipo: "RGF",           tituloPrefix: "RGF" },
    "RREO":      { categoria: "PRESTACAO_CONTAS", tipo: "RREO",          tituloPrefix: "RREO" },
    "Parecer TCE": { categoria: "PRESTACAO_CONTAS", tipo: "PARECER_TCE", tituloPrefix: "Parecer Prévio TCE-PI" },
  };
  return map[subfolder] ?? null;
}

// ─── Sanitizar nome de arquivo para R2 ──────────────────────────────────────
function sanitizeName(name: string): string {
  return name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
}

// ─── Padronização Mestre para o Portal ──────────────────────────────────────
function padronizarTituloDocumento(tituloOriginal: string, tipo: string, exercicio: number): string {
  let limpo = tituloOriginal || "";
  limpo = limpo.replace(/^\s*RREO\s*[-–—]\s*/i, "").replace(/^\s*RGF\s*[-–—]\s*/i, "").replace(/^\s*Balanço Geral\s*[-–—]\s*/i, "").replace(/^\s*TCE-PI\s*[-–—]\s*/i, "").replace(/\s*\(\d{4}\)\s*$/i, "").replace(/\.pdf$/i, "").trim();

  if (tipo === "RREO") {
    let periodo = "";
    if (/bimestre\s*1|bimetre\s*1|jan.*fev|janeiro.*fevereiro/i.test(limpo)) periodo = "1º Bimestre (Jan/Fev)";
    else if (/bimestre\s*2|bimetre\s*2|mar.*abr|março.*abril|mac.*abril/i.test(limpo)) periodo = "2º Bimestre (Mar/Abr)";
    else if (/bimestre\s*3|bimetre\s*3|mai.*jun|maio.*junho/i.test(limpo)) periodo = "3º Bimestre (Mai/Jun)";
    else if (/bimestre\s*4|bimetre\s*4|jul.*ago|julho.*agosto/i.test(limpo)) periodo = "4º Bimestre (Jul/Ago)";
    else if (/bimestre\s*5|bimetre\s*5|set.*out|setembro.*outubro/i.test(limpo)) periodo = "5º Bimestre (Set/Out)";
    else if (/bimestre\s*6|bimetre\s*6|nov.*dez|novembro.*dezembro/i.test(limpo)) periodo = "6º Bimestre (Nov/Dez)";
    else if (/jan.*dez|janeiro.*dezembro|anual/i.test(limpo)) periodo = "Anual (Exercício Completo)";
    else if (/mes\s*0?1\b|janeiro/i.test(limpo)) periodo = "Janeiro";
    else if (/mes\s*0?2\b|fevereiro/i.test(limpo)) periodo = "Fevereiro";
    else if (/mes\s*0?3\b|março|marco/i.test(limpo)) periodo = "Março";
    else if (/mes\s*0?4\b|abril/i.test(limpo)) periodo = "Abril";
    else if (/mes\s*0?5\b|maio/i.test(limpo)) periodo = "Maio";
    else if (/mes\s*0?6\b|junho/i.test(limpo)) periodo = "Junho";
    else if (/mes\s*0?7\b|julho/i.test(limpo)) periodo = "Julho";
    else if (/mes\s*0?8\b|agosto/i.test(limpo)) periodo = "Agosto";
    else if (/mes\s*0?9\b|setembro/i.test(limpo)) periodo = "Setembro";
    else if (/mes\s*10\b|outubro/i.test(limpo)) periodo = "Outubro";
    else if (/mes\s*11\b|novembro/i.test(limpo)) periodo = "Novembro";
    else if (/mes\s*12\b|dezembro/i.test(limpo)) periodo = "Dezembro";
    else {
      const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      for (const m of meses) if (new RegExp(m, "i").test(limpo)) { periodo = m; break; }
    }

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
      nomeRelatorio = nomeRelatorio.replace(/bimetre\s*\d|bimestre\s*\d|mes\s*\d+|janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/gi, "").trim();
      nomeRelatorio = nomeRelatorio.replace(/[-–—]+$/, "").trim();
    }
    return periodo ? `RREO — ${nomeRelatorio} — ${periodo} (${exercicio})` : `RREO — ${nomeRelatorio} (${exercicio})`;
  }
  else if (tipo === "RGF") {
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
    nomeRelatorio = nomeRelatorio.replace(/^ANEXO\s*\d+[A-Z]*\s*[-–—]\s*/i, "").replace(/^\d+\s*[-–—]\s*/, "");
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
    nomeRelatorio = nomeRelatorio.replace(/[-–—]\s*$/, "").trim();
    return `Balanço Geral — ${nomeRelatorio} (${exercicio})`;
  }
  else if (tipo === "PARECER_TCE") return `Parecer Prévio do TCE-PI — Contas do Executivo (${exercicio})`;
  return `${limpo} (${exercicio})`;
}

// ─── Extrair ano do nome da pasta ───────────────────────────────────────────
function parseYear(dirName: string): number | null {
  const n = parseInt(dirName, 10);
  return n >= 1900 && n <= 2100 ? n : null;
}

// ─── Main ───────────────────────────────────────────────────────────────────
interface ItemMigracao {
  filePath: string;
  categoria: string;
  tipo: string;
  titulo: string;
  exercicio: number;
}

async function main() {
  const itens: ItemMigracao[] = [];

  // Percorre as subpastas: Balanços, RGF, RREO, "Parecer TCE"
  const subfolders = fs.readdirSync(CONTREINA, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const sub of subfolders) {
    const catInfo = getCategoria(sub.name);
    if (!catInfo) {
      console.log(`⚠️  Ignorando pasta desconhecida: ${sub.name}`);
      continue;
    }

    const subPath = path.join(CONTREINA, sub.name);

    // Percorre as subpastas de ano: 2023, 2024, 2025, 2026…
    const anos = fs.readdirSync(subPath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const anoDir of anos) {
      const exercicio = parseYear(anoDir.name);
      if (!exercicio) {
        console.log(`⚠️  Ignorando pasta (não é ano): ${anoDir.name} em ${sub.name}`);
        continue;
      }

      const anoPath = path.join(subPath, anoDir.name);
      const files = fs.readdirSync(anoPath).filter(f => f.endsWith(".pdf"));

      if (files.length === 0) {
        console.log(`📭 ${sub.name}/${anoDir.name}: sem arquivos PDF`);
        continue;
      }

      console.log(`📁 ${sub.name}/${anoDir.name}: ${files.length} arquivos`);

      for (const file of files) {
        const tituloBonito = padronizarTituloDocumento(file, catInfo.tipo, exercicio);
        itens.push({
          filePath: path.join(anoPath, file),
          categoria: catInfo.categoria,
          tipo: catInfo.tipo,
          titulo: tituloBonito,
          exercicio,
        });
      }
    }
  }

  if (itens.length === 0) {
    console.log("❌ Nenhum arquivo encontrado para migrar.");
    return;
  }

  console.log(`\n🚀 Iniciando migração de ${itens.length} arquivos...\n`);

  let enviados = 0;
  let cadastrados = 0;
  let erros = 0;

  for (const item of itens) {
    const fileName = path.basename(item.filePath);
    const safeName = sanitizeName(fileName);
    const r2Key = `planejamento/${item.exercicio}/${item.tipo}/${safeName}`;
    const arquivoUrl = `${PUBLIC_URL}/${r2Key}`;

    console.log(`📄 ${item.titulo}`);

    // 0. Checar se já existe no banco
    const { data: existente } = await supabase
      .schema("transparencia")
      .from("planejamento_documentos")
      .select("id")
      .eq("exercicio", item.exercicio)
      .eq("arquivo_nome", safeName)
      .maybeSingle();

    if (existente) {
      console.log(`   ⏭️  Já cadastrado no banco. Pulando upload e mantendo marcado para limpeza...`);
      enviados++;
      cadastrados++;
      continue;
    }

    // 1. Upload para R2
    try {
      const fileBuffer = fs.readFileSync(item.filePath);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: "application/pdf",
        })
      );
      console.log(`   ☁️  R2 OK (${(fileBuffer.length / 1024).toFixed(0)} KB)`);
      enviados++;
    } catch (err: any) {
      console.error(`   ❌ Erro R2: ${err.message}`);
      erros++;
      continue;
    }

    // 2. Cadastro no Supabase
    try {
      const { error } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          categoria: item.categoria,
          tipo: item.tipo,
          titulo: item.titulo,
          exercicio: item.exercicio,
          descricao: `Documento de prestação de contas do exercício ${item.exercicio} — ${item.tipo}.`,
          data_publicacao: `${item.exercicio}-01-01`,
          arquivo_url: arquivoUrl,
          arquivo_nome: safeName,
          ativo: true,
          ordem: 1,
        });

      if (error) {
        console.error(`   ❌ Supabase: ${error.message}`);
        erros++;
      } else {
        console.log(`   🗄️  Supabase OK`);
        cadastrados++;
      }
    } catch (err: any) {
      console.error(`   ❌ Erro Supabase: ${err.message}`);
      erros++;
    }
  }

  console.log("\n═══════════════════════════════════════");
  console.log("📊 RESUMO DA MIGRAÇÃO:");
  console.log(`   ☁️  Enviados p/ R2: ${enviados}`);
  console.log(`   🗄️  Cadastrados no BD: ${cadastrados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log("═══════════════════════════════════════\n");

  // ── Limpeza: remover arquivos enviados com sucesso ──────────────────────
  if (erros === 0 && enviados > 0) {
    console.log("🧹 Limpando arquivos locais (enviados com sucesso)...\n");
    let deletados = 0;
    for (const item of itens) {
      try {
        fs.unlinkSync(item.filePath);
        deletados++;
        console.log(`   🗑️  Removido: ${path.basename(item.filePath)}`);
      } catch (err: any) {
        console.error(`   ⚠️  Erro ao remover ${item.filePath}: ${err.message}`);
      }
    }

    // Remover pastas vazias
    const pastas = new Set<string>();
    for (const item of itens) {
      pastas.add(path.dirname(item.filePath));
    }
    for (const pasta of pastas) {
      try {
        const resto = fs.readdirSync(pasta);
        if (resto.length === 0) {
          fs.rmdirSync(pasta);
          console.log(`   🗑️  Pasta vazia removida: ${pasta}`);
        }
      } catch { /* ignora */ }
    }

    // Tentar remover pastas de ano se ficaram vazias
    for (const item of itens) {
      const anoPath = path.dirname(item.filePath);
      try {
        const resto = fs.readdirSync(anoPath);
        if (resto.length === 0) {
          fs.rmdirSync(anoPath);
          console.log(`   🗑️  Pasta de ano removida: ${anoPath}`);
        }
      } catch { /* ignora */ }
    }

    console.log(`\n🧹 Limpeza concluída: ${deletados} arquivo(s) removido(s).`);
  } else if (enviados > 0) {
    console.log("⚠️  Pulando limpeza devido a erros durante o upload.");
  }
}

main().catch(console.error);
