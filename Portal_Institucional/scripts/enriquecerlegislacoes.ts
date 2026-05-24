// scripts/enriquecer-legislacoes-ia.ts
//
// Objetivo:
// - Corrigir encoding quebrado
// - Extrair tipo, número, ano e data
// - Padronizar títulos jurídicos
// - Usar IA SOMENTE quando regex falhar
// - Ler PDF apenas quando necessário
// - Gastar poucos tokens
//
// Uso:
// npx tsx scripts/enriquecer-legislacoes-ia.ts
// npx tsx scripts/enriquecer-legislacoes-ia.ts --dry-run
// npx tsx scripts/enriquecer-legislacoes-ia.ts --limit=20
// npx tsx scripts/enriquecer-legislacoes-ia.ts --from-id=200
// npx tsx scripts/enriquecer-legislacoes-ia.ts --only-empty
//
// ENV:
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// OPENROUTER_API_KEY

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODEL = "google/gemini-2.0-flash-001";
// alternativa ainda mais barata:
// const MODEL = "deepseek/deepseek-chat-v3-0324:free"

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const REQUEST_DELAY = 700;

const TIPOS = [
  "Lei",
  "Lei Complementar",
  "Decreto",
  "Portaria",
  "Resolução",
  "Resolução Administrativa",
  "Resolução Normativa",
  "Instrução Normativa",
  "Projeto de Lei",
  "Projeto de Lei Complementar",
  "Regimento",
  "Emenda",
  "Parecer",
  "Decisão",
  "Ato",
];

interface Legislacao {
  id: number;
  titulo: string | null;
  descricao: string | null;
  numero: string | null;
  ano: number | null;
  tipo: string | null;
  data_publicacao: string | null;
  arquivo_r2_url: string | null;
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ═══════════════════════════════
   ENCODING
═══════════════════════════════ */

function fixEncoding(text: string): string {
  return text
    .replace(/Ã¡/g, "á")
    .replace(/Ã¢/g, "â")
    .replace(/Ã£/g, "ã")
    .replace(/Ã§/g, "ç")
    .replace(/Ã©/g, "é")
    .replace(/Ãª/g, "ê")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãµ/g, "õ")
    .replace(/Ãº/g, "ú")
    .replace(/Ã/g, "à")
    .replace(/Â/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ═══════════════════════════════
   REGEX
═══════════════════════════════ */

function detectarTipo(texto: string): string | null {
  const lower = texto.toLowerCase();

  for (const tipo of TIPOS.sort((a, b) => b.length - a.length)) {
    if (lower.includes(tipo.toLowerCase())) {
      return tipo;
    }
  }

  return null;
}

function extrairNumero(texto: string): string | null {
  const patterns = [
    /n[º°]?\s*(\d{1,6})/i,
    /(\d{1,6})\/\d{4}/,
  ];

  for (const p of patterns) {
    const m = texto.match(p);
    if (m) return m[1];
  }

  return null;
}

function extrairAno(texto: string): number | null {
  const match = texto.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : null;
}

function extrairData(texto: string): string | null {
  const br = texto.match(/\b\d{2}\/\d{2}\/\d{4}\b/);

  if (br) return br[0];

  const iso = texto.match(/\b\d{4}-\d{2}-\d{2}\b/);

  if (iso) return iso[0];

  return null;
}

/* ═══════════════════════════════
   TITULO PADRÃO
═══════════════════════════════ */

function montarTitulo(
  tipo: string | null,
  numero: string | null,
  ano: number | null,
  original: string
) {
  if (!tipo) return original;

  let titulo = tipo;

  if (numero) {
    titulo += ` Nº ${numero}`;
  }

  if (ano) {
    titulo += `/${ano}`;
  }

  return titulo;
}

/* ═══════════════════════════════
   PDF
═══════════════════════════════ */

async function extrairTextoPdf(
  url: string
): Promise<string | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());

    const pdfParse = require("pdf-parse");

    const pdf = await pdfParse(buffer);

    const text = pdf.text?.trim();

    if (!text || text.length < 20) {
      return null;
    }

    return text.slice(0, 2500);
  } catch {
    return null;
  }
}

