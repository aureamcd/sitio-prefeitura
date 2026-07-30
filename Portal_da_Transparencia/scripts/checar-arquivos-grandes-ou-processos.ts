import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checar() {
  const { data: todos } = await supabase.schema("transparencia").from("licitacoes_documentos").select("id, nome_arquivo, tipo_documento, caminho_r2");
  if (!todos) return;

  console.log(`=== ANALISANDO ${todos.length} DOCUMENTOS NO BANCO ===`);
  const suspeitos = todos.filter(d => {
    const low = (d.nome_arquivo || "").toLowerCase();
    return low.includes("processo") || low.includes("completo") || low.includes("volume") || low.includes("integral") || low.includes("autos");
  });

  console.log(`Encontrados ${suspeitos.length} documentos com termos de processo completo/integral/volume:`);
  suspeitos.slice(0, 30).forEach(d => console.log(`- [${d.tipo_documento}] ${d.nome_arquivo} (${d.caminho_r2})`));
}

checar();
