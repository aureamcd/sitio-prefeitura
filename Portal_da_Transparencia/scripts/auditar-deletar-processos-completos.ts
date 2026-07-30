import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function varrerEDeletar() {
  console.log("=== BUSCANDO PROCESSOS COMPLETOS / VOLUMES INTEGRAIS NA TABELA licitacoes_documentos ===");

  const { data: todos, error } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("id, nome_arquivo, tipo_documento, caminho_r2, licitacao_id");

  if (error || !todos) {
    console.error("Erro ao buscar documentos:", error);
    return;
  }

  const alvosParaDeletar = todos.filter(d => {
    const nome = (d.nome_arquivo || "").toLowerCase();
    // Identificar volumes integrais ou processos completos
    // Cuidado para não deletar arquivos legíveis que tenham a palavra "completo" em outro contexto, como "Edital Completo"
    if (nome.includes("edital completo") || nome.includes("aviso completo")) return false;

    if (
      nome.includes("volume 0") ||
      nome.includes("volume 1") ||
      nome.includes("volume 2") ||
      nome.includes("volume 3") ||
      nome.includes("volume 4") ||
      nome.includes("volume 5") ||
      nome.includes("volume 6") ||
      nome.includes("volumes 0") ||
      nome.includes("vol 0") ||
      nome.includes("vol. 0") ||
      nome.includes("processo completo") ||
      nome.includes("processo integral") ||
      nome.includes("autos do processo")
    ) {
      return true;
    }
    return false;
  });

  console.log(`\nEncontrados ${alvosParaDeletar.length} documentos classificados como Processo Completo / Volume Integral:`);
  for (const alvo of alvosParaDeletar) {
    console.log(`🗑️ [ID: ${alvo.id}] [${alvo.tipo_documento}] ${alvo.nome_arquivo}`);
  }

  if (alvosParaDeletar.length === 0) {
    console.log("Nenhum processo completo encontrado para deletar.");
    return;
  }

  const ids = alvosParaDeletar.map(a => a.id);
  
  console.log(`\n⏳ Excluindo ${ids.length} documentos do banco de dados (tabela licitacoes_documentos)...`);
  const { error: errDel } = await supabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .delete()
    .in("id", ids);

  if (errDel) {
    console.error("❌ Erro na exclusão:", errDel.message);
  } else {
    console.log(`✅ SUCESSO! ${ids.length} volumes/processos completos foram removidos do Portal da Transparência!`);
  }
}

varrerEDeletar();
