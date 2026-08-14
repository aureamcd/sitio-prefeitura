/**
 * TASK - Prestação de Contas (anos anteriores)
 * ===========================================
 * Os PDFs de PPA/LDO/LOA dos exercícios 2022-2025 estão VAZIOS (0 bytes) no R2.
 * Este script sobe os arquivos reais (WhatsApp 2026-08-11 19.26.18) para os
 * MESMOS caminhos do R2 (para não alterar as URLs dos registros) e cria o
 * registro novo do PPA 2018-2021 (que não existia no banco).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
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

const DIR = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch/wa-prestacao";

// ─── Mapeamento: arquivo local → caminho no R2 (mesmo caminho do banco) ───
interface UploadDef {
  arquivoLocal: string;
  caminhoR2: string; // caminho no bucket (sem barra inicial)
  recordId?: string; // se houver registro para atualizar (apenas por segurança)
}

const UPLOADS: UploadDef[] = [
  {
    arquivoLocal: "LEI 724_LDO 2023.pdf",
    caminhoR2: "planejamento/2023/LDO/lei-de-diretrizes-orcamentarias-ldo-2023.pdf",
    recordId: "094fee39-a4c8-4455-83ac-dd3d88035c31",
  },
  {
    arquivoLocal: "Lei 769-2024 - LDO 2025.pdf",
    caminhoR2: "planejamento/2025/LDO/lei-de-diretrizes-orcamentarias-ldo-2025.pdf",
    recordId: "539b7545-b74c-42ca-bbbe-f9248ad2fc52",
  },
  {
    arquivoLocal: "Lei 778-2024 - Alterao PPA 22-25.pdf",
    caminhoR2: "planejamento/2024/PPA/lei-de-alteracao-do-plano-plurianual-2022-2025-2024.pdf",
    recordId: "4041cdb0-bd08-4379-b600-d7303d7a33b4",
  },
  {
    arquivoLocal: "LEI n 763-2023 LOA 2024.pdf",
    caminhoR2: "planejamento/2024/LOA/lei-orcamentaria-anual-loa-2024.pdf",
    recordId: "dba2e246-1dc8-490c-a208-132d6a638bbf",
  },
  {
    arquivoLocal: "PLANO PLURIANUAL - PPA 2022.pdf",
    caminhoR2: "planejamento/2022/PPA/plano-plurianual-ppa-2022-2025.pdf",
    recordId: "094dc6cd-825b-4208-95d7-59e5e3ca0db0",
  },
  {
    arquivoLocal: "Projeto de Lei 09-24 - LOA 2025.pdf",
    caminhoR2: "planejamento/2025/LOA/lei-orcamentaria-anual-loa-2025.pdf",
    recordId: "b541def1-ee5c-4711-a8a8-ec42d4eb1690",
  },
];

async function uploadArquivo(local: string, r2Path: string): Promise<void> {
  const full = path.join(DIR, local);
  if (!fs.existsSync(full)) {
    console.log(`  ⚠️  ARQUIVO LOCAL NÃO ENCONTRADO: ${local}`);
    return;
  }
  const data = fs.readFileSync(full);
  const size = data.length;
  if (size === 0) {
    console.log(`  ⚠️  ARQUIVO LOCAL VAZIO: ${local}`);
    return;
  }
  await r2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Path,
      Body: data,
      ContentType: "application/pdf",
    })
  );
  console.log(`  ✅ ${local} (${(size / 1024 / 1024).toFixed(1)} MB) → ${r2Path}`);
}

async function main() {
  console.log("=== 1) SUBINDO PDFs REAIS PARA O R2 ===\n");
  for (const up of UPLOADS) {
    await uploadArquivo(up.arquivoLocal, up.caminhoR2);
  }

  // ── Arquivo extra: PPA 2018-2021 (novo registro) ──
  console.log("\n=== 2) PPA 2018-2021 (NOVO REGISTRO) ===\n");
  const novoR2Path = "planejamento/2018/PPA/lei-de-alteracoes-do-plano-plurianual-2018-2021.pdf";
  const arquivoNovo = "LEI ALTERAES DO PLANO PLURIANUAL-PPA 2018-2021 - 2018 .pdf";
  await uploadArquivo(arquivoNovo, novoR2Path);
  const novoUrl = `${PUBLIC_URL}/${novoR2Path}`;

  // Verifica se já existe registro de PPA 2018
  const { data: existente } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("id, titulo")
    .eq("tipo", "PPA")
    .eq("exercicio", 2018);
  if (existente && existente.length > 0) {
    console.log(`  ℹ️  Já existe registro PPA 2018: ${existente.map((e: any) => e.titulo).join(", ")} — não vou duplicar.`);
  } else {
    const { data: inserted, error } = await supabase
      .schema("transparencia")
      .from("planejamento_documentos")
      .insert({
        titulo: "Lei de Alterações do Plano Plurianual 2018–2021",
        descricao: "Alterações do Plano Plurianual do Município de Padre Marcos para o quadriênio 2018–2021.",
        tipo: "PPA",
        categoria: "PLANEJAMENTO_ORCAMENTARIO",
        exercicio: 2018,
        ordem: 1,
        ativo: true,
        data_publicacao: "2018-01-01",
        arquivo_url: novoUrl,
        arquivo_nome: "lei-de-alteracoes-do-plano-plurianual-2018-2021.pdf",
      })
      .select("id, titulo, arquivo_url");
    if (error) {
      console.log(`  ❌ ERRO ao inserir PPA 2018: ${error.message}`);
    } else {
      console.log(`  ✅ Registro criado: ${JSON.stringify(inserted)}`);
    }
  }

  // ── Verificação final: tamanho dos objetos no R2 ──
  console.log("\n=== 3) VERIFICAÇÃO NO R2 (tamanho dos objetos) ===\n");
  for (const up of [...UPLOADS, { arquivoLocal: arquivoNovo, caminhoR2: novoR2Path }]) {
    try {
      const head = await r2.send(
        new HeadObjectCommand({ Bucket: BUCKET, Key: up.caminhoR2 })
      );
      const bytes = head.ContentLength || 0;
      const ok = bytes > 0;
      console.log(`  ${ok ? "✅" : "❌"} ${up.caminhoR2} → ${bytes} bytes`);
    } catch (e: any) {
      console.log(`  ❌ ${up.caminhoR2} → erro: ${e.message}`);
    }
  }
}

main();
