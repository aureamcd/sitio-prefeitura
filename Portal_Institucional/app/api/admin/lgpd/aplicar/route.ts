import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { PDFDocument, rgb } from "pdf-lib";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

type TarjaItem = {
  pageIndex: number; // 0-indexed
  x: number;
  y: number;
  width: number;
  height: number;
};

export async function POST(request: Request) {
  try {
    const { pdfUrl, tarjas } = (await request.json()) as {
      pdfUrl: string;
      tarjas: TarjaItem[];
    };

    if (!pdfUrl) {
      return NextResponse.json({ error: "URL do PDF não informada." }, { status: 400 });
    }

    if (!Array.isArray(tarjas) || tarjas.length === 0) {
      return NextResponse.json({ error: "Nenhuma tarja para aplicar." }, { status: 400 });
    }

    // 1. Baixar o PDF original
    const resPdf = await fetch(pdfUrl);
    if (!resPdf.ok) {
      throw new Error(`Falha ao baixar PDF original: status ${resPdf.status}`);
    }
    const pdfBuffer = Buffer.from(await resPdf.arrayBuffer());

    // 2. Carregar no pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // 3. Desenhar retângulos pretos permanentes
    for (const t of tarjas) {
      if (t.pageIndex >= 0 && t.pageIndex < pages.length) {
        const page = pages[t.pageIndex];
        page.drawRectangle({
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          color: rgb(0, 0, 0),
        });
      }
    }

    const modifiedPdfBytes = await pdfDoc.save();
    const modifiedBuffer = Buffer.from(modifiedPdfBytes);

    // 4. Determinar chave no R2 para substituição ou novo arquivo
    const publicUrlBase = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
    let filePath = "";

    if (publicUrlBase && pdfUrl.startsWith(publicUrlBase)) {
      // Remover a base da url pública e query params caso existam
      filePath = pdfUrl.substring(publicUrlBase.length + 1).split("?")[0];
    } else {
      const fileName = `tarjado_${Date.now()}.pdf`;
      filePath = `lgpd/${new Date().getFullYear()}/${fileName}`;
    }

    // 5. Enviar para Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || process.env.R2_BUCKET,
      Key: filePath,
      Body: modifiedBuffer,
      ContentType: "application/pdf",
    });

    await s3Client.send(command);

    const finalUrl = publicUrlBase ? `${publicUrlBase}/${filePath}?v=${Date.now()}` : pdfUrl;

    return NextResponse.json({
      success: true,
      url: finalUrl,
      fileSize: modifiedBuffer.length,
      tarjasAplicadas: tarjas.length,
    });
  } catch (error: any) {
    console.error("Erro na rota /api/admin/lgpd/aplicar:", error);
    return NextResponse.json({ error: error.message || "Erro interno ao processar PDF." }, { status: 500 });
  }
}
