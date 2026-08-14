/**
 * Baixa as leis de 2022 do R2 e identifica qual delas é a LOA (Lei Orçamentária Anual).
 * A LOA 2023 normalmente é aprovada no final de 2022.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET!;

// Leis de 2022 encontradas no R2
const LEIS = [
  "lei-713_-2022.pdf",
  "lei-714-2022.pdf",
  "lei-715_-2022.pdf",
  "lei-716_-2022.pdf",
  "lei-717_-2022.pdf",
  "lei-718_-2022.pdf",
  "lei-719_-2022.pdf",
  "lei-720_-2022.pdf",
  "lei-721_-2022.pdf",
  "lei-723_-2022.pdf",
  "lei-725_-2022.pdf",
  "lei-726_-2022.pdf",
  "lei-727_-2022.pdf",
  "lei-728_-2022.pdf",
  "lei-729_-2022.pdf",
  "lei-732_-2022.pdf",
  "lei-733_-2022.pdf",
  "lei-734_-2022.pdf",
  "lei-735_-2022.pdf",
  "lei-738_-2022.pdf",
  "lei-739_-2022.pdf",
  "lei-740_-2022.pdf",
];

const OUT = "C:/Users/Áurea Letícia/Documents/sitio-prefeitura/Portal_da_Transparencia/scratch/leis2022";

async function getText(key: string): Promise<string> {
  const res = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await res.Body!.transformToByteArray();
  const buf = Buffer.from(bytes);
  // Tenta extrair texto simples do PDF
  const txt = buf.toString("latin1");
  return txt;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const lei of LEIS) {
    const key = `leis/2022/${lei}`;
    const txt = await getText(key);
    const hasLOA = /lei\s+or[çc]ament[aá]ria|LOA|or[çc]ament[aá]ria\s+anual/i.test(txt);
    const ano2023 = /2023/.test(txt);
    console.log(`${hasLOA ? "🟢" : "  "} ${lei} (${(txt.length / 1024).toFixed(0)} KB texto)${hasLOA ? " → LOA? " + (ano2023 ? "(menciona 2023)" : "") : ""}`);
    if (hasLOA) {
      // salva para inspeção
      fs.writeFileSync(path.join(OUT, lei.replace(".pdf", ".txt")), txt.slice(0, 50000));
    }
  }
}

main();
