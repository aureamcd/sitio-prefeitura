import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const { fileName, fileType, tabela, ano } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "Nome do arquivo não fornecido" }, { status: 400 });
    }

    if (!fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos." }, { status: 400 });
    }

    const ext = fileName.split(".").pop() ?? "pdf";
    const base = fileName.replace(`.${ext}`, "").toLowerCase().replace(/[^\w.-]/g, "_").replace(/_{2,}/g, "_");
    const safeFileName = `${Date.now()}_${base}.${ext}`;

    // Determinar pasta com base na tabela
    let folder = "documentos";
    if (tabela) {
      const t = tabela.toLowerCase();
      if (t.includes("contratos")) folder = "contratos";
      else if (t.includes("licitacoes")) folder = "licitacoes";
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
    const filePath = `${folder}/${yearFolder}/${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET,
      Key: filePath,
      ContentType: fileType || "application/pdf",
    });

    // Gera a URL pré-assinada válida por 1 hora (3600 segundos)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!publicUrlBase) {
      throw new Error("R2_PUBLIC_URL não está definida no .env");
    }
    const publicUrl = `${publicUrlBase}/${filePath}`;

    return NextResponse.json({ 
        uploadUrl, 
        publicUrl, 
        fileName: safeFileName,
        caminho_r2: filePath
    });
  } catch (error: any) {
    console.error("Erro ao gerar Presigned URL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
