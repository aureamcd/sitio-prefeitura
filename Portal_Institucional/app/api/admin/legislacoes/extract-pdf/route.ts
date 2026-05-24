import { NextRequest, NextResponse } from "next/server";
const pdfParse = require("pdf-parse");

type ExtractedFields = {
  tipo: string | null;
  numero: string | null;
  ano: number | null;
  ementa: string | null;
  orgao: string | null;
  data_publicacao: string | null;
  data_vigencia: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    // Download PDF com timeout de 25s
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) {
      return NextResponse.json({ error: `Erro ao baixar PDF (HTTP ${res.status})` }, { status: 400 });
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > 25_000_000) {
      return NextResponse.json({ error: "PDF muito grande (máx 25 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const pdf = await pdfParse(buffer);
    const texto = ((pdf.text as string) || "").slice(0, 7000).trim();

    if (!texto) {
      return NextResponse.json({ error: "PDF sem texto extraível (pode ser imagem)" }, { status: 400 });
    }

    // Sem chave de IA — retorna só o texto bruto
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterKey) {
      return NextResponse.json({ texto, campos: null });
    }

    // Análise com IA
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pmpadremarcos.pi.gov.br",
        "X-Title": "Admin Legislações",
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5",
        response_format: { type: "json_object" },
        max_tokens: 700,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: `Analise o texto de legislação municipal brasileira abaixo e extraia os campos no JSON solicitado.

TEXTO DO PDF:
${texto}

Retorne SOMENTE JSON válido:
{
  "tipo": "Lei" | "Decreto" | "Portaria" | "Resolução" | "Instrução Normativa" | "Lei Complementar" | "Errata" | null,
  "numero": "número apenas (ex: '831', '017')" | null,
  "ano": 2024 (número inteiro do ano) | null,
  "ementa": "texto da ementa após EMENTA: ou resumo do que a lei trata" | null,
  "orgao": "órgão emissor padronizado (ex: 'Câmara Municipal de Padre Marcos', 'Prefeitura Municipal de Padre Marcos')" | null,
  "data_publicacao": "YYYY-MM-DD" | null,
  "data_vigencia": "YYYY-MM-DD ou null se não explícito. Se disser 'entra em vigor na data de publicação', use a data_publicacao" | null
}

Regras: extraia apenas o que está claramente no texto. Use null se não tiver certeza.`,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      return NextResponse.json({ texto, campos: null });
    }

    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ texto, campos: null });

    try {
      const campos = JSON.parse(content) as ExtractedFields;
      return NextResponse.json({ texto, campos });
    } catch {
      return NextResponse.json({ texto, campos: null });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
