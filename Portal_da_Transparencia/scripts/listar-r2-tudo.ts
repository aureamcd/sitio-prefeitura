import "dotenv/config";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;

async function listAll() {
  // Listar TODOS os arquivos (sem prefixo)
  let isTruncated = true;
  let continuationToken: string | undefined = undefined;
  let allFiles: { key: string; size: number }[] = [];

  while (isTruncated) {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      ContinuationToken: continuationToken,
    });
    const response = await s3.send(command);
    if (response.Contents) {
      for (const f of response.Contents) {
        if (f.Key && !f.Key.endsWith("/")) {
          allFiles.push({ key: f.Key, size: f.Size || 0 });
        }
      }
    }
    isTruncated = response.IsTruncated ?? false;
    continuationToken = response.NextContinuationToken;
  }

  console.log(`\n📦 Total de arquivos no R2: ${allFiles.length}\n`);

  // Agrupar por pasta
  const grupos: Record<string, typeof allFiles> = {};
  for (const f of allFiles) {
    const pasta = f.key.split("/").slice(0, -1).join("/") || "(raiz)";
    if (!grupos[pasta]) grupos[pasta] = [];
    grupos[pasta].push(f);
  }

  // Mostrar pastas
  for (const [pasta, arquivos] of Object.entries(grupos).sort()) {
    console.log(`📁 ${pasta}/ (${arquivos.length} arquivos)`);
    for (const f of arquivos) {
      const kb = (f.size / 1024).toFixed(0);
      console.log(`   📄 ${f.key.split("/").pop()} (${kb} KB)`);
    }
    console.log();
  }

  // Buscar arquivos de planejamento (PPA, LDO, LOA) — podem conter info sobre renúncias
  const planejamento = allFiles.filter(f =>
    f.key.toLowerCase().includes("planejamento") ||
    f.key.toLowerCase().includes("ppa") ||
    f.key.toLowerCase().includes("ldo") ||
    f.key.toLowerCase().includes("loa")
  );
  if (planejamento.length > 0) {
    console.log("\n🔍 ARQUIVOS DE PLANEJAMENTO (PPA/LDO/LOA):");
    for (const f of planejamento) {
      console.log(`   ${f.key}`);
    }
  }
}

listAll().catch(console.error);
