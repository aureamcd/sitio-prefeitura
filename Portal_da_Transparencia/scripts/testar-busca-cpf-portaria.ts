import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import pdfParse from "pdf-parse";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🔍 Buscando portarias no banco para testar detecção de CPF...");
  const { data: portarias } = await supabase
    .from("legislacoes")
    .select("id, titulo, numero, ano, arquivo_url, arquivo_r2_url")
    .ilike("tipo", "%portaria%")
    .limit(20);

  if (!portarias || portarias.length === 0) {
    console.log("Nenhuma portaria encontrada.");
    return;
  }

  for (const p of portarias) {
    const url = p.arquivo_r2_url || p.arquivo_url;
    if (!url || !url.startsWith("http") || url.includes("drive.google")) continue;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      const parsed = await pdfParse(buf);
      const text = parsed.text;

      // Regex para CPF (com ou sem pontuação)
      const matches = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g);
      if (matches && matches.length > 0) {
        console.log(`🚨 CPF(s) detectado(s) na Portaria ID ${p.id} (${p.titulo}):`, matches);
      } else {
        console.log(`✅ Portaria ID ${p.id} (${p.titulo}) - sem CPFs aparentes.`);
      }
    } catch (e) {
      // ignore
    }
  }
}

main();
