/**
 * Busca no R2 objetos relacionados a LOA 2023.
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

  // Filtra por LOA
  const loa = keys.filter(k => k.key.toLowerCase().includes("loa"));
  console.log(`=== Objetos com 'loa' no nome (${loa.length}) ===`);
  loa.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${k.size} bytes | ${k.key}`);
  });

  console.log(`\n=== Objetos com '2023' E (loa|orcamentaria|orçamentaria) ===`);
  const loa2023 = keys.filter(k => {
    const lk = k.key.toLowerCase();
    return lk.includes("2023") && (lk.includes("loa") || lk.includes("orcamentaria") || lk.includes("orçamentaria"));
  });
  loa2023.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${k.size} bytes | ${k.key}`);
  });

  // Também busca por leis numeradas de 2022 (LOA 2023 costuma ser Lei de 2022)
  console.log(`\n=== Objetos com 'lei' e '2022' (possível LOA 2023) ===`);
  const lei2022 = keys.filter(k => {
    const lk = k.key.toLowerCase();
    return lk.includes("lei") && lk.includes("2022");
  });
  lei2022.sort((a, b) => a.key.localeCompare(b.key)).forEach(k => {
    console.log(`${k.size} bytes | ${k.key}`);
  });
}

main();
