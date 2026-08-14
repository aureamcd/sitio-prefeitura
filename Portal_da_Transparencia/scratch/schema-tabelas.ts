import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
async function schemaTabela(t: string) {
  const { data, error } = await supabase.schema("transparencia").from(t).select("*").limit(1);
  if (error) { console.log(`[${t}] ERRO: ${error.message}`); return; }
  const cols = data && data[0] ? Object.keys(data[0]).join(", ") : "(sem registros)";
  console.log(`[${t}] colunas: ${cols}`);
}
async function main() {
  const tabelas = ["licitacoes_v2","licitacoes_documentos","contratos_v2","contratos_documentos","obras","diarias","servidores","receitas","despesas","emendas","cadastro_emendas","emendas_impositivas","conselhos","saude_lista_espera","atos_normativos","renuncia_receita","remuneracoes","estagiarios","terceirizados","receitas_extra_orcamentarias","receitas_transferencias","transferencias_entre_entidades","despesas_extra_orcamentarias","restos_pagar","licitacoes","contratos"];
  for (const t of tabelas) await schemaTabela(t);
}
main();
