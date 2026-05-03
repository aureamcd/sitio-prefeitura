import Parser from "rss-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { extractImageFromContent } from "@/scripts/utils/extractImage";
import { analisarNoticiaIA } from "@/scripts/utils/ai";

dotenv.config();

/* ─── CONFIG ───────────────────────── */

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FEED_URL =
  "https://cidadesnanet.com/portal/category/municipios/padre-marcus/feed/";

const parser = new Parser();

/* ─── UTILS ───────────────────────── */

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function optimizeImage(url: string) {
  // só otimiza se for CDN compatível
  if (url.includes("cloudinary") || url.includes("imgix")) {
    return `${url}?w=1200&h=630&fit=crop`;
  }

  return url;
}

function cleanImage(url: string) {
  return url
    .replace(/\?.*$/, "")
    .replace(/-\d+x\d+(?=\.\w+$)/, "");
}

/* ─── PEGAR IMAGEM ───────────────── */

async function getImageFromPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const html = await res.text();

    let match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/
    );
    if (match) return cleanImage(match[1]);

    match = html.match(
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/
    );
    if (match) return cleanImage(match[1]);

    match = html.match(/<img[^>]+srcset=["']([^"']+)["']/);
    if (match) {
      const srcset = match[1].split(",");

      const largest = srcset
        .map((s) => {
          const [url, size] = s.trim().split(" ");
          return { url, size: parseInt(size) || 0 };
        })
        .sort((a, b) => b.size - a.size)[0];

      if (largest?.url) return cleanImage(largest.url);
    }

    match = html.match(/<img[^>]+src=["']([^"']+)["']/);
    if (match) return cleanImage(match[1]);

    return "";
  } catch (err) {
    console.error("Erro imagem:", err);
    return "";
  }
}

/* ─── SYNC ───────────────────────── */

export async function runSync() {
  console.log("🌐 Buscando RSS...");

  const feed = await parser.parseURL(FEED_URL);

  let inseridos = 0;
  let ignorados = 0;

  for (const item of feed.items) {
    const titulo = item.title?.trim();
    const link = item.link;

    if (!titulo || !link) continue;

    const fullContent =
      (item as any)["content:encoded"] || item.content || "";

    // 🔒 Limite pra IA (MUITO IMPORTANTE)
    const conteudoLimitado = fullContent.slice(0, 2000);

    /* ─── IA ───────────────── */

    const analise = await analisarNoticiaIA(titulo, conteudoLimitado);

    if (!analise.relevante) {
      console.log("⛔ IA ignorou:", titulo);
      ignorados++;
      continue;
    }

    const slug = slugify(titulo);

    /* ─── DUPLICAÇÃO ───────────────── */

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

    /* ─── IMAGEM ───────────────── */
    let imagem = "";

    // 1. RSS (rápido)
    if ((item as any).enclosure?.url) {
      imagem = cleanImage((item as any).enclosure.url);
    } else if ((item as any)["media:content"]?.url) {
      imagem = cleanImage((item as any)["media:content"].url);
    }

    // 2. conteúdo RSS
    if (!imagem && fullContent) {
      const extracted = extractImageFromContent(fullContent);
      if (extracted) imagem = cleanImage(extracted);
    }

    // 3. página (MELHOR QUALIDADE, mas só se precisar)
    if (!imagem) {
      const pageImage = await getImageFromPage(link);
      if (pageImage) imagem = pageImage;
    }

    if (imagem) imagem = optimizeImage(imagem);

    /* ─── POST ───────────────── */

    const post = {
      titulo,
      resumo: analise.resumo,
      conteudo: fullContent,
      imagem,
      imagem_posicao: analise.imagem_posicao,
      slug,
      origem: "rss",
      fonte: "Cidades na Net",
      link_original: link,
      destaque: analise.categorias, // ✅ ARRAY
      status: "pendente",
      data: item.pubDate
        ? new Date(item.pubDate).toISOString()
        : new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("noticias").insert(post);

    if (error) {
      console.error("❌ Erro:", error.message);
    } else {
      console.log("✅", titulo, "|", analise.categorias.join(", "));
      inseridos++;
    }
  }

  console.log("\n📊 RESUMO:");
  console.log("✅ Inseridos:", inseridos);
  console.log("⛔ Ignorados:", ignorados);
}

/* ─── EXECUÇÃO ───────────────── */

runSync().catch(console.error);