import "dotenv/config";
import fs from "fs";
import path from "path";
import mime from "mime-types";

const {
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");

process.on('uncaughtException', (err) => {
  console.error("⚠️ Uncaught Exception ignorada:", err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error("⚠️ Unhandled Rejection ignorada:", reason);
});

const ROOT_DIR =
  "G:/.shortcut-targets-by-id/0B9YMQ8K2UJUKd28ybG9UOW9WODg/padremarcos.pi.gov.br/Licitações";

const BUCKET = process.env.R2_BUCKET!;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function normalizeFolderName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

// Removido check de duplicação conforme solicitado
async function uploadFile(
  localFile: string,
  r2Key: string
) {
  const contentType =
    mime.lookup(localFile) ||
    "application/octet-stream";

  const stream = fs.createReadStream(localFile);
  stream.on('error', (err) => {
     console.error(`⚠️ Erro de leitura de stream ignorado em ${localFile}:`, err.message);
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: stream,
      ContentType: contentType,
    })
  );
}

async function processDirectory(
  currentDir: string,
  relativePath = ""
) {
  const entries = fs.readdirSync(currentDir, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(
      currentDir,
      entry.name
    );

    if (entry.isDirectory()) {
      const normalizedDir =
        normalizeFolderName(entry.name);

      await processDirectory(
        fullPath,
        path.join(relativePath, normalizedDir)
      );

      continue;
    }

    if (!entry.isFile()) continue;

    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      // O Google Drive as vezes confunde o Dirent, então re-checamos aqui
      const normalizedDir = normalizeFolderName(entry.name);
      await processDirectory(fullPath, path.join(relativePath, normalizedDir));
      continue;
    }

    if (stats.size === 0) {
      console.log(
        `⚠️ Arquivo vazio ignorado: ${fullPath}`
      );
      continue;
    }

    // Filtro de ano (de 2023 pra cá)
    // Tenta encontrar um ano no nome do arquivo ou no caminho
    const yearMatch = fullPath.match(/\b(201\d|202\d|203\d)\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1], 10);
      if (year < 2023) {
        console.log(`⏩ Ignorando arquivo antigo (${year}): ${fullPath}`);
        continue;
      }
    } else {
      // Se não tem ano no nome/pasta, tenta pela data de modificação do arquivo
      const fileYear = stats.mtime.getFullYear();
      if (fileYear < 2023) {
         console.log(`⏩ Ignorando arquivo antigo por data (${fileYear}): ${fullPath}`);
         continue;
      }
    }

    const r2Key = path
      .join(
        "licitacoes",
        relativePath,
        entry.name
      )
      .replace(/\\/g, "/");

    try {
      // Sem verificação de duplicação: pode levar todos direto!
      await uploadFile(fullPath, r2Key);

      console.log(
        `✅ Enviado: ${r2Key}`
      );
    } catch (err) {
      console.error(
        `❌ Erro em ${fullPath}`
      );

      console.error(err);
    }
  }
}

async function main() {
  console.log(
    "🚀 Iniciando upload para o R2..."
  );

  await processDirectory(ROOT_DIR);

  console.log(
    "\n🎉 Upload concluído!"
  );
}

main().catch(console.error);