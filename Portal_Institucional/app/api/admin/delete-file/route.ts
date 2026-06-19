import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const { caminho_r2 } = await request.json();

    if (!caminho_r2) {
      return NextResponse.json({ error: "Caminho R2 não fornecido" }, { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET,
      Key: caminho_r2,
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar no R2:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
