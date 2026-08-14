/**
 * Busca no R2 objetos relacionados a LDO 2024.
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

  console.log(`Total: ${keys.length} objetos\n`);

  // LDO em qualquer pasta
  const ldo = keys.filter(k => k.key.toLowerCase().includes("ldo"));
  console.log(`=== Objetos com 'ldo' no nome (${ldo.length}) ===`);
  ldo.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${(k.size / 1024 / 1024).toFixed(1).padStart(7)} MB | ${k.key}`);
  });

  // Leis de 2023 (LDO 2024 seria aprovada em 2023, numerada ~740-770)
  console.log(`\n=== Leis de 2023 em leis/ e legislacoes/ ===`);
  const leis2023 = keys.filter(k => {
    const lk = k.key.toLowerCase();
    return (lk.startsWith("leis/2023/") || lk.startsWith("legislacoes/2023/")) && !lk.includes("decreto");
  });
  leis2023.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${(k.size / 1024 / 1024).toFixed(1).padStart(7)} MB | ${k.key}`);
  });
}

main();
