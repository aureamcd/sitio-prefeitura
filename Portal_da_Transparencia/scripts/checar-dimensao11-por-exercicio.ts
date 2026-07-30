import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checar() {
  const { data: docs } = await supabase.schema("transparencia").from("planejamento_documentos").select("categoria, subcategoria, tipo, exercicio, titulo");
  if (!docs) return;

  const contagem: Record<string, number> = {};
  docs.forEach(d => {
    const chave = `[${d.categoria || "Geral"}] ${d.tipo} (${d.exercicio || "Sem ano"})`;
    contagem[chave] = (contagem[chave] || 0) + 1;
  });

  console.log("=== RESUMO EXATO DE PRESTAÇÃO DE CONTAS NO BANCO ===");
  Object.entries(contagem).sort().forEach(([k, v]) => console.log(`${k}: ${v} documento(s)`));
}
checar();
