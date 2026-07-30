import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checarLacunas() {
  const tabelas = [
    { nome: "despesas", count: (await supabase.schema("transparencia").from("despesas").select("*", { count: "exact", head: true })).count },
    { nome: "receitas", count: (await supabase.schema("transparencia").from("receitas").select("*", { count: "exact", head: true })).count },
    { nome: "licitacoes_v2", count: (await supabase.schema("transparencia").from("licitacoes_v2").select("*", { count: "exact", head: true })).count },
    { nome: "contratos_v2", count: (await supabase.schema("transparencia").from("contratos_v2").select("*", { count: "exact", head: true })).count },
    { nome: "servidores", count: (await supabase.schema("transparencia").from("servidores").select("*", { count: "exact", head: true })).count },
    { nome: "diarias", count: (await supabase.schema("transparencia").from("diarias").select("*", { count: "exact", head: true })).count },
    { nome: "obras", count: (await supabase.schema("transparencia").from("obras").select("*", { count: "exact", head: true })).count },
    { nome: "planejamento_documentos", count: (await supabase.schema("transparencia").from("planejamento_documentos").select("*", { count: "exact", head: true })).count },
    { nome: "conselhos", count: (await supabase.schema("transparencia").from("conselhos").select("*", { count: "exact", head: true })).count },
    { nome: "saude_lista_espera", count: (await supabase.schema("transparencia").from("saude_lista_espera").select("*", { count: "exact", head: true })).count },
    { nome: "atos_normativos", count: (await supabase.schema("transparencia").from("atos_normativos").select("*", { count: "exact", head: true })).count },
    { nome: "cadastro_emendas", count: (await supabase.schema("transparencia").from("cadastro_emendas").select("*", { count: "exact", head: true })).count },
    { nome: "renuncia_receita", count: (await supabase.schema("transparencia").from("renuncia_receita").select("*", { count: "exact", head: true })).count }
  ];

  console.log("=== CONTAGEM REAL DAS TABELAS NO BANCO HOJE ===");
  tabelas.forEach(t => {
    console.log(` - Tabela '${t.nome}': ${t.count} registros`);
  });

  // Checar quantos RGFs existem em planejamento_documentos
  const { count: countRGF } = await supabase.schema("transparencia").from("planejamento_documentos").select("*", { count: "exact", head: true }).ilike("tipo", "%RGF%");
  console.log(` - Documentos com 'RGF' no tipo: ${countRGF}`);

  // Checar divida ativa em receitas ou tabela separada
  const { count: countDivida } = await supabase.schema("transparencia").from("receitas").select("*", { count: "exact", head: true }).ilike("descricao", "%DÍVIDA ATIVA%");
  console.log(` - Receitas de Dívida Ativa no banco: ${countDivida}`);
}

checarLacunas();
