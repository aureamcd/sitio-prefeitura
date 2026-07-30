import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarLeis() {
  console.log("=== VERIFICANDO TABELA legislacoes NO BANCO ===");
  const { data: leis, error } = await supabase.from("legislacoes").select("id, titulo, numero, ano, tipo, arquivo_nome, arquivo_r2_url");
  if (error) {
    console.error("Erro ao consultar legislacoes:", error.message);
  } else {
    console.log(`Encontradas ${leis?.length || 0} leis cadastradas no banco.`);
    leis?.slice(0, 10).forEach(l => console.log(`- [${l.tipo || "Lei"}] ${l.titulo || l.arquivo_nome} (${l.ano || ""})`));
  }

  const downloads = "C:\\Users\\Áurea Letícia\\Downloads";
  console.log("\n=== PROCURANDO PASTAS DE LEIS EM DOWNLOADS ===");
  const itens = fs.readdirSync(downloads);
  for (const item of itens) {
    const low = item.toLowerCase();
    if (low.includes("lei") || low.includes("decreto") || low.includes("portaria") || low.includes("legislacao")) {
      const full = path.join(downloads, item);
      const stat = fs.statSync(full);
      console.log(`[${stat.isDirectory() ? "PASTA" : "ARQUIVO"}] ${item}`);
    }
  }
}

checarLeis();
