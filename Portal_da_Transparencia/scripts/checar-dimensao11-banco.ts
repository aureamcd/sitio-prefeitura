import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarDimensao11() {
  console.log("=== CHECANDO TABELA planejamento_documentos NO SUPABASE ===");
  const { data: docs, error } = await supabase.schema("transparencia").from("planejamento_documentos").select("*");
  if (error) {
    console.error("Erro ao ler planejamento_documentos:", error.message);
  } else {
    console.log(`Total de relatórios cadastrados: ${docs?.length || 0}`);
    
    const porTipoAno: Record<string, number> = {};
    docs?.forEach(d => {
      const k = `${d.tipo || "Outro"} - ${d.ano || "Sem ano"}`;
      porTipoAno[k] = (porTipoAno[k] || 0) + 1;
    });

    console.log("\nResumo por Tipo e Ano no Banco:");
    Object.entries(porTipoAno).sort().forEach(([k, v]) => console.log(`  - ${k}: ${v} arquivo(s)`));
  }

  // Checar o que tem na pasta Downloads/contreina
  const pastaContreina = "C:\\Users\\Áurea Letícia\\Downloads\\contreina";
  console.log(`\n=== VERIFICANDO A PASTA DOWNLOADS/CONTREINA (${pastaContreina}) ===`);
  if (fs.existsSync(pastaContreina)) {
    function listarPasta(dir: string, indent = "") {
      const itens = fs.readdirSync(dir);
      for (const item of itens) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          console.log(`${indent}📂 ${item}/`);
          listarPasta(full, indent + "  ");
        } else {
          console.log(`${indent}📄 ${item} (${(stat.size / 1024).toFixed(0)} KB)`);
        }
      }
    }
    listarPasta(pastaContreina);
  } else {
    console.log("A pasta Downloads/contreina ainda não existe ou não foi encontrada.");
  }
}

checarDimensao11();
