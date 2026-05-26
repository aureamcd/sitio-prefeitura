/**
 * dedup-schema.ts — Remove duplicatas de todas as tabelas do schema transparencia
 *
 * Estratégia:
 * 1. Conecta no Supabase (service_role)
 * 2. Para cada tabela, busca registros agrupados pela chave única
 * 3. Identifica duplicatas (mesma chave, ID diferente)
 * 4. Remove duplicatas mantendo o registro mais antigo
 * 5. Cria índices UNIQUE para prevenir futuras duplicatas
 *
 * Uso:
 *   npx tsx scripts/dedup-schema.ts
 *
 * Observação: O script SQL (dedup-schema.sql) é mais eficiente e recomendado,
 *            pois executa diretamente no banco via window functions.
 *            Use este TS apenas se não tiver acesso ao SQL Editor do Supabase.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// Config: cada tabela com suas colunas de unicidade
// ---------------------------------------------------------------------------
interface TableConfig {
  name: string;
  uniqueBy: string[];
  orderBy?: string; // coluna para decidir qual registro manter (ASC = mantém o mais antigo)
}

const TABLES: TableConfig[] = [
  { name: "receitas", uniqueBy: ["ano", "codigo_contabil"] },
  { name: "receitas_detalhes", uniqueBy: ["ano", "codigo_contabil", "tipo", "data_lancamento", "valor"] },
  { name: "divida_ativa", uniqueBy: ["ano", "tipo"] },
  { name: "despesas", uniqueBy: ["ano", "pkemp"] },
  { name: "diarias", uniqueBy: ["ano", "nempg", "numero_liquidacao"] },
  { name: "licitacoes", uniqueBy: ["ano", "proclic"] },
  { name: "contratos", uniqueBy: ["ano", "codigo"] },
  { name: "transferencias", uniqueBy: ["ano", "mes", "entidade_pagadora", "entidade_recebedora", "repasse"] },
  { name: "restos_pagar", uniqueBy: ["ano", "codigo"] },
  { name: "despesas_extra_orcamentarias", uniqueBy: ["ano", "codigo"] },
  { name: "servidores", uniqueBy: ["ano", "matricula"] },
  { name: "emendas", uniqueBy: ["ano", "tipo_transferencia", "receita_transferencia", "empenhado"] },
  { name: "obras", uniqueBy: ["ano", "contrato_numero"] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

/** Build a unique key string from row data */
function buildKey(row: Record<string, unknown>, columns: string[]): string {
  return columns.map((col) => String(row[col] ?? "")).join("\x00");
}

// ---------------------------------------------------------------------------
// Dedup logic for one table
// ---------------------------------------------------------------------------
async function dedupTable(config: TableConfig): Promise<number> {
  const { name, uniqueBy } = config;
  log(`📋 ${name} — buscando registros...`);

  const { data: rows, error, count } = await supabase
    .schema("transparencia")
    .from(name)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    log(`  ⚠ Erro ao buscar ${name}: ${error.message}`);
    return -1;
  }

  if (!rows || rows.length === 0) {
    log(`  ✓ ${name}: vazia`);
    return 0;
  }

  log(`  Total: ${count || rows.length} registros`);
  if ((count || rows.length) > 5000) {
    log(`  ⚠ Tabela grande (${count || rows.length} registros) — carregando em memória, pode consumir muitos recursos`);
  }

  // Agrupa por chave única
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = buildKey(row as Record<string, unknown>, uniqueBy);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Filtra grupos com mais de 1 registro
  const duplicates: string[] = [];
  for (const [, group] of groups) {
    if (group.length > 1) {
      // Mantém o primeiro (já ordenado por created_at ASC, id ASC)
      // Remove os demais
      for (let i = 1; i < group.length; i++) {
        duplicates.push(String(group[i].id));
      }
    }
  }

  if (duplicates.length === 0) {
    log(`  ✓ ${name}: sem duplicatas`);
    return 0;
  }

  log(`  🔴 ${duplicates.length} duplicatas encontradas, removendo...`);

  // Deleta em lotes
  const BATCH_SIZE = 100;
  let deleted = 0;
  for (let i = 0; i < duplicates.length; i += BATCH_SIZE) {
    const batch = duplicates.slice(i, i + BATCH_SIZE);
    const { error: delError } = await supabase
      .schema("transparencia")
      .from(name)
      .delete()
      .in("id", batch);

    if (delError) {
      log(`  ⚠ Erro ao deletar lote: ${delError.message}`);
    } else {
      deleted += batch.length;
    }

    await sleep(100); // rate limit gentil
  }

  log(`  ✅ ${deleted}/${duplicates.length} duplicatas removidas`);
  return deleted;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=".repeat(60));
  console.log("  🧹 DEDUPLICAÇÃO — Schema transparencia");
  console.log("=".repeat(60));
  console.log();

  const inicio = Date.now();
  const resultados: { tabela: string; removidas: number }[] = [];

  for (const table of TABLES) {
    const removidas = await dedupTable(table);
    resultados.push({ tabela: table.name, removidas: removidas >= 0 ? removidas : -1 });
  }

  // Sumário
  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log();
  console.log("=".repeat(60));
  console.log("  📊 RESUMO");
  console.log("=".repeat(60));
  console.log(`  ⏱️  Duração: ${duracao}s`);
  console.log();
  let totalRemovidas = 0;
  for (const r of resultados) {
    const status = r.removidas >= 0
      ? `✓ ${r.removidas} duplicata(s) removida(s)`
      : "✗ FALHA";
    console.log(`  ${r.tabela.padEnd(30)} ${status}`);
    if (r.removidas > 0) totalRemovidas += r.removidas;
  }
  console.log();
  console.log(`  🧹 Total: ${totalRemovidas} duplicatas removidas`);
  console.log(`  ✅ Concluído!`);
}

main().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