/* ═══════════════════════════════
   IA
═══════════════════════════════ */

async function chamarIA(
  legislacao: Legislacao,
  pdfText?: string | null
) {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY ausente");
  }

  const prompt = `
Corrija e complete os dados jurídicos abaixo.

REGRAS:
- NÃO invente
- Responda SOMENTE JSON
- Corrija encoding
- Padronize título
- Extraia tipo, numero, ano e data

TIPOS VÁLIDOS:
${TIPOS.join(", ")}

DADOS:

titulo: ${legislacao.titulo}
descricao: ${legislacao.descricao}
tipo: ${legislacao.tipo}
numero: ${legislacao.numero}
ano: ${legislacao.ano}
data_publicacao: ${legislacao.data_publicacao}

PDF:
${pdfText || "(sem pdf)"}

JSON:
{
  "titulo":"",
  "tipo":"",
  "numero":"",
  "ano":null,
  "data_publicacao":""
}
`;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      max_tokens: 250,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  const text =
    data?.choices?.[0]?.message?.content;

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* ═══════════════════════════════
   MAIN
═══════════════════════════════ */

async function run() {
  const args = process.argv.slice(2);

  const DRY_RUN = args.includes("--dry-run");
  const ONLY_EMPTY = args.includes("--only-empty");

  const LIMIT_ARG = args.find((a) =>
    a.startsWith("--limit=")
  );

  const FROM_ID_ARG = args.find((a) =>
    a.startsWith("--from-id=")
  );

  const limit = LIMIT_ARG
    ? Number(LIMIT_ARG.split("=")[1])
    : null;

  const fromId = FROM_ID_ARG
    ? Number(FROM_ID_ARG.split("=")[1])
    : null;

  console.log("\n📚 ENRIQUECENDO LEGISLAÇÕES\n");

  let query = supabase
    .from("legislacoes")
    .select("*")
    .order("id", { ascending: true });

  if (fromId) {
    query = query.gte("id", fromId);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  if (!data?.length) {
    console.log("Nenhum registro");
    return;
  }

  const registros = data as Legislacao[];

  for (const item of registros) {
    console.log(`\n#${item.id}`);

    let titulo = fixEncoding(item.titulo || "");
    let descricao = fixEncoding(item.descricao || "");

    let tipo =
      item.tipo ||
      detectarTipo(
        `${titulo} ${descricao}`
      );

    let numero =
      item.numero ||
      extrairNumero(
        `${titulo} ${descricao}`
      );

    let ano =
      item.ano ||
      extrairAno(
        `${titulo} ${descricao}`
      );

    let data_publicacao =
      item.data_publicacao ||
      extrairData(
        `${titulo} ${descricao}`
      );

    let tituloPadrao = montarTitulo(
      tipo,
      numero,
      ano,
      titulo
    );

    const precisaIA =
      !tipo ||
      !numero ||
      !ano ||
      !data_publicacao;

    if (precisaIA) {
      console.log("🤖 IA...");

      let pdfText: string | null = null;

      if (item.arquivo_r2_url) {
        pdfText = await extrairTextoPdf(
          item.arquivo_r2_url
        );
      }

      const ia = await chamarIA(
        item,
        pdfText
      );

      if (ia) {
        tipo = tipo || ia.tipo;
        numero = numero || ia.numero;
        ano = ano || ia.ano;
        data_publicacao =
          data_publicacao ||
          ia.data_publicacao;

        tituloPadrao = montarTitulo(
          tipo,
          numero,
          ano,
          ia.titulo || titulo
        );
      }

      await delay(REQUEST_DELAY);
    }

    const updateData = {
      titulo: tituloPadrao,
      descricao,
      tipo,
      numero,
      ano,
      data_publicacao,
    };

    console.log(updateData);

    if (!DRY_RUN) {
      const { error: updateError } =
        await supabase
          .from("legislacoes")
          .update(updateData)
          .eq("id", item.id);

      if (updateError) {
        console.log(
          "❌ erro",
          updateError.message
        );
      } else {
        console.log("✅ atualizado");
      }
    }
  }

  console.log("\n🏁 FINALIZADO\n");
}

run();