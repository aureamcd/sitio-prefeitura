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
    const tipo = formData.get("tipo") as string | null;
    const ano = formData.get("ano") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() ?? "pdf";
    const base = file.name.replace(`.${ext}`, "").toLowerCase().replace(/[^\w.-]/g, "_").replace(/_{2,}/g, "_");
    const fileName = `${Date.now()}_${base}.${ext}`;
    
    // Mapeamento de tipo para a pasta do R2
    let folder = "leis_normas";
    if (tipo) {
      const tipoLower = tipo.toLowerCase();
      if (tipoLower === "lei" || tipoLower === "lei complementar") folder = "leis";
      else if (tipoLower === "decreto") folder = "decretos";
      else if (tipoLower === "portaria") folder = "portarias";
      else if (tipoLower === "resoluÃ§Ã£o") folder = "resolucoes";
      else if (tipoLower === "contrato") folder = "contratos";
      else if (tipoLower === "licitaÃ§Ã£o") folder = "licitacoes";
      else if (tipoLower === "diÃ¡rio") folder = "diarios";
      else if (tipoLower === "publicaÃ§Ã£o") folder = "publicacoes";
      else folder = "documentos-setoriais";
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

    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, ""); // remove barra final se existir
    if (!publicUrlBase) {
      throw new Error("R2_PUBLIC_URL nÃ£o estÃ¡ definida no .env");
    }
    const fileUrl = `${publicUrlBase}/${filePath}`;

    return NextResponse.json({ url: fileUrl, fileName, fileSize: buffer.length, fileExtension: ext });
  } catch (error: any) {
    console.error("Erro no upload R2:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("fileUrl");
    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl não fornecido" }, { status: 400 });
    }

    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || "";
    if (!publicUrlBase || !fileUrl.startsWith(publicUrlBase)) {
      return NextResponse.json({ success: false, message: "URL não pertence ao R2" });
    }

    // Extrair o Key (caminho) removendo o prefixo da URL base
    let key = fileUrl.substring(publicUrlBase.length);
    if (key.startsWith("/")) key = key.substring(1);

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erro ao deletar no R2:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

