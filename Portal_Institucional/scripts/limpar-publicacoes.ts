// scripts/limpar-publicacoes.ts
//
// Limpa e padroniza publicações institucionais na tabela `publicacoes`.
//
// Uso:
//   npx tsx scripts/limpar-publicacoes.ts
//
// Opções:
//   --dry-run   Apenas mostra o que seria alterado, sem modificar
//   --limit=N   Processa apenas N registros
//   --from-id=N  Continua a partir do ID especificado (retomada)
//
// Exemplos:
//   npx tsx scripts/limpar-publicacoes.ts --dry-run
//   npx tsx scripts/limpar-publicacoes.ts --limit=20
//   npx tsx scripts/limpar-publicacoes.ts --from-id=150
//   npx tsx scripts/limpar-publicacoes.ts

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

/* ═══════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════ */

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BATCH_SIZE = 50;

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */

interface Publicacao {
  id: number;
  titulo: string | null;
  descricao: string | null;
  numero: string | null;
  ano: string | null;
  tipo: string | null;
  data_publicacao: string | null;
  arquivo_url: string | null;
  created_at: string;
  arquivo_r2_url: string | null;
  arquivo_drive_id: string | null;
}

interface Atualizacao {
  id: number;
  campos: Record<string, string>;
}

/* ═══════════════════════════════════════════════
   CONSTANTS — Tipos reconhecidos
   ═══════════════════════════════════════════════ */

const TIPOS = [
  "Portaria",
  "Lei",
  "Decreto",
  "Resolução",
  "Edital",
  "Licitação",
  "Contrato",
  "Ata",
  "Pregão",
  "Aviso",
  "Inexigibilidade",
  "Dispensa",
  "Nomeação",
  "Exoneração",
] as const;

const TIPOS_PATTERN = TIPOS.join("|");

/** Palavras que podem modificar o tipo (ex: "Lei Complementar") */
const MODIFICADORES = [
  "Complementar",
  "Conjunta",
  "Ordinária",
  "Municipal",
  "Federal",
  "Estadual",
  "Normativa",
  "Regulamentar",
  "Delegada",
  "Específica",
];

/** Siglas conhecidas que devem ser preservadas em maiúsculo */
const SIGLAS = new Set([
  "PM",
  "RG",
  "CPF",
  "CNPJ",
  "SUS",
  "IPVA",
  "IPTU",
  "ISS",
  "ICMS",
  "ITBI",
  "FGTS",
  "PIS",
  "COFINS",
  "INSS",
  "IBGE",
  "IPEA",
  "FPM",
  "FPE",
  "FUNDEB",
  "FNDE",
  "PNAE",
  "SAMU",
  "UBS",
  "ESF",
  "NASF",
  "CRAS",
  "CREAS",
  "CAPS",
  "SUAS",
  "SUSEPE",
  "DETRAN",
  "SEMED",
  "SEMUS",
  "SEMOB",
  "SEMDES",
  "SEMAGRI",
  "SEMTHAS",
  "SEMINFRA",
  "SEMTUR",
  "SEME",
  "SEMUSP",
  "SEMGOV",
  "PROCON",
  "SINE",
  "SAAE",
  "CORSAN",
  "AGEVISA",
  "CONAMA",
  "CONTRAN",
  "DENATRAN",
  "DPVAT",
  "INMETRO",
  "ANVISA",
  "ANS",
  "ANEEL",
  "ANATEL",
  "ANP",
  "ANA",
]);

/** Prefixos de artigos/preposições que devem ficar minúsculos no meio do título */
const PALAVRAS_MINUSCULAS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "a",
  "o",
  "em",
  "com",
  "no",
  "na",
  "nos",
  "nas",
  "por",
  "para",
  "pelo",
  "pela",
  "pelos",
  "pelas",
  "à",
  "ao",
  "aos",
  "às",
]);

/* ═══════════════════════════════════════════════
   ENCODING FIXES — Mapeamento de caracteres
   quebrados (UTF-8 duplamente interpretado)
   ═══════════════════════════════════════════════ */

