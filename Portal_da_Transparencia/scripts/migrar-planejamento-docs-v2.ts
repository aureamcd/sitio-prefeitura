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
const documentos = [
  {
    file: "tce-10039803-ppa-plano-plurianual-2026-2029.pdf",
    tipo: "PPA",
    titulo: "Plano Plurianual (PPA) 2026–2029",
    descricao: "Plano Plurianual do Município de Padre Marcos para o quadriênio 2026–2029.",
    ordem: 1,
  },
  {
    file: "tce-10039795-ldo-lei-de-diretrizes-orcamentarias-2026.pdf",
    tipo: "LDO",
    titulo: "Lei de Diretrizes Orçamentárias (LDO) 2026",
    descricao: "Lei de Diretrizes Orçamentárias do Município de Padre Marcos para o exercício de 2026.",
    ordem: 1,
  },
  {
    file: "tce-10039802-loa-lei-orcamentaria-anual-2026.pdf",
    tipo: "LOA",
    titulo: "Lei Orçamentária Anual (LOA) 2026",
    descricao: "Lei Orçamentária Anual do Município de Padre Marcos para o exercício de 2026.",
    ordem: 1,
  },
  // ── Documentos complementares (serão inseridos em outra categoria) ──
  {
    file: "tce-10118773-programacao-financeira-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Programação Financeira 2026",
    descricao: "Programação financeira do Município de Padre Marcos para o exercício de 2026.",
    ordem: 10,
  },
  {
    file: "tce-10118771-cronograma-de-execucao-mensal-de-desembolso-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Cronograma de Execução Mensal de Desembolso 2026",
    descricao: "Cronograma de execução mensal de desembolso do Município de Padre Marcos para 2026.",
    ordem: 11,
  },
  {
    file: "tce-10118776-desdobramento-das-receitas-em-metas-bimestrais-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Desdobramento das Receitas em Metas Bimestrais 2026",
    descricao: "Desdobramento das receitas em metas bimestrais de arrecadação para o exercício de 2026.",
    ordem: 12,
  },
  {
    file: "tce-10110825-parecer-do-orgao-de-controle-interno-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Parecer do Órgão de Controle Interno 2026",
    descricao: "Parecer do órgão de controle interno sobre as contas do exercício de 2026.",
    ordem: 20,
  },
  {
    file: "tce-10110665-contribuicoes-previdenciarias-rpps-parcelamento-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Contribuições Previdenciárias RPPS — Parcelamento 2026",
    descricao: "Demonstrativo das contribuições previdenciárias ao RPPS — Parcelamento, exercício 2026.",
    ordem: 30,
  },
  {
    file: "tce-10110779-contribuicoes-previdenciarias-rpps-folha-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Contribuições Previdenciárias RPPS — Folha 2026",
    descricao: "Demonstrativo das contribuições previdenciárias ao RPPS — Folha de pagamento, exercício 2026.",
    ordem: 31,
  },
  {
    file: "tce-10203227-parecer-do-conselho-do-fmas-2026.pdf",
    tipo: "COMPLEMENTAR",
    titulo: "Parecer do Conselho Municipal de Assistência Social (FMAS) 2026",
    descricao: "Parecer do Conselho Municipal de Assistência Social sobre o Fundo Municipal de Assistência Social, exercício 2026.",
    ordem: 40,
  },
];

// ─── Upload p/ R2 ───────────────────────────────────────────────────────────
async function uploadParaR2(localPath: string, r2Key: string): Promise<void> {
  const fileBuffer = fs.readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    })
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Iniciando migração dos documentos de planejamento...\n");

  let inseridosPPA = 0;
  let inseridosComplementares = 0;
  let erros = 0;

  for (const doc of documentos) {
    const localPath = path.join(TEMP_DIR, doc.file);

    if (!fs.existsSync(localPath)) {
      console.log(`⚠️  Arquivo não encontrado: ${doc.file}`);
      continue;
    }

    const exercicio = 2026;
    const r2Key = `planejamento/${exercicio}/${doc.tipo}/${doc.file}`;
    const arquivoUrl = `${PUBLIC_URL}/${r2Key}`;

    try {
      // Upload para o R2
      console.log(`📤 Enviando: ${doc.file}`);
      await uploadParaR2(localPath, r2Key);
      console.log(`   ✅ R2: ${r2Key}`);

      // Inserir no Supabase
      const { error: insertError } = await supabase
        .schema("transparencia")
        .from("planejamento_documentos")
        .insert({
          categoria: "PLANEJAMENTO_ORCAMENTARIO",
          tipo: doc.tipo,
          titulo: doc.titulo,
          exercicio,
          descricao: doc.descricao,
          data_publicacao: new Date().toISOString().split("T")[0],
          arquivo_url: arquivoUrl,
          arquivo_nome: doc.file,
          ativo: true,
          ordem: doc.ordem,
        });

      if (insertError) {
        console.error(`   ❌ Supabase: ${insertError.message}`);
        erros++;
      } else {
        console.log(`   ✅ Supabase: ${doc.titulo}`);
        if (doc.tipo === "PPA" || doc.tipo === "LDO" || doc.tipo === "LOA") {
          inseridosPPA++;
        } else {
          inseridosComplementares++;
        }
      }
    } catch (err) {
      console.error(`   ❌ Erro em ${doc.file}:`, err);
      erros++;
    }
    console.log("");
  }

  console.log("═══════════════════════════════════════");
  console.log(`✅ PPA/LDO/LOA: ${inseridosPPA}`);
  console.log(`✅ Complementares: ${inseridosComplementares}`);
  console.log(`❌ Erros: ${erros}`);
  console.log("═══════════════════════════════════════");
}

main().catch(console.error);
