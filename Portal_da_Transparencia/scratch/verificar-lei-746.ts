/**
 * Verifica se lei-746-2023.pdf é a LOA 2023.
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

async function getBuffer(key: string): Promise<Buffer> {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await res.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

async function main() {
  for (const key of [
    "leis/2023/lei-746-2023.pdf",
    "legislacoes/2023/1783091540427-LEI_746.pdf",
  ]) {
    try {
      const buf = await getBuffer(key);
      const data = await pdf(buf);
      const txt = (data.text || "").replace(/\s+/g, " ");
      console.log(`\n=== ${key} ===`);
      console.log(`Tamanho: ${(buf.length / 1024 / 1024).toFixed(1)} MB | Páginas: ${data.numpages}`);
      console.log(`Início: ${txt.slice(0, 500)}`);
      const isLOA = /(lei\s+or[çc]ament[aá]ria|estima\s+a\s+receita\s+e\s+fixa\s+a\s+despesa|or[çc]amento\s+anual\s+do\s+munic[ií]pio)/i.test(txt);
      const ano = /(2023)/.test(txt.slice(0, 3000));
      console.log(`É LOA: ${isLOA ? "✅ SIM" : "❌"} | menciona 2023: ${ano ? "sim" : "não"}`);
    } catch (e: any) {
      console.log(`\n=== ${key} === ERRO: ${e.message}`);
    }
  }
}

main();
