import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
// Funcao para extrair URLs de arquivo_url em varias tabelas
async function checarTabela(tabela: string, colunas: string[], extra?: string) {
  const { data, error } = await supabase.schema("transparencia").from(tabela).select(colunas.join(",") + (extra ? "," + extra : "")).limit(50);
  if (error) { console.log(`[${tabela}] ERRO: ${error.message}`); return 0; }
  if (!data || data.length === 0) { console.log(`[${tabela}] vazia`); return 0; }
  console.log(`[${tabela}] ${data.length} registros (amostra). Colunas: ${colunas.join(",")}`);
  return data.length;
}
async function main() {
  await checarTabela("licitacoes_v2", ["id","numero","objeto","modalidade","situacao","arquivo_url","arquivos"], "ano");
  await checarTabela("contratos_v2", ["id","numero","contratado","objeto","valor","arquivo_url","arquivos"], "ano");
  await checarTabela("obras", ["id","nome","empresa","situacao","arquivo_url","arquivos","percentual_concluido","data_inicio","data_fim","valor"]);
  await checarTabela("planejamento_documentos", ["id","titulo","tipo","exercicio","arquivo_url","categoria","ativo"], "ordem");
  await checarTabela("diarias", ["id","servidor","destino","valor","periodo_inicio","periodo_fim","objetivo"]);
  await checarTabela("servidores", ["id","nome","cargo","lotacao","data_admissao","remuneracao"], "cpf");
  await checarTabela("receitas", ["id","codigo","descricao","ano","previsao_inicial","previsao_atualizada","arrecadado_periodo","arrecadado_total"], "mes");
  await checarTabela("despesas", ["id","credor","objeto","empenho","valor","ano","fase"]);
}
main();
