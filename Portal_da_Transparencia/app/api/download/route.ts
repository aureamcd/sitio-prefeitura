import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('filename') || 'documento.pdf';

  if (!fileUrl) {
    return new NextResponse('URL não fornecida', { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
    }

    const headers = new Headers(response.headers);
    // Força o download adicionando o Content-Disposition attachment
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    // Altera o Content-Type para octet-stream para evitar que o browser tente renderizar (como ocorre com PDFs)
    headers.set('Content-Type', 'application/octet-stream');

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse('Erro ao processar o download', { status: 500 });
  }
}
