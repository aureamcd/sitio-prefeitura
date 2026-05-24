// scripts/sync-noticias.ts

import Parser from "rss-parser";
import slugify from "slugify";
import { createClient } from "@supabase/supabase-js";

const parser = new Parser();

// 🔐 pega do .env
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // use service role
);

const RSS_URL = "https://www.gov.br/pt-br/noticias/rss"; // você pode trocar depois

async function syncNoticias() {
  try {
    console.log("🔄 Buscando notícias...");

    const feed = await parser.parseURL(RSS_URL);

    for (const item of feed.items) {
      if (!item.title) continue;

      const slug = slugify(item.title, { lower: true, strict: true });

      const noticia = {
        titulo: item.title,
        resumo: item.contentSnippet || "",
        conteudo: item.content || item.contentSnippet || "",
        imagem: item.enclosure?.url || null,
        data: item.pubDate ? new Date(item.pubDate) : new Date(),
        slug,
        origem: "rss",
      };

      const { error } = await supabase
        .from("noticias")
        .upsert(noticia, { onConflict: "slug" });

      if (error) {
        console.error("❌ Erro ao salvar:", error.message);
      } else {
        console.log("✅ Salvo:", noticia.titulo);
      }
    }

    console.log("🎉 Sincronização finalizada!");
  } catch (err) {
    console.error("💥 Erro geral:", err);
  }
}

syncNoticias();