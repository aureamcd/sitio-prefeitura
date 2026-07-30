import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function auditarBancoReal() {
  console.log("=== AUDITORIA REAL NO BANCO DE DADOS E PORTAL ===\n");

  // Tabelas para checar
  const tabelas = [
    "planejamento_documentos",
    "licitacoes",
    "contratos",
    "diarias",
    "obras",
    "receitas",
    "despesas",
    "emendas",
    "convenios",
    "servidores",
    "conselhos",
    "saude_lista_espera",
    "folha_pagamento",
    "estrutura_organizacional",
    "faq",
    "pesquisa_satisfacao",
    "sic_pedidos"
  ];

  for (const tab of tabelas) {
    const { count, error } = await supabase.schema("transparencia").from(tab).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`❌ Tabela [${tab}]: Erro / Não existe (${error.message})`);
    } else {
      console.log(`📊 Tabela [${tab}]: ${count} registros encontrados`);
    }
  }

  console.log("\n--- DETALHAMENTO DE CONSELHOS ---");
  const { data: consel } = await supabase.schema("transparencia").from("conselhos").select("nome, sigla");
  if (consel && consel.length > 0) {
    consel.forEach(c => console.log(`   - ${c.nome} (${c.sigla || ""})`));
  } else {
    console.log("   (Nenhum conselho cadastrado na tabela conselhos!)");
  }

  console.log("\n--- DETALHAMENTO DE PLANEJAMENTO E PRESTAÇÃO DE CONTAS ---");
  const { data: docs } = await supabase.schema("transparencia").from("planejamento_documentos").select("tipo, exercicio");
  const contagem: Record<string, number> = {};
  docs?.forEach(d => {
    const chave = `${d.tipo} - ${d.exercicio}`;
    contagem[chave] = (contagem[chave] || 0) + 1;
  });
  Object.entries(contagem).sort().forEach(([k, v]) => console.log(`   - ${k}: ${v} arquivos`));

  console.log("\n--- DETALHAMENTO DE OBRAS ---");
  const { data: obras } = await supabase.schema("transparencia").from("obras").select("status, situacao, paralisada, motivo_paralisacao");
  console.log(`   Total obras no banco: ${obras?.length || 0}`);
  if (obras) {
    const paralisadas = obras.filter(o => o.paralisada || o.situacao === "PARALISADA" || o.status === "PARALISADA");
    console.log(`   Obras paralisadas encontradas: ${paralisadas.length}`);
  }

  console.log("\n--- DETALHAMENTO DE SAÚDE - LISTA DE ESPERA ---");
  const { data: espera, error: espErr } = await supabase.schema("transparencia").from("saude_lista_espera").select("*", { count: "exact" });
  if (espErr) console.log(`   Erro ao buscar lista de espera: ${espErr.message}`);
  else console.log(`   Registros na lista de espera: ${espera?.length || 0}`);
}

auditarBancoReal();
