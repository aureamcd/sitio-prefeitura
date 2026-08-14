/**
 * Baixa os PDFs candidatos a LOA 2023 do R2 e extrai o texto real com pdf-parse.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
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
  "leis/2022/lei-714-2022.pdf",
  "leis/2022/lei-718_-2022.pdf",
  "leis/2022/lei-719_-2022.pdf",
  "leis/2022/lei-726_-2022.pdf",
  "leis/2022/lei-728_-2022.pdf",
  "leis/2022/lei-738_-2022.pdf",
  "leis/2022/lei-739_-2022.pdf",
  "leis/2022/lei-740_-2022.pdf",
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
      const data = await pdf(buf);
      const txt = data.text || "";
      // Primeiros 600 caracteres para identificar a lei
      const head = txt.replace(/\s+/g, " ").slice(0, 500);
      const isLOA = /(or[çc]ament[aá]ria\s+anual|estima\s+a\s+receita|fixa\s+a\s+despesa|or[çc]amento\s+do\s+munic[ií]pio)/i.test(txt);
      console.log(`\n=== ${key} | ${(buf.length / 1024 / 1024).toFixed(1)} MB | páginas: ${data.numpages} | LOA: ${isLOA ? "✅" : "❌"} ===`);
      console.log(head.slice(0, 400));
    } catch (e: any) {
      console.log(`\n=== ${key} === ERRO: ${e.message}`);
    }
  }
}

main();
