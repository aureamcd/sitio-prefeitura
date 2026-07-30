import "dotenv/config";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function auditarConformidade() {
  console.log("=== 1. AUDITORIA DOS DOCUMENTOS NO BANCO DE DADOS (2025 e 2026) ===");
  const { data: docs } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("tipo, exercicio, titulo, arquivo_nome")
    .in("exercicio", [2025, 2026]);

  const balancos2025 = docs?.filter(d => d.tipo === "BALANCO_GERAL" && d.exercicio === 2025) || [];
  console.log(`\n📌 Balanços 2025 cadastrados: ${balancos2025.length} arquivos.`);
  const termosBalanço = ["patrimonial", "financeiro", "orçamentário", "orcamentario", "variações", "variacoes", "fluxo"];
  termosBalanço.forEach(t => {
    const achados = balancos2025.filter(b => (b.titulo || "").toLowerCase().includes(t) || (b.arquivo_nome || "").toLowerCase().includes(t));
    console.log(`   - Contém '${t}': ${achados.length} arquivo(s)`);
  });

  const rreo2026 = docs?.filter(d => d.tipo === "RREO" && d.exercicio === 2026) || [];
  console.log(`\n📌 RREO 2026 cadastrados: ${rreo2026.length} arquivos.`);
  rreo2026.slice(0, 5).forEach(r => console.log(`   -> ${r.titulo}`));

  console.log("\n=== 2. AUDITORIA DA PASTA DOWNLOADS/CONTREINA ===");
  const baseDir = "C:\\Users\\Áurea Letícia\\Downloads\\contreina";
  if (fs.existsSync(baseDir)) {
    function checarSub(dir: string, indent = "") {
      const itens = fs.readdirSync(dir);
      itens.forEach(i => {
        const p = path.join(dir, i);
        if (fs.statSync(p).isDirectory()) {
          console.log(`${indent}📂 ${i}/`);
          checarSub(p, indent + "  ");
        } else {
          console.log(`${indent}📄 ${i}`);
        }
      });
    }
    checarSub(baseDir);
  }
}

auditarConformidade();
