/**
 * Lista todos os objetos das pastas leis/ e legislacoes/ no R2.
 */
import "dotenv/config";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;

async function main() {
  let continuation: string | undefined;
  const keys: { key: string; size: number }[] = [];

  do {
    const res = await r2.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: continuation, MaxKeys: 1000 })
    );
    for (const obj of res.Contents || []) {
      keys.push({ key: obj.Key!, size: obj.Size || 0 });
    }
    continuation = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuation);

  const leis = keys.filter(k => k.key.toLowerCase().startsWith("leis/") || k.key.toLowerCase().startsWith("legislacoes/"));
  console.log(`=== Pastas leis/ e legislacoes/ (${leis.length}) ===`);
  leis.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    const mb = (k.size / 1024 / 1024).toFixed(1);
    console.log(`${mb} MB | ${k.key}`);
  });
}

main();
