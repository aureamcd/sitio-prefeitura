// scripts/limpeza-generica.ts
//
// Script genérico para corrigir encoding quebrado, remover espaços duplos,
// normalizar CAPS LOCK excessivo, detectar duplicados e normalizar títulos.
//
// Uso:
//   npx tsx scripts/limpeza-generica.ts --tabela=nome_da_tabela
//
// Opções:
//   --tabela=NOME        (Obrigatório) Nome da tabela a ser processada
//   --colunas=C1,C2      (Opcional) Limita a limpeza a colunas específicas
//   --dry-run            Apenas mostra o que seria alterado, sem modificar
//   --limit=N            Processa apenas N registros
//   --from-id=N          Começa a processar a partir do ID N (para paginação)
//   --detect-duplicates  Detecta registros duplicados por (tipo, numero, ano)
//   --remove-duplicates  Remove duplicados mantendo o registro de menor ID
//   --normalize-title    Normaliza títulos: 1ª maiúscula, "nº" → "Nº"
//
// Exemplo:
//   npx tsx scripts/limpeza-generica.ts --tabela=noticias --dry-run
//   npx tsx scripts/limpeza-generica.ts --tabela=legislacoes --detect-duplicates
//   npx tsx scripts/limpeza-generica.ts --tabela=legislacoes --remove-duplicates --dry-run
//   npx tsx scripts/limpeza-generica.ts --tabela=legislacoes --normalize-title --dry-run

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 50;

/* ═══════════════════════════════════════════════
   CONSTANTS & REGRAS
   ═══════════════════════════════════════════════ */

const SIGLAS = new Set([
  "PM", "RG", "CPF", "CNPJ", "SUS", "IPVA", "IPTU", "ISS", "ICMS", "ITBI",
  "FGTS", "PIS", "COFINS", "INSS", "IBGE", "IPEA", "FPM", "FPE", "FUNDEB",
  "FNDE", "PNAE", "SAMU", "UBS", "ESF", "NASF", "CRAS", "CREAS", "CAPS",
  "SUAS", "SUSEPE", "DETRAN", "SEMED", "SEMUS", "SEMOB", "SEMDES", "SEMAGRI",
  "SEMTHAS", "SEMINFRA", "SEMTUR", "SEME", "SEMUSP", "SEMGOV", "PROCON",
  "SINE", "SAAE", "CORSAN", "AGEVISA", "CONAMA", "CONTRAN", "DENATRAN",
  "DPVAT", "INMETRO", "ANVISA", "ANS", "ANEEL", "ANATEL", "ANP", "ANA",
]);

const PALAVRAS_MINUSCULAS = new Set([
  "de", "da", "do", "das", "dos", "e", "a", "o", "em", "com", "no", "na",
  "nos", "nas", "por", "para", "pelo", "pela", "pelos", "pelas", "à", "ao",
  "aos", "às",
]);

const ENCODING_FIXES: [string, string][] = [
  ["\u00c3\u00a7", "ç"], ["\u00c3\u00a3", "ã"], ["\u00c3\u00a9", "é"],
  ["\u00c3\u00aa", "ê"], ["\u00c3\u00a1", "á"], ["\u00c3\u00a0", "à"],
  ["\u00c3\u00b3", "ó"], ["\u00c3\u00b5", "õ"], ["\u00c3\u00ba", "ú"],
  ["\u00c3\u00bc", "ü"], ["\u00c3\u00ad", "í"], ["\u00c3\u00b4", "ô"],
  ["\u00c3\u00a2", "â"], ["\u00c3\u00b2", "ò"], ["\u00c3\u00ac", "ì"],
  ["\u00c3\u0091", "Ñ"], ["\u00c3\u00b1", "ñ"],
  ["\u00c3\u0081", "Á"], ["\u00c3\u0080", "À"], ["\u00c3\u0082", "Â"],
  ["\u00c3\u0089", "É"], ["\u00c3\u009a", "Ú"], ["\u00c3\u008d", "Í"],
  ["\u00c3\u0093", "Ó"], ["\u00c3\u0094", "Ô"], ["\u00c3\u0095", "Õ"],
  ["\u00c3\u009c", "Ü"], ["\u00c3\u008a", "Ê"],
  ["N\ufffd", "Nº"], ["n\ufffd", "nº"],
];

