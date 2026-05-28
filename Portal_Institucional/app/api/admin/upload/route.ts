import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

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
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tabela = formData.get("tabela") as string | null;
    const ano = formData.get("ano") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() ?? "pdf";
    const base = file.name.replace(`.${ext}`, "").toLowerCase().replace(/[^\w.-]/g, "_").replace(/_{2,}/g, "_");
    const fileName = `${Date.now()}_${base}.${ext}`;

    // Determinar pasta com base na tabela
    let folder = "documentos";
    if (tabela) {
      const t = tabela.toLowerCase();
      if (t === "contratos") folder = "contratos";
      else if (t === "licitacoes") folder = "licitacoes";
      else if (t === "diarias") folder = "diarias";
      else if (t === "obras") folder = "obras";
      else if (t === "servidores") folder = "servidores";
      else if (t === "emendas") folder = "emendas";
      else if (t === "transferencias") folder = "transferencias";
      else if (t === "receitas") folder = "receitas";
      else if (t === "despesas") folder = "despesas";
      else folder = "documentos";
    }

    const yearFolder = ano || new Date().getFullYear().toString();
    const filePath = `${folder}/${yearFolder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET,
      Key: filePath,
      Body: buffer,
      ContentType: file.type || "application/pdf",
    });

    await s3Client.send(command);

    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!publicUrlBase) {
      throw new Error("R2_PUBLIC_URL não está definida no .env");
    }
    const fileUrl = `${publicUrlBase}/${filePath}`;

    return NextResponse.json({ url: fileUrl, fileName, fileSize: buffer.length });
  } catch (error: any) {
    console.error("Erro no upload R2:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
