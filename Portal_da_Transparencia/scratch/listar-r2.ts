/**
 * Lista todos os objetos do bucket R2 para encontrar correspondências
 * dos documentos que estão vazios: LDO 2024, LOA 2023, Alteração PPA 2022-2025.
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
  let total = 0;
  const keys: { key: string; size: number }[] = [];

  do {
    const cmd = new ListObjectsV2Command({
      Bucket: BUCKET,
      ContinuationToken: continuation,
      MaxKeys: 1000,
    });
    const res = await r2.send(cmd);
    for (const obj of res.Contents || []) {
      keys.push({ key: obj.Key!, size: obj.Size || 0 });
    }
    total += (res.Contents || []).length;
    continuation = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuation);

  console.log(`Total de objetos: ${total}`);
  console.log(`Total de bytes: ${keys.reduce((s, k) => s + k.size, 0)}`);

  // Filtra por palavras-chave relevantes
  const termos = ["ldo", "loa", "ppa", "diretriz", "orcamentaria", "plurianual", "alteracao", "alterao"];
  const relevantes = keys.filter(k =>
    termos.some(t => k.key.toLowerCase().includes(t))
  );

  console.log(`\n=== Objetos relacionados a PPA/LDO/LOA (${relevantes.length}) ===`);
  for (const k of relevantes.sort((a, b) => a.key.localeCompare(b.key))) {
    console.log(`${k.size} bytes | ${k.key}`);
  }
}

main();