function fixEncoding(text: string): string {
  let result = text;
  for (const [garbled, fixed] of ENCODING_FIXES) {
    while (result.includes(garbled)) {
      result = result.replace(garbled, fixed);
    }
  }
  return result;
}

function normalizarEspacos(text: string): string {
  return text.replace(/\s+/g, " ").replace(/\s+([.,;:!?])/g, "$1").trim();
}

function isExtremeCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 4) return false;
  const uppercase = letters.replace(/[^A-ZÀ-Ü]/g, "");
  return uppercase.length / letters.length > 0.65;
}

function fixExtremeCaps(text: string): string {
  if (!isExtremeCaps(text)) return text;

  const words = text.split(/\s+/);
  return words
    .map((word, index) => {
      if (SIGLAS.has(word.toUpperCase())) return word.toUpperCase();
      if (word.length <= 2 && word === word.toUpperCase()) return word;
      if (/^\d+$/.test(word)) return word;
      if (/^n[º°]?$/i.test(word) && word.charAt(0) === 'n') return "Nº";

      if (/\d/.test(word)) {
        const onlyLetters = word.replace(/[^a-zA-ZÀ-ÿ]/g, "");
        if (onlyLetters.length > 0 && isExtremeCaps(onlyLetters)) {
          const fixed = onlyLetters.charAt(0).toUpperCase() + onlyLetters.slice(1).toLowerCase();
          return word.replace(/[a-zA-ZÀ-ÿ]+/, fixed);
        }
        return word;
      }

      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      if (PALAVRAS_MINUSCULAS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}



/* ═══════════════════════════════════════════════
   LOGGING & UTILS
   ═══════════════════════════════════════════════ */

const LOG_COLORS = {
  reset: "\x1b[0m", bright: "\x1b[1m", dim: "\x1b[2m", red: "\x1b[31m",
  green: "\x1b[32m", yellow: "\x1b[33m", blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m",
};

function logInfo(msg: string) { console.log(`${LOG_COLORS.blue}ℹ${LOG_COLORS.reset} ${msg}`); }
function logSucesso(msg: string) { console.log(`${LOG_COLORS.green}✔${LOG_COLORS.reset} ${msg}`); }
function logAlerta(msg: string) { console.log(`${LOG_COLORS.yellow}⚠${LOG_COLORS.reset} ${msg}`); }
function logErro(msg: string) { console.log(`${LOG_COLORS.red}✘${LOG_COLORS.reset} ${msg}`); }
function logDestaque(msg: string) { console.log(`${LOG_COLORS.magenta}${LOG_COLORS.bright}${msg}${LOG_COLORS.reset}`); }

function logCampo(campo: string, antes: string, depois: string) {
  const antesShort = antes.length > 80 ? antes.slice(0, 80) + "..." : antes;
  const depoisShort = depois.length > 80 ? depois.slice(0, 80) + "..." : depois;
  console.log(
    `  ${LOG_COLORS.cyan}${campo}:${LOG_COLORS.reset}`,
    `"${LOG_COLORS.red}${antesShort}${LOG_COLORS.reset}"`,
    `→`,
    `"${LOG_COLORS.green}${depoisShort}${LOG_COLORS.reset}"`
  );
}

/* ═══════════════════════════════════════════════
   DETECÇÃO DE DUPLICADOS
   ═══════════════════════════════════════════════ */

async function detectarDuplicados(tabela: string) {
  logInfo("Buscando registros para detectar duplicados...");

  const { data, error } = await supabase
    .from(tabela)
    .select("id, tipo, numero, ano, titulo")
    .not("tipo", "is", null)
    .not("numero", "is", null)
    .not("ano", "is", null)
    .order("id", { ascending: true });

  if (error) {
    logErro(`Erro ao buscar dados: ${error.message}`);
    return;
  }

  if (!data || data.length === 0) {
    logAlerta("Nenhum registro encontrado.");
    return;
  }

  // Agrupa por (tipo, numero, ano)
  const grupos = new Map<string, typeof data>();
  for (const row of data) {
    const chave = `${String(row.tipo).trim().toLowerCase()} | ${String(row.numero).trim()} | ${row.ano}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(row);
  }

  // Filtra grupos com mais de 1 registro
  const duplicados = Array.from(grupos.entries())
    .filter(([_, registros]) => registros.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (duplicados.length === 0) {
    logSucesso("Nenhum registro duplicado encontrado!");
    return;
  }

  console.log(`\n${LOG_COLORS.yellow}${LOG_COLORS.bright}  🗂  ${duplicados.length} grupo(s) com duplicados encontrados${LOG_COLORS.reset}\n`);

  for (const [chave, registros] of duplicados.slice(0, 20)) { // Mostra no max 20 grupos
    const [tipo, numero, ano] = chave.split(" | ");
    console.log(`  ${LOG_COLORS.magenta}${LOG_COLORS.bright}${tipo} nº ${numero}/${ano}${LOG_COLORS.reset} — ${registros.length} registros`);

    for (const r of registros) {
      const tituloShort = r.titulo && r.titulo.length > 60
        ? r.titulo.slice(0, 60) + "..."
        : r.titulo || "(sem título)";
      console.log(`    ${LOG_COLORS.cyan}ID #${String(r.id).padEnd(4)}${LOG_COLORS.reset} "${tituloShort}"`);
    }
    console.log("");
  }

  if (duplicados.length > 20) {
    logInfo(`... e mais ${duplicados.length - 20} grupo(s) de duplicados.`);
  }

  const totalDuplicados = duplicados.reduce((acc, [_, regs]) => acc + regs.length, 0);
  console.log(`  ${LOG_COLORS.bright}Total:${LOG_COLORS.reset} ${totalDuplicados} registros duplicados em ${duplicados.length} grupos\n`);
}

/* ═══════════════════════════════════════════════
   LÓGICA PRINCIPAL
   ═══════════════════════════════════════════════ */

interface RunOptions {
  tabela: string;
  colunas: string[] | null;
  dryRun: boolean;
  limit: number | null;
  fromId: number | null;
  detectDuplicates: boolean;
  removeDuplicates: boolean;
  normalizeTitle: boolean;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);

  const tabelaArg = args.find(a => a.startsWith("--tabela="));
  const tabela = tabelaArg ? tabelaArg.split("=")[1] : "";

  const colunasArg = args.find(a => a.startsWith("--colunas="));
  const colunas = colunasArg ? colunasArg.split("=")[1].split(",").map(c => c.trim()) : null;

  const dryRun = args.includes("--dry-run");

  const limitArg = args.find(a => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) || null : null;

  const fromIdArg = args.find(a => a.startsWith("--from-id="));
  const fromId = fromIdArg ? parseInt(fromIdArg.split("=")[1], 10) || null : null;

  const detectDuplicates = args.includes("--detect-duplicates");
  const removeDuplicates = args.includes("--remove-duplicates");
  const normalizeTitle = args.includes("--normalize-title");

  return { tabela, colunas, dryRun, limit, fromId, detectDuplicates, removeDuplicates, normalizeTitle };
}

export async function runLimpezaGenerica() {
  const cfg = parseArgs();

  console.log("\n" + "═".repeat(60));
  logDestaque("  LIMPEZA GENÉRICA DE TABELAS");
  console.log("═".repeat(60));

  if (!cfg.tabela) {
    logErro("É obrigatório informar a tabela! Use: npx tsx scripts/limpeza-generica.ts --tabela=nome_da_tabela");
    process.exit(1);
  }

  logInfo(`Tabela alvo: ${LOG_COLORS.bright}${cfg.tabela}${LOG_COLORS.reset}`);
  if (cfg.colunas) logInfo(`Colunas específicas: ${cfg.colunas.join(", ")}`);
  else logInfo("Processando todas as colunas de texto auto-detectadas");

  if (cfg.dryRun) logAlerta("MODO DRY RUN — NENHUMA ALTERAÇÃO SERÁ SALVA\n");
  else logInfo("MODO DE EXECUÇÃO — alterações serão salvas no banco\n");

  // ── REMOVER DUPLICADOS ──
  if (cfg.removeDuplicates) {
    console.log("\n" + "─".repeat(60));
    logDestaque("  REMOÇÃO DE DUPLICADOS");
    console.log("─".repeat(60));

    logInfo("Buscando registros para identificar duplicados...");

    const { data, error } = await supabase
      .from(cfg.tabela)
      .select("id, tipo, numero, ano, titulo")
      .not("tipo", "is", null)
      .not("numero", "is", null)
      .not("ano", "is", null)
      .order("id", { ascending: true });

    if (error) {
      logErro(`Erro ao buscar dados: ${error.message}`);
      process.exit(1);
    }

    if (!data || data.length === 0) {
      logAlerta("Nenhum registro encontrado.");
      return;
    }

    // Agrupa por (tipo, numero, ano)
    const grupos = new Map<string, typeof data>();
    for (const row of data) {
      const chave = `${String(row.tipo).trim().toLowerCase()} | ${String(row.numero).trim()} | ${row.ano}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(row);
    }

    // Filtra grupos com mais de 1 registro
    const duplicados = Array.from(grupos.entries())
      .filter(([_, registros]) => registros.length > 1);

    if (duplicados.length === 0) {
      logSucesso("Nenhum registro duplicado encontrado!");
    } else {
      const idsParaRemover: number[] = [];
      let totalGrupos = 0;

      for (const [chave, registros] of duplicados) {
        totalGrupos++;
        // Mantém o primeiro (menor ID), remove os demais
        const sorted = [...registros].sort((a, b) => a.id - b.id);
        const mantido = sorted[0];
        const remover = sorted.slice(1);

        for (const r of remover) {
          idsParaRemover.push(r.id);
        }

        const [tipo, numero, ano] = chave.split(" | ");
        console.log(`  ${LOG_COLORS.magenta}${tipo} nº ${numero}/${ano}${LOG_COLORS.reset} — mantendo ID #${mantido.id}, removendo ${remover.length}`);
      }

      console.log("");
      logInfo(`Total: ${duplicados.length} grupos, ${idsParaRemover.length} registros para remover.`);

      if (idsParaRemover.length > 0) {
        if (cfg.dryRun) {
          logInfo(`DRY RUN: ${idsParaRemover.length} registro(s) seriam removidos.`);
        } else {
          // Remove em lotes
          for (let i = 0; i < idsParaRemover.length; i += BATCH_SIZE) {
            const batch = idsParaRemover.slice(i, i + BATCH_SIZE);
            const { error: delError } = await supabase
              .from(cfg.tabela)
              .delete()
              .in("id", batch);

            if (delError) {
              logErro(`Erro ao remover lote: ${delError.message}`);
            } else {
              logSucesso(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} registro(s) removidos`);
            }
          }
          logSucesso(`${idsParaRemover.length} registros duplicados removidos!`);
        }
      }
    }

    // Se for apenas remoção, para por aqui
    const onlyRemove = !cfg.colunas && !cfg.normalizeTitle;
    if (onlyRemove) {
      console.log("\n" + "═".repeat(60) + "\n");
      return;
    }
    console.log("");
  }

  // ── DETECTAR DUPLICADOS ──
  if (cfg.detectDuplicates) {
    console.log("\n" + "─".repeat(60));
    logDestaque("  DETECÇÃO DE DUPLICADOS");
    console.log("─".repeat(60));
    await detectarDuplicados(cfg.tabela);

    // Se for apenas detecção, para por aqui
    const onlyDetect = !cfg.colunas && !cfg.normalizeTitle;
    if (onlyDetect) {
      console.log("═".repeat(60) + "\n");
      return;
    }
    console.log("");
  }

  // ── LIMPEZA / NORMALIZAÇÃO ──
  logInfo("Buscando registros...");

  let query = supabase.from(cfg.tabela).select("*").order("id", { ascending: true });
  if (cfg.fromId) query = query.gte("id", cfg.fromId);
  if (cfg.limit) query = query.limit(cfg.limit);

  const { data: registros, error } = await query;

  if (error) {
    logErro(`Erro ao buscar registros da tabela '${cfg.tabela}': ${error.message}`);
    process.exit(1);
  }

  if (!registros || registros.length === 0) {
    logAlerta("Nenhum registro encontrado.");
    return;
  }

  logSucesso(`${registros.length} registro(s) encontrado(s)\n`);

  const atualizacoes: { id: number; campos: Record<string, string> }[] = [];

  for (const row of registros) {
    if (!row.id) {
      logErro("A tabela não possui uma coluna 'id' primária para atualização.");
      process.exit(1);
    }

    const updates: Record<string, string> = {};
    let hasChanges = false;

    for (const [key, value] of Object.entries(row)) {
      if (typeof value !== "string" || !value.trim()) continue;

      // Ignora colunas que não estão na lista (se uma lista foi passada)
      if (cfg.colunas && !cfg.colunas.includes(key)) continue;

      // Não mexe em colunas comuns de sistema/urls se não for pedido explicitamente
      if (!cfg.colunas) {
        const keyLower = key.toLowerCase();
        if (keyLower.includes("url") || keyLower.includes("slug") || keyLower === "created_at" || keyLower === "updated_at" || keyLower.startsWith("arquivo")) {
          continue;
        }
      }

      let limpo = value;

      // Aplica correções de encoding e espaços
      limpo = fixEncoding(limpo);
      limpo = normalizarEspacos(limpo);

      // Só aplica extreme caps se não for modo normalize-title (que é mais leve)
      if (!cfg.normalizeTitle) {
        limpo = fixExtremeCaps(limpo);
      }

      // Normalização específica de título (quando ativada)
      if (cfg.normalizeTitle) {
        // "nº" → "Nº" em qualquer texto
        limpo = limpo.replace(/\bnº\b/gi, "Nº");
        // "n°" → "N°" também
        limpo = limpo.replace(/\bn°\b/gi, "N°");

        // Primeira letra maiúscula
        if (limpo.length > 0) {
          const words = limpo.split(/\s+/);
          if (words.length > 0 && !SIGLAS.has(words[0].toUpperCase())) {
            words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
          }
          limpo = words.join(" ");
        }
      }

      if (limpo !== value) {
        updates[key] = limpo;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      atualizacoes.push({ id: row.id, campos: updates });
      console.log(`\n${LOG_COLORS.cyan}▸ Registro #${row.id}${LOG_COLORS.reset}`);
      for (const [k, v] of Object.entries(updates)) {
        logCampo(k, row[k] as string, v);
      }
    }
  }

  // Resumo e Atualização
  console.log("\n" + "─".repeat(60));
  logDestaque("  RESUMO");
  console.log("─".repeat(60));
  logInfo(`Registros analisados: ${registros.length}`);
  logInfo(`Registros com alterações necessárias: ${atualizacoes.length}`);

  if (atualizacoes.length > 0) {
    if (cfg.dryRun) {
      logInfo(`DRY RUN: ${atualizacoes.length} registro(s) seriam atualizados.`);
    } else {
      console.log("");
      for (let i = 0; i < atualizacoes.length; i += BATCH_SIZE) {
        const batch = atualizacoes.slice(i, i + BATCH_SIZE);
        const promises = batch.map((a) =>
          supabase.from(cfg.tabela).update(a.campos).eq("id", a.id)
        );

        const results = await Promise.all(promises);
        const erros = results.filter((r) => r.error);

        for (const r of results) {
          if (r.error) logErro(`Erro ao atualizar #${r.status}: ${r.error.message}`);
        }

        if (erros.length === 0) {
          logSucesso(`Lote ${Math.floor(i / BATCH_SIZE) + 1} salvo (${batch.length} registro(s))`);
        }
      }
    }
  } else {
    logSucesso("Nenhuma alteração necessária.");
  }

  console.log("\n" + "═".repeat(60));
  logDestaque(cfg.dryRun ? "  DRY RUN CONCLUÍDO" : "  LIMPEZA CONCLUÍDA");
  console.log("═".repeat(60) + "\n");
}

if (typeof require !== "undefined" && require.main === module) {
  runLimpezaGenerica().catch((err) => {
    console.error("\n💥 Erro fatal:", err);
    process.exit(1);
  });
}
