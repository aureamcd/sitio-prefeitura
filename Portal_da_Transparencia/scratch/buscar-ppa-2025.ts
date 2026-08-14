/**
 * Busca no R2 objetos relacionados a PPA 2025.
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

  // Filtra por PPA
  const ppa = keys.filter(k => k.key.toLowerCase().includes("ppa"));
  console.log(`=== Objetos com 'ppa' no nome (${ppa.length}) ===`);
  ppa.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${k.size} bytes | ${k.key}`);
  });

  console.log(`\n=== Objetos com '2025' E (ppa|plurianual|plano) ===`);
  const ppa2025 = keys.filter(k => {
    const lk = k.key.toLowerCase();
    return lk.includes("2025") && (lk.includes("ppa") || lk.includes("plurianual") || lk.includes("plano"));
  });
  ppa2025.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${k.size} bytes | ${k.key}`);
  });
}

main();
