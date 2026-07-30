import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarColunasEDocs() {
  const { data, error } = await supabase.schema("transparencia").from("licitacoes_documentos").select("*").limit(5);
  if (error) {
    console.error("Erro:", error);
    return;
  }
  if (data && data.length > 0) {
    console.log("=== COLUNAS DA TABELA licitacoes_documentos ===");
    console.log(Object.keys(data[0]));
  }

  // Buscar documentos que tenham "processo" no nome ou tipo_documento
  const { data: procDocs } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("id, nome_arquivo, tipo_documento")
    .ilike("nome_arquivo", "%processo%");

  console.log(`\n=== DOCUMENTOS COM 'PROCESSO' NO NOME (${procDocs?.length || 0} encontrados) ===`);
  procDocs?.slice(0, 10).forEach(d => console.log(`- [${d.tipo_documento}] ${d.nome_arquivo}`));
}

checarColunasEDocs();