const ENCODING_FIXES: [string, string][] = [
  // Acentos comuns (latin-1 mal interpretado)
  ["\u00c3\u00a7", "ç"],   // Ã§ → ç
  ["\u00c3\u00a3", "ã"],   // Ã£ → ã
  ["\u00c3\u00a9", "é"],   // Ã© → é
  ["\u00c3\u00aa", "ê"],   // Ãª → ê
  ["\u00c3\u00a1", "á"],   // Ã¡ → á
  ["\u00c3\u00a0", "à"],   // Ã  → à
  ["\u00c3\u00b3", "ó"],   // Ã³ → ó
  ["\u00c3\u00b5", "õ"],   // Ãµ → õ
  ["\u00c3\u00ba", "ú"],   // Ãº → ú
  ["\u00c3\u00bc", "ü"],   // Ã¼ → ü
  ["\u00c3\u00ad", "í"],   // Ã­ → í
  ["\u00c3\u00b4", "ô"],   // Ã´ → ô
  ["\u00c3\u00a2", "â"],   // Ã¢ → â
  ["\u00c3\u00b2", "ò"],   // Ã² → ò
  ["\u00c3\u00ac", "ì"],   // Ã¬ → ì
  ["\u00c3\u0091", "Ñ"],   // Ã‘ → Ñ (maiúsculo)
  ["\u00c3\u00b1", "ñ"],   // Ã± → ñ
  // Vogais maiúsculas
  ["\u00c3\u0081", "Á"],
  ["\u00c3\u0080", "À"],
  ["\u00c3\u0082", "Â"],
  ["\u00c3\u0089", "É"],
  ["\u00c3\u009a", "Ú"],
  ["\u00c3\u008d", "Í"],
  ["\u00c3\u0093", "Ó"],
  ["\u00c3\u0094", "Ô"],
  ["\u00c3\u0095", "Õ"],
  ["\u00c3\u009c", "Ü"],
  ["\u00c3\u008a", "Ê"],
  // Símbolos específicos
  ["N\ufffd", "Nº"],
  ["n\ufffd", "nº"],
];

/** Aplica todas as correções de encoding quebrado */
function fixEncoding(text: string): string {
  let result = text;
  for (const [garbled, fixed] of ENCODING_FIXES) {
    // Usa replace com string (não regex) para evitar escaping complexo
    while (result.includes(garbled)) {
      result = result.replace(garbled, fixed);
    }
  }
  return result;
}

/* ═══════════════════════════════════════════════
   STRING HELPERS
   ═══════════════════════════════════════════════ */

/** Remove espaços duplicados, quebras de linha, e trim */
function normalizarEspacos(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/** Verifica se uma string está em CAPS LOCK excessivo */
function isExtremeCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 4) return false;
  const uppercase = letters.replace(/[^A-ZÀ-Ü]/g, "");
  return uppercase.length / letters.length > 0.65;
}

