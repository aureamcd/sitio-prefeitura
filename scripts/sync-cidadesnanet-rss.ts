import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { extractImageFromContent } from "@/scripts/utils/extractImage";

dotenv.config();

// 🔗 Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🔗 RSS Padre Marcos
const FEED_URL =
  "https://cidadesnanet.com/portal/category/municipios/padre-marcus/feed/";

const parser = new Parser();

// 🔤 slug
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// 🔎 Palavras relevantes
const KEYWORDS = [
  "prefeitura",
  "prefeito",
  "prefeita",
  "secretaria",
  "educação",
  "escola",
  "saúde",
  "hospital",
  "vacina",
  "obras",
  "licitação",
  "assistência",
  "programa",
  "município",
];

// 🚫 Palavras bloqueadas
const BLOCKED = [
  "polícia",
  "homicídio",
  "acidente",
  "prisão",
  "roubo",
  "assalto",
];

// 🎯 Filtro inteligente
function isRelevant(text: string) {
  const lower = text.toLowerCase();

  const hasRelevant = KEYWORDS.some((k) => lower.includes(k));
  const hasBlocked = BLOCKED.some((k) => lower.includes(k));

  return hasRelevant && !hasBlocked;
}

// 🖼️ pegar imagem da página (OG:image)
async function getImageFromPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await res.text();

    // og:image (aspas simples ou dupla)
    let match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/
    );
    if (match) return match[1];

    // twitter:image
    match = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/
    );
    if (match) return match[1];

    // img src
    match = html.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) return match[1];

    // lazy loading (extra)
    match = html.match(/<img[^>]+data-src=["']([^"']+)["']/);
    if (match) return match[1];

    return "";
  } catch (error) {
    console.error("Erro ao buscar imagem:", error);
    return "";
  }
}

// 🧠 destaque inteligente
function getDestaque(text: string) {
  const t = text.toLowerCase();

  if (t.includes("saúde") || t.includes("hospital") || t.includes("vacina"))
    return "saude";

  if (t.includes("educação") || t.includes("escola"))
    return "educacao";

  if (t.includes("obra") || t.includes("infraestrutura"))
    return "obras";

  if (t.includes("assistência") || t.includes("social"))
    return "assistencia";

  if (t.includes("licitação") || t.includes("contrato"))
    return "licitacao";

  return "geral";
}

export async function runSync() {
  console.log("🌐 Buscando RSS...");

  const feed = await parser.parseURL(FEED_URL);

  console.log(`📰 Total no feed: ${feed.items.length}`);

  let inseridos = 0;
  let ignorados = 0;

  for (const item of feed.items) {
    const titulo = item.title?.trim();
    const link = item.link;

    if (!titulo || !link) continue;

    const texto = `${titulo} ${item.contentSnippet || ""}`;

    // 🔎 filtro
    if (!isRelevant(texto)) {
      console.log("⛔ Ignorado:", titulo);
      ignorados++;
      continue;
    }

    const slug = slugify(titulo);

    // 🔁 deduplicação (slug OU link)
    const { data: exists } = await supabase
      .from("noticias")
      .select("id")
      .or(`slug.eq.${slug},link_original.eq.${link}`)
      .maybeSingle();

    if (exists) {
      console.log("⏩ Já existe:", titulo);
      ignorados++;
      continue;
    }

    // 🖼️ IMAGEM (estratégia completa)
    let imagem = "";

    // 1. RSS
    if ((item as any).enclosure?.url) {
      imagem = (item as any).enclosure.url;
    } else if ((item as any)["media:content"]?.url) {
      imagem = (item as any)["media:content"].url;
    }

    // 2. conteúdo RSS
    const fullContent =
      (item as any)["content:encoded"] || item.content || "";

    if (!imagem && fullContent) {
      const extracted = extractImageFromContent(fullContent);
      if (extracted) imagem = extracted;
    }

    // 3. página real (melhor qualidade)
    if (!imagem) {
      imagem = await getImageFromPage(link);
    }

    const destaque = getDestaque(texto);

    const post = {
      titulo,
      resumo: item.contentSnippet || "",
      conteudo: item.content || "",
      imagem,
      slug,
      origem: "rss",
      fonte: "Cidades na Net",
      link_original: link,
      destaque,
      status: "pendente",

      // ✅ CORRETO
      data: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),

      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("noticias").insert(post);

    if (error) {
      console.error("❌ Erro:", error.message);
    } else {
      console.log("✅ Inserido:", titulo);
      inseridos++;
    }
  }

  console.log("\n📊 RESUMO:");
  console.log("✅ Inseridos:", inseridos);
  console.log("⛔ Ignorados:", ignorados);
}
