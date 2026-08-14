/**
 * Compara contagem de páginas dos candidatos grandes para identificar a LOA 2023.
 * Referência: LOA 2024 (lei-orcamentaria-anual-loa-2024.pdf, 39 MB).
 */
import "dotenv/config";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import pdf from "pdf-parse";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;

const CANDIDATOS = [
  "planejamento/2024/LOA/lei-orcamentaria-anual-loa-2024.pdf", // referência LOA 2024
  "leis/2022/lei-718_-2022.pdf",
  "leis/2022/lei-720_-2022.pdf",
  "leis/2022/lei-726_-2022.pdf",
  "leis/2022/lei-729_-2022.pdf",
  "leis/2022/lei-734_-2022.pdf",
  "leis/2022/lei-738_-2022.pdf",
  "leis/2023/lei-743-2023.pdf",
  "leis/2023/lei-744-2023.pdf",
  "leis/2023/lei-746-2023.pdf",
  "leis/2023/lei-747-2023.pdf",
  "leis/2023/lei-748-2023.pdf",
  "leis/2023/lei-762-2023.pdf",
];

async function getBuffer(key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

async function main() {
  for (const key of CANDIDATOS) {
    try {
      const buf = await getBuffer(key);
      const data = await pdf(buf, { max: 3 }); // só precisa contar páginas
      console.log(`${String(data.numpages).padStart(4)} páginas | ${(buf.length / 1024 / 1024).toFixed(1).padStart(6)} MB | ${key}`);
    } catch (e: any) {
      console.log(`  ERRO | ${key} | ${e.message.slice(0, 60)}`);
    }
  }
}

main();