/** Corrige CAPS LOCK excessivo, preservando siglas e primeira letra */
function fixExtremeCaps(text: string): string {
  if (!isExtremeCaps(text)) return text;

  const words = text.split(/\s+/);
  const result = words
    .map((word, index) => {
      // Preserva siglas conhecidas
      if (SIGLAS.has(word.toUpperCase())) return word.toUpperCase();

      // Preserva acrônimos com 2 letras ou menos
      if (word.length <= 2 && word === word.toUpperCase()) return word;

      // Preserva números
      if (/^\d+$/.test(word)) return word;

      // Preserva "Nº" e variantes
      if (/^N[º°]?$/i.test(word)) return word.toUpperCase().startsWith("N") ? "nº" : word;

      // Se tem números misturados, tenta preservar
      if (/\d/.test(word)) {
        const onlyLetters = word.replace(/[^a-zA-ZÀ-ÿ]/g, "");
        if (onlyLetters.length > 0 && isExtremeCaps(onlyLetters)) {
          const fixed = onlyLetters.charAt(0).toUpperCase() + onlyLetters.slice(1).toLowerCase();
          return word.replace(/[a-zA-ZÀ-ÿ]+/, fixed);
        }
        return word;
      }

      // Primeira palavra → maiúscula
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // Palavras que devem ficar minúsculas
      if (PALAVRAS_MINUSCULAS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      // Demais → primeira maiúscula, resto minúsculo
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return result;
}

/** Capitaliza corretamente uma string (primeira palavra maiúscula, resto respeitando regras) */
function capitalizarTitulo(text: string): string {
  const words = text.split(/\s+/);
  return words
    .map((word, index) => {
      if (SIGLAS.has(word.toUpperCase())) return word.toUpperCase();
      if (/^\d+$/.test(word)) return word;
      if (/^N[º°]?$/i.test(word)) return "nº";
      if (index > 0 && PALAVRAS_MINUSCULAS.has(word.toLowerCase())) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/* ═══════════════════════════════════════════════
   TIPO / NÚMERO / ANO — DETECÇÃO
   ═══════════════════════════════════════════════ */

interface TipoInfo {
  tipo: string | null;
  modificador: string | null;
}

/** Detecta o tipo de publicação a partir do título */
function detectarTipo(titulo: string): TipoInfo {
  const tipoRegex = new RegExp(
    `^(${TIPOS_PATTERN})(?:\\s+(${MODIFICADORES.join("|")}))?`,
    "i"
  );
  const match = titulo.match(tipoRegex);
  if (!match) return { tipo: null, modificador: null };

  const tipo = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
  const modificador = match[2]
    ? match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase()
    : null;

  return { tipo, modificador };
}

interface NumeroAnoInfo {
  numero: string | null;
  ano: string | null;
}

/** Extrai número e ano do título */
function extrairNumeroAno(titulo: string): NumeroAnoInfo {
  // Remove o prefixo do tipo para focar no número
  const tipoRegex = new RegExp(`^${TIPOS_PATTERN}(?:\\s+${MODIFICADORES.join("|")})?`, "i");
  const semTipo = titulo.replace(tipoRegex, "").trim();

  let numero: string | null = null;
  let ano: string | null = null;

  // 1. Tenta formato explícito: "Nº 123/2024" ou "N. 123/2024" ou "N 123/2024"
  const regexExplicito = /(?:N\s*[º°ª#]?\s*\.?\s*|N[Úú]MERO\s+)(\d{1,6})\s*[/\\]\s*((?:19|20)\d{2})/i;
  let m = semTipo.match(regexExplicito);
  if (m) {
    numero = m[1];
    ano = m[2];
    return { numero, ano };
  }

  // 2. Tenta "Nº 123 de 2024" ou "N. 123, de 2024"
  const regexDe = /(?:N\s*[º°ª#]?\s*\.?\s*|N[Úú]MERO\s+)(\d{1,6})\s*[,.]?\s*de\s+((?:19|20)\d{2})/i;
  m = semTipo.match(regexDe);
  if (m) {
    numero = m[1];
    ano = m[2];
    return { numero, ano };
  }

  // 3. Tenta "N 123/2024" sem símbolo
  const regexBarra = /N\s*\.?\s*(\d{1,6})\s*[/]\s*((?:19|20)\d{2})/i;
  m = semTipo.match(regexBarra);
  if (m) {
    numero = m[1];
    ano = m[2];
    return { numero, ano };
  }

  // 4. Tenta número com ano colado: "N 1232024" onde os últimos 4 dígitos são ano
  const regexColado = /(?:N\s*[º°ª#]?\s*\.?\s*|N[Úú]MERO\s+)?(\d{1,5})((?:19|20)\d{2})(?!\d)/i;
  m = semTipo.match(regexColado);
  if (m) {
    numero = m[1];
    ano = m[2];
    return { numero, ano };
  }

  // 5. Apenas número (sem ano) no começo do resto
  const regexSoNumero = /(?:N\s*[º°ª#]?\s*\.?\s*|N[Úú]MERO\s+)(\d{1,6})\b/i;
  m = semTipo.match(regexSoNumero);
  if (m) {
    numero = m[1];
  }

  return { numero, ano };
}

/** Extrai o ano do título (fallback) */
function extrairAno(titulo: string): string | null {
  const m = titulo.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/);
  return m ? m[1] : null;
}

/** Concatena tipo + modificador em string única */
function montarTipoCompleto(tipo: string, modificador: string | null): string {
  if (modificador) {
    return `${tipo} ${modificador}`;
  }
  return tipo;
}

/* ═══════════════════════════════════════════════
   TITLE STANDARDIZATION
   ═══════════════════════════════════════════════ */

/** Remove o prefixo de tipo/número do título para obter o restante */
function extrairComplementoTitulo(titulo: string, tipo: string, modificador: string | null): string {
  let pattern = tipo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (modificador) {
    pattern += `\\s+${modificador.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`;
  }
  const regex = new RegExp(`^${pattern}`, "i");
  let resto = titulo.replace(regex, "").trim();

  // Remove "Nº 123/2024", "N 1232024", etc. do complemento
  resto = resto
    .replace(/(?:N\s*[º°ª#]?\s*\.?\s*)?\d{1,6}\s*[/\\]?\s*(?:(?:19|20)\d{2})?/i, "")
    .replace(/\s+de\s+(?:19|20)\d{2}/i, "")
    .trim();

  return resto;
}

/** Constrói título padronizado no formato "Tipo nº N/ANO — complemento" */
function montarTituloPadronizado(
  tipo: string,
  modificador: string | null,
  numero: string | null,
  ano: string | null,
  complemento: string
): string {
  const tipoBase = tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
  const tipoCompleto = modificador
    ? `${tipoBase} ${modificador.charAt(0).toUpperCase() + modificador.slice(1).toLowerCase()}`
    : tipoBase;

  const numAno = numero
    ? `${ano ? `nº ${numero}/${ano}` : `nº ${numero}`}`
    : ano
      ? `${ano}`
      : "";

  if (complemento.trim()) {
    return `${tipoCompleto} ${numAno} — ${complemento.trim()}`;
  }
  if (numAno) {
    return `${tipoCompleto} ${numAno}`;
  }
  return tipoCompleto;
}

/** Padroniza título completo */
function padronizarTitulo(titulo: string): string {
  // 1. Corrige encoding
  let t = fixEncoding(titulo);

  // 2. Normaliza espaços
  t = normalizarEspacos(t);

  // 3. Detecta tipo
  const { tipo, modificador } = detectarTipo(t);

  // Se não detectou tipo, só corrige caps e retorna
  if (!tipo) {
    const capsFixed = fixExtremeCaps(t);
    return normalizarEspacos(capsFixed);
  }

  // 4. Extrai número e ano
  const { numero, ano } = extrairNumeroAno(t);

  // 5. Extrai complemento (restante do título sem tipo/número/ano)
  const complemento = extrairComplementoTitulo(t, tipo, modificador);

  // 6. Monta título padronizado
  const padronizado = montarTituloPadronizado(tipo, modificador, numero, ano, complemento);

  // 7. Corrige caps se necessário
  return fixExtremeCaps(padronizado);
}

/* ═══════════════════════════════════════════════
   DESCRIÇÃO — LIMPEZA
   ═══════════════════════════════════════════════ */

function limparDescricao(descricao: string): string {
  let d = fixEncoding(descricao);
  d = normalizarEspacos(d);
  d = fixExtremeCaps(d);
  return d;
}

/* ═══════════════════════════════════════════════
   FIELD-LEVEL COMPARISON HELPERS
   ═══════════════════════════════════════════════ */

/** Verifica se um campo está vazio (null, undefined, string vazia ou só espaços) */
function isVazio(valor: string | null | undefined): boolean {
  return valor === null || valor === undefined || valor.trim() === "";
}

/** Verifica se o campo precisa de correção de encoding */
function hasBrokenEncoding(valor: string): boolean {
  return ENCODING_FIXES.some(([garbled]) => valor.includes(garbled));
}

/** Verifica se o campo precisa de correção (vazio, encoding quebrado, ou caps extremo) */
function precisaCorrigir(valor: string | null | undefined): boolean {
  if (isVazio(valor)) return false; // campos vazios serão preenchidos, mas isso é tratado separadamente
  return hasBrokenEncoding(valor!) || isExtremeCaps(valor!);
}

/* ═══════════════════════════════════════════════
   LOGGING
   ═══════════════════════════════════════════════ */

const LOG_COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

function logInfo(msg: string): void {
  console.log(`${LOG_COLORS.blue}ℹ${LOG_COLORS.reset} ${msg}`);
}

function logSucesso(msg: string): void {
  console.log(`${LOG_COLORS.green}✔${LOG_COLORS.reset} ${msg}`);
}

function logAlerta(msg: string): void {
  console.log(`${LOG_COLORS.yellow}⚠${LOG_COLORS.reset} ${msg}`);
}

function logErro(msg: string): void {
  console.log(`${LOG_COLORS.red}✘${LOG_COLORS.reset} ${msg}`);
}

function logDestaque(msg: string): void {
  console.log(`${LOG_COLORS.magenta}${LOG_COLORS.bright}${msg}${LOG_COLORS.reset}`);
}

function logCampo(campo: string, antes: string, depois: string): void {
  if (antes !== depois) {
    console.log(
      `  ${LOG_COLORS.cyan}${campo}:${LOG_COLORS.reset}`,
      `"${LOG_COLORS.red}${antes}${LOG_COLORS.reset}"`,
      `→`,
      `"${LOG_COLORS.green}${depois}${LOG_COLORS.reset}"`
    );
  }
}

/* ═══════════════════════════════════════════════
   MAIN PROCESSING
   ═══════════════════════════════════════════════ */

async function processarPublicacao(
  pub: Publicacao,
  dryRun: boolean
): Promise<Atualizacao | null> {
  const updates: Record<string, string> = {};
  let hasChanges = false;

  // ─── TÍTULO ─────────────────────────────

  if (!isVazio(pub.titulo)) {
    const tituloOriginal = pub.titulo!;
    // Verifica se encoding ou caps precisa correção
    if (precisaCorrigir(tituloOriginal)) {
      const tituloLimpo = padronizarTitulo(tituloOriginal);
      if (tituloLimpo !== tituloOriginal) {
        updates.titulo = tituloLimpo;
        hasChanges = true;
        logCampo("titulo", tituloOriginal, tituloLimpo);
      }
    }
  } else if (isVazio(pub.titulo)) {
    // Título vazio — tentamos gerar? Não, conforme regras: NÃO inventar informações.
    logAlerta(`Publicação #${pub.id} sem título — ignorando (regra: não inventar)`);
  }

  // ─── DESCRIÇÃO ──────────────────────────

  if (!isVazio(pub.descricao)) {
    const descOriginal = pub.descricao!;
    if (precisaCorrigir(descOriginal)) {
      const descLimpa = limparDescricao(descOriginal);
      if (descLimpa !== descOriginal) {
        updates.descricao = descLimpa;
        hasChanges = true;
        logCampo("descricao", descOriginal.slice(0, 80), descLimpa.slice(0, 80));
      }
    }
  }

  // ─── TIPO ───────────────────────────────

  if (isVazio(pub.tipo) && !isVazio(pub.titulo)) {
    // Auto-detectar tipo a partir do título (com encoding corrigido)
    const tituloFix = fixEncoding(pub.titulo!);
    const { tipo, modificador } = detectarTipo(tituloFix);
    if (tipo) {
      const tipoCompleto = montarTipoCompleto(tipo, modificador);
      updates.tipo = tipoCompleto;
      hasChanges = true;
      logCampo("tipo", "(vazio)", tipoCompleto);
    }
  } else if (!isVazio(pub.tipo)) {
    const tipoOriginal = pub.tipo!;
    if (precisaCorrigir(tipoOriginal)) {
      const tipoLimpo = fixEncoding(tipoOriginal);
      const capsFixed = fixExtremeCaps(tipoLimpo);
      if (capsFixed !== tipoOriginal) {
        updates.tipo = capsFixed;
        hasChanges = true;
        logCampo("tipo", tipoOriginal, capsFixed);
      }
    }
  }

  // ─── NÚMERO ─────────────────────────────

  if (isVazio(pub.numero) && !isVazio(pub.titulo)) {
    // Auto-detectar número a partir do título (com encoding corrigido)
    const tituloFix = fixEncoding(pub.titulo!);
    const { numero } = extrairNumeroAno(tituloFix);
    if (numero) {
      updates.numero = numero;
      hasChanges = true;
      logCampo("numero", "(vazio)", numero);
    }
  } else if (!isVazio(pub.numero)) {
    const numOriginal = pub.numero!;
    if (precisaCorrigir(numOriginal)) {
      const numLimpo = fixEncoding(numOriginal);
      if (numLimpo !== numOriginal) {
        updates.numero = numLimpo;
        hasChanges = true;
        logCampo("numero", numOriginal, numLimpo);
      }
    }
  }

  // ─── ANO ────────────────────────────────

  if (isVazio(pub.ano) && !isVazio(pub.titulo)) {
    // Auto-detectar ano a partir do título (com encoding corrigido)
    const tituloFix = fixEncoding(pub.titulo!);
    const { ano } = extrairNumeroAno(tituloFix);
    if (ano) {
      updates.ano = ano;
      hasChanges = true;
      logCampo("ano", "(vazio)", ano);
    } else {
      // Fallback: tenta extrair qualquer ano no título
      const anoFallback = extrairAno(tituloFix);
      if (anoFallback) {
        updates.ano = anoFallback;
        hasChanges = true;
        logCampo("ano", "(vazio)", anoFallback);
      }
    }
  } else if (!isVazio(pub.ano)) {
    const anoOriginal = pub.ano!;
    if (precisaCorrigir(anoOriginal)) {
      const anoLimpo = fixEncoding(anoOriginal);
      if (anoLimpo !== anoOriginal) {
        updates.ano = anoLimpo;
        hasChanges = true;
        logCampo("ano", anoOriginal, anoLimpo);
      }
    }
  }

  if (!hasChanges) return null;

  return { id: pub.id, campos: updates };
}

async function aplicarAtualizacoes(
  atualizacoes: Atualizacao[],
  dryRun: boolean
): Promise<void> {
  if (atualizacoes.length === 0) return;

  if (dryRun) {
    logInfo(`DRY RUN: ${atualizacoes.length} registro(s) seriam atualizados.`);
    return;
  }

  // Processa em lotes
  for (let i = 0; i < atualizacoes.length; i += BATCH_SIZE) {
    const batch = atualizacoes.slice(i, i + BATCH_SIZE);
    const promises = batch.map((atualizacao) =>
      supabase
        .from("publicacoes")
        .update(atualizacao.campos)
        .eq("id", atualizacao.id)
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    for (const result of results) {
      if (result.error) {
        logErro(`Erro ao atualizar: ${result.error.message}`);
      }
    }

    if (errors.length === 0) {
      logSucesso(`Lote ${Math.floor(i / BATCH_SIZE) + 1} atualizado (${batch.length} registro(s))`);
    }
  }
}

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */

interface RunOptions {
  dryRun: boolean;
  limit: number | null;
  fromId: number | null;
}

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) || null : null;
  const fromIdArg = args.find((a) => a.startsWith("--from-id="));
  const fromId = fromIdArg ? parseInt(fromIdArg.split("=")[1], 10) || null : null;
  return { dryRun, limit, fromId };
}

export async function runLimpeza(options?: Partial<RunOptions>): Promise<void> {
  const { dryRun, limit, fromId } = {
    dryRun: options?.dryRun ?? parseArgs().dryRun,
    limit: options?.limit ?? parseArgs().limit,
    fromId: options?.fromId ?? parseArgs().fromId,
  };

  console.log("\n" + "═".repeat(60));
  logDestaque("  LIMPEZA DE PUBLICAÇÕES INSTITUCIONAIS");
  console.log("═".repeat(60));

  if (dryRun) {
    logAlerta("MODO DRY RUN — NENHUMA ALTERAÇÃO SERÁ SALVA\n");
  } else {
    logInfo("MODO DE EXECUÇÃO — alterações serão salvas no banco\n");
  }

  // 1. Buscar registros
  logInfo("Buscando publicações...");

  let query = supabase
    .from("publicacoes")
    .select("*")
    .order("id", { ascending: true });

  if (fromId) {
    query = query.gte("id", fromId);
    logInfo(`Retomando a partir do ID ${fromId}`);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data: publicacoes, error } = await query;

  if (error) {
    logErro(`Erro ao buscar publicações: ${error.message}`);
    throw error;
  }

  if (!publicacoes || publicacoes.length === 0) {
    logAlerta("Nenhuma publicação encontrada.");
    return;
  }

  logSucesso(`${publicacoes.length} publicação(ões) encontrada(s)\n`);

  // 2. Processar cada publicação
  const atualizacoes: Atualizacao[] = [];

  for (const pub of publicacoes) {
    if (pub.titulo) {
      const processado = await processarPublicacao(pub as Publicacao, dryRun);
      if (processado) {
        atualizacoes.push(processado);
      }
    }
  }

  // 3. Resumo
  console.log("\n" + "─".repeat(60));
  logDestaque("  RESUMO");
  console.log("─".repeat(60));
  logInfo(`Total de publicações processadas: ${publicacoes.length}`);
  logInfo(`Registros com alterações: ${atualizacoes.length}`);
  logInfo(
    `Campos alterados: ${atualizacoes.reduce((acc, a) => acc + Object.keys(a.campos).length, 0)}`
  );

  // 4. Aplicar atualizações
  if (atualizacoes.length > 0) {
    console.log("");
    await aplicarAtualizacoes(atualizacoes, dryRun);
  } else {
    logSucesso("Nenhuma alteração necessária.");
  }

  console.log("\n" + "═".repeat(60));
  if (dryRun) {
    logDestaque("  DRY RUN CONCLUÍDO");
  } else {
    logDestaque("  LIMPEZA CONCLUÍDA");
  }
  console.log("═".repeat(60) + "\n");
}

// ─── EXECUÇÃO DIRETA ───────────────────────

const isMain =
  typeof require !== "undefined" &&
  require.main === module;

if (isMain) {
  runLimpeza().catch((err) => {
    console.error("\n💥 Erro fatal:", err);
    process.exit(1);
  });
}
