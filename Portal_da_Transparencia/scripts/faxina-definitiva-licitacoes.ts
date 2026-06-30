import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🧹 Iniciando faxina definitiva de arquivos do sistema (desktop.ini) e licitações placeholders...");

  // 1. Excluir arquivos de sistema (desktop.ini, .DS_Store, etc) da tabela licitacoes_documentos
  const { data: todosDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("id, nome_arquivo");
  const lixoIds = (todosDocs || [])
    .filter(d => {
      const n = (d.nome_arquivo || "").toLowerCase();
      return n === "desktop.ini" || n === ".ds_store" || n.endsWith(".tmp");
    })
    .map(d => d.id);

  if (lixoIds.length > 0) {
    await supabase.schema("transparencia").from("licitacoes_documentos").delete().in("id", lixoIds);
    console.log(`🗑️ Arquivos de sistema (desktop.ini) excluídos: ${lixoIds.length}`);
  }

  // 2. Carregar todas as licitações e ver quais agora não têm documentos e não são oficiais do TCE
  const { data: docsRestantes } = await supabase.schema("transparencia").from("licitacoes_documentos").select("licitacao_id");
  const licsComDoc = new Set((docsRestantes || []).map(d => d.licitacao_id));

  const { data: todasLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("*");
  if (!todasLics) return;

  const placeholdersExcluir = todasLics.filter(l => {
    if (l.origem === "TCE-PI") return false; // Nunca exclui linha oficial do TCE
    const semDoc = !licsComDoc.has(l.id);
    const generica = (l.objeto || "").includes("Processo Licitatório do Município de Padre Marcos - PI.");
    return semDoc || generica;
  });

  if (placeholdersExcluir.length > 0) {
    const ids = placeholdersExcluir.map(l => l.id);
    // Para evitar erro de FK em linhas que ainda tenham algum doc genérico, removemos primeiro os docs genéricos apontando pra placeholders sem número real
    await supabase.schema("transparencia").from("licitacoes_documentos").delete().in("licitacao_id", ids);
    await supabase.schema("transparencia").from("licitacoes_v2").delete().in("id", ids);
    console.log(`🗑️ Licitações genéricas/placeholders eliminadas: ${ids.length}`);
  }

  // 3. Verificação final
  const { count: countLics } = await supabase.schema("transparencia").from("licitacoes_v2").select("*", { count: "exact", head: true });
  const { count: countDocs } = await supabase.schema("transparencia").from("licitacoes_documentos").select("*", { count: "exact", head: true });
  console.log(`🏆 Resultado Final -> Licitações únicas no portal: ${countLics} | Documentos PDF válidos: ${countDocs}`);
}

main().catch(console.error);
