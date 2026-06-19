import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// ─── Config R2 ──────────────────────────────────────────────────────────────
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

// ─── Config Supabase ────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Pastas ─────────────────────────────────────────────────────────────────
const TEMP_DIR = path.resolve(__dirname, "../../temp-tce-docs");

// ─── Mapeamento: nome do arquivo → metadados ────────────────────────────────
interface DocInfo {
  tipo: string;       // PPA, LDO, LOA, OUTROS
  titulo: string;
  descricao: string;
  ordem: number;
}

function extrairInfo(arquivo: string): DocInfo | null {
  const nome = path.basename(arquivo, ".pdf").toLowerCase();

  if (nome.includes("ppa-plano-plurianual")) {
    return {
      tipo: "PPA",
      titulo: "Plano Plurianual (PPA) 2026–2029",
      descricao: "Plano Plurianual do Município de Padre Marcos para o quadriênio 2026–2029.",
      ordem: 1,
    };
  }
  if (nome.includes("ldo-lei-de-diretrizes-orcamentarias")) {
    return {
      tipo: "LDO",
      titulo: "Lei de Diretrizes Orçamentárias (LDO) 2026",
      descricao: "Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2026.",
      ordem: 1,
    };
  }
  if (nome.includes("loa-lei-orcamentaria-anual")) {
    return {
      tipo: "LOA",
      titulo: "Lei Orçamentária Anual (LOA) 2026",
      descricao: "Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2026.",
      ordem: 1,
    };
  }
  if (nome.includes("programacao-financeira")) {
    return {
      tipo: "OUTROS",
      titulo: "Programação Financeira 2026",
      descricao: "Programação financeira do Município de Padre Marcos para o exercício de 2026.",
      ordem: 10,
    };
  }
  if (nome.includes("cronograma-de-execucao-mensal-de-desembolso")) {
    return {
      tipo: "OUTROS",
      titulo: "Cronograma de Execução Mensal de Desembolso 2026",
      descricao: "Cronograma de execução mensal de desembolso do Município de Padre Marcos para 2026.",
      ordem: 11,
    };
  }
  if (nome.includes("desdobramento-das-receitas-em-metas-bimestrais")) {
    return {
      tipo: "OUTROS",
      titulo: "Desdobramento das Receitas em Metas Bimestrais 2026",
      descricao: "Desdobramento das receitas em metas bimestrais de arrecadação para o exercício de 2026.",
      ordem: 12,
    };
  }
  if (nome.includes("parecer-do-orgao-de-controle-interno")) {
    return {
      tipo: "OUTROS",
      titulo: "Parecer do Órgão de Controle Interno 2026",
      descricao: "Parecer do órgão de controle interno sobre as contas do exercício de 2026.",
      ordem: 20,
    };
  }
  if (nome.includes("contribuicoes-previdenciarias-rpps-parcelamento")) {
    return {
      tipo: "OUTROS",
      titulo: "Contribuições Previdenciárias RPPS — Parcelamento 2026",
      descricao: "Demonstrativo das contribuições previdenciárias ao RPPS — Parcelamento, exercício 2026.",
      ordem: 30,
    };
  }
  if (nome.includes("contribuicoes-previdenciarias-rpps-folha")) {
    return {
      tipo: "OUTROS",
      titulo: "Contribuições Previdenciárias RPPS — Folha 2026",
      descricao: "Demonstrativo das contribuições previdenciárias ao RPPS — Folha de pagamento, exercício 2026.",
      ordem: 31,
    };
  }
  if (nome.includes("parecer-do-conselho-do-fmas")) {
    return {
      tipo: "OUTROS",
      titulo: "Parecer do Conselho Municipal de Assistência Social (FMAS) 2026",
      descricao: "Parecer do Conselho Municipal de Assistência Social sobre o Fundo Municipal de Assistência Social, exercício 2026.",
      ordem: 40,
    };
  }

  return null;
}

// ─── Upload p/ R2 ───────────────────────────────────────────────────────────
async function uploadParaR2(localPath: string, r2Key: string): Promise<void> {
  const contentType = "application/pdf";
  const fileBuffer = fs.readFileSync(localPath);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Iniciando migração dos documentos de planejamento...\n");

  // 1. Listar arquivos PDF da pasta temp-tce-docs
  const files = fs.readdirSync(TEMP_DIR).filter(f => f.endsWith(".pdf"));
  console.log(`📂 Encontrados ${files.length} PDF(s) em temp-tce-docs/\n`);

  let inseridos = 0;
  let erros = 0;

  for (const file of files) {
    const localPath = path.join(TEMP_DIR, file);
    const info = extrairInfo(file);

    if (!info) {
      console.log(`⚠️  Ignorado (sem mapeamento): ${file}`);
      continue;
    }

    // Extrair ano do exercício (padrão: 2026)
    const exercicio = 2026;

    // Key no R2: planejamento/ANO/TIPO/nome-arquivo.pdf
    const r2Key = `planejamento/${exercicio}/${info.tipo}/${file}`;
    const arquivoUrl = `${PUBLIC_URL}/${r2Key}`;

    try {
      // 2. Upload para o R2
      console.log(`📤 Enviando para R2: ${r2Key}`);
      await uploadParaR2(localPath, r2Key);
      console.log(`   ✅ R2: ${r2Key}`);

      // 3. Inserir no Supabase
      const { error: insertError } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          categoria: "PLANEJAMENTO_ORCAMENTARIO",
          tipo: info.tipo,
          titulo: info.titulo,
          exercicio,
          descricao: info.descricao,
          data_publicacao: new Date().toISOString().split("T")[0],
          arquivo_url: arquivoUrl,
          arquivo_nome: file,
          ativo: true,
          ordem: info.ordem,
        });

      if (insertError) {
        console.error(`   ❌ Supabase: ${insertError.message}`);
        erros++;
      } else {
        console.log(`   ✅ Supabase: ${info.titulo}`);
        inseridos++;
      }
    } catch (err) {
      console.error(`   ❌ Erro em ${file}:`, err);
      erros++;
    }

    console.log(""); // linha em branco
  }

  console.log("═══════════════════════════════════════");
  console.log(`✅ Inseridos: ${inseridos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📂 Total processados: ${files.length}`);
  console.log("═══════════════════════════════════════\n");
}

main().catch(console.error);
