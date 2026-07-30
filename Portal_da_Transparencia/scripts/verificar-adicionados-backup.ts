import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const destSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  console.log("🔍 Verificando registros adicionados com origem = MIGRACAO_PROJECT_BACKUP...\n");

  const { data: cont } = await destSupabase
    .schema("transparencia")
    .from("contratos_v2")
    .select("id, numero, ano, objeto, valor, situacao")
    .eq("origem", "MIGRACAO_PROJECT_BACKUP");

  console.log(`📋 CONTRATOS ADICIONADOS (${cont?.length || 0} registros):`);
  (cont || []).forEach(c => {
    console.log(`   - ID: ${c.id} | Contrato nº ${c.numero}/${c.ano} | Objeto: ${(c.objeto || "").substring(0, 80)}...`);
  });

  const { data: cDocs } = await destSupabase
    .schema("transparencia")
    .from("contratos_documentos")
    .select("id, contrato_id, nome_arquivo, url_arquivo, tipo_documento, contratos_v2(numero, ano, objeto)")
    .eq("origem", "MIGRACAO_PROJECT_BACKUP");

  console.log(`\n📑 ANEXOS DE CONTRATOS ADICIONADOS (${cDocs?.length || 0} registros):`);
  (cDocs || []).forEach(d => {
    const pai = (d as any).contratos_v2 || {};
    console.log(`   - Contrato Pai: nº ${pai.numero}/${pai.ano} (${(pai.objeto || "").substring(0, 40)}...) -> Anexo: ${d.nome_arquivo} [Tipo: ${d.tipo_documento}]`);
  });

  const { data: lDocs } = await destSupabase
    .schema("transparencia")
    .from("licitacoes_documentos")
    .select("id, licitacao_id, nome_arquivo, url_arquivo, licitacoes_v2(numero_processo, ano, modalidade, objeto)")
    .eq("origem", "MIGRACAO_PROJECT_BACKUP");

  console.log(`\n📑 ANEXOS DE LICITAÇÕES ADICIONADOS (${lDocs?.length || 0} registros):`);
  (lDocs || []).forEach(d => {
    const pai = (d as any).licitacoes_v2 || {};
    console.log(`   - Licitação Pai: nº ${pai.numero_processo}/${pai.ano} [Modalidade: ${pai.modalidade}] -> Anexo: ${d.nome_arquivo}`);
  });
}

main().catch(console.error);
