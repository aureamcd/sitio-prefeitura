// scripts/enriquecer-publicacoes-ia.ts
//
// Usa Gemini 2.0 Flash para melhorar campos de puablicações institucionais.
// Processa apenas registros com campos nulos, vazios ou claramente problemáticos.
//
// Uso:
//   npx tsx scripts/enriquecer-publicacoes-ia.ts
//
// Opções:
//   --dry-run         Apenas mostra o que seria alterado, sem modificar
//   --limit=N         Processa apenas N registros
//   --from-id=N       Continua a partir do ID especificado (retomada)
//   --delay=1000      Delay entre requisições em ms (default: 800)
//   --only-empty      Processa apenas registros com campos vazios/nulos
//   --no-pdf          Não baixa PDFs para extrair conteúdo (mais rápido)
//
// Exemplos:
//   npx tsx scripts/enriquecer-publicacoes-ia.ts --dry-run --limit=5
//   npx tsx scripts/enriquecer-publicacoes-ia.ts --only-empty
//   npx tsx scripts/enriquecer-publicacoes-ia.ts --from-id=150
//   npx tsx scripts/enriquecer-publicacoes-ia.ts
//
// Variáveis de ambiente necessárias:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   OPENROUTER_API_KEY

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Importa OCR utility do projeto (fallback para PDFs escaneados)
let extrairTextoComFallback: ((url: string, usarOCR?: boolean) => Promise<string | null>) | null = null;
try {
  // Dynamic import para evitar erro se Chrome não estiver disponível
  const ocr = require("./utils/ocr");
  extrairTextoComFallback = ocr.extrairTextoComFallback;
} catch {
  // OCR não disponível — segue sem fallback
}

dotenv.config();

/* ═══════════════════════════════════════════════
   CONFIG
   ═══════════════════════════════════════════════ */

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.0-flash-001";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const REQUEST_DELAY_MS = 800;
const MAX_RETRIES = 1;
const BATCH_UPDATE_SIZE = 50;

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

interface IaResponse {
  titulo: string;
  descricao: string;
  numero: string | null;
  ano: string | null;
  tipo: string | null;
  data_publicacao: string | null;
}

interface CampoAtualizacao {
  id: number;
  campos: Record<string, string>;
}

interface RunOptions {
  dryRun: boolean;
  limit: number | null;
  fromId: number | null;
  delayMs: number;
  onlyEmpty: boolean;
  noPdf: boolean;
}

/* ═══════════════════════════════════════════════
   CONSTANTS — Tipos reconhecidos (EXPANDIDO)
   ═══════════════════════════════════════════════ */

const TIPOS_VALIDOS = [
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
  "Lei Complementar",
  "Lei Ordinária",
  "Projeto de Lei",
  "Projeto de Lei Complementar",
  "Ofício",
  "Parecer",
  "Instrução Normativa",
  "Instrução",
  "Ato",
  "Relatório",
  "Plano",
  "Programa",
  "Termo",
  "Decisão",
  "Política",
  "Proposta Curricular",
  "Emenda",
  "Seleção",
  "Resultado",
  "Projeto",
  "Calendário",
  "Convênio",
  "Convite",
  "Declaração",
  "Notificação",
  "Comunicado",
  "Ordem de Serviço",
  "Protocolo de Intenções",
  "Regimento",
  "Regulamento",
  "Resolução Administrativa",
  "Resolução Normativa",
  "Certidão",
  "Certificado",
  "Memorando",
  "Requerimento",
] as const;

/** Siglas conhecidas que devem ser preservadas em maiúsculo */
const SIGLAS = new Set([
  "PM", "RG", "CPF", "CNPJ", "SUS", "IPVA", "IPTU", "ISS",
  "ICMS", "ITBI", "FGTS", "PIS", "COFINS", "INSS", "IBGE",
  "IPEA", "FPM", "FPE", "FUNDEB", "FNDE", "PNAE", "SAMU",
  "UBS", "ESF", "NASF", "CRAS", "CREAS", "CAPS", "SUAS",
  "SUSEPE", "DETRAN", "SEMED", "SEMUS", "PROCON", "SINE", "SAAE",
  "AGEVISA", "ANVISA", "ANS", "ANEEL", "ANATEL", "ANP", "ANA",
  "FNDE", "MEC", "PNLD", "CAE", "FUNDEB", "SEMTHAS", "SEMINFRA",
  "CMAS", "CMDCA", "CONSELHO TUTELAR", "PPAIC", "SEMCULT",
]);

/** Prefixos de artigos/preposições que devem ficar minúsculos no meio do título */
const PALAVRAS_MINUSCULAS = new Set([
  "de", "da", "do", "das", "dos", "e", "a", "o", "em", "com",
  "no", "na", "nos", "nas", "por", "para", "pelo", "pela",
  "pelos", "pelas", "à", "ao", "aos", "às",
]);

/** Meses em português para extração de data */
const MESES: Record<string, string> = {
  "janeiro": "01", "fevereiro": "02", "março": "03", "abril": "04",
  "maio": "05", "junho": "06", "julho": "07", "agosto": "08",
  "setembro": "09", "outubro": "10", "novembro": "11", "dezembro": "12",
};

/**
 * Categorias que foram usadas como se fossem tipos no banco.
 * A IA deve detectar o tipo real a partir do título.
 */
const CATEGORIAS_COMO_TIPO = new Set(["atas", "editais", "resolucoes", "diversas", "planos-municipais",
  "processos-seletivos", "relatorios", "boletim-covid", "mesa-diretora", "eleicoes",
  "regimentos", "organograma", "publicação", "pesquisa", "concessão"]);

/* ═══════════════════════════════════════════════
   ENCODING FIXES
   ═══════════════════════════════════════════════ */

/**
 * Detecta se o texto tem encoding quebrado (mojibake).
 * Verifica caracteres que indicam UTF-8 interpretado como Latin-1.
 */
function hasBrokenEncoding(text: string): boolean {
  // Padrão: caracteres na faixa Ã-Ï (0xC3-0xCF) seguidos de caracteres
  // na faixa 0xA0-0xBF — típico de UTF-8 duplamente codificado
  if (/[\u00c0-\u00c3][\u00a0-\u00bf]/.test(text)) return true;
  // Também detecta padrões como âº, â°, etc. (encoding misto)
  if (/[âãäåæçèéêëìíîïðñòóôõö][º°ª]/.test(text)) return true;
  // Detecta caracteres acentuados que parecem encoding duplicado
  if (/[ÃÕÂÊÔÎÛ][A-Z]/.test(text)) return true;
  // Detecta caracteres especiais do Latin-1 que não deveriam aparecer
  if (/[€‚ƒ„…†‡ˆ‰Š‹ŒŽ•–—˜™š›œžŸ¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿]/.test(text)) return true;
  // Detecta sequências como "‡" "‡‡" etc.
  if (/‡|†|—|–|™|�/.test(text)) return true;
  return false;
}

/**
 * Corrige mojibake: converte texto que foi armazenado como UTF-8
 * mas cujos bytes foram interpretados como Latin-1.
 *
 * Exemplo: "RelatÃ³rio" (bytes UTF-8 de "Relatório" lidos como Latin-1)
 * → reconverte os bytes para UTF-8 → "Relatório"
 */
function fixMojibake(text: string): string {
  // Primeiro tenta a correção de pares específicos (mais segura)
  let result = text;
  
  // Mapeamento de caracteres Latin-1 para o Unicode correto
  // Estes são os caracteres que aparecem quando UTF-8 é lido como Latin-1
  const latin1ToUtf8: [string, string][] = [
    // Acentos minúsculos
    ["Ã¡", "á"], ["Ã ", "à"], ["Ã¢", "â"], ["Ã£", "ã"], ["Ã¤", "ä"],
    ["Ã©", "é"], ["Ã¨", "è"], ["Ãª", "ê"], ["Ã«", "ë"],
    ["Ã­", "í"], ["Ã¬", "ì"], ["Ã®", "î"], ["Ã¯", "ï"],
    ["Ã³", "ó"], ["Ã²", "ò"], ["Ã´", "ô"], ["Ãµ", "õ"], ["Ã¶", "ö"],
    ["Ãº", "ú"], ["Ã¹", "ù"], ["Ã»", "û"], ["Ã¼", "ü"],
    ["Ã§", "ç"],
    ["Ã±", "ñ"],
    // Acentos maiúsculos
    ["Ã", "Á"], ["Ã€", "À"], ["Ã‚", "Â"], ["Ãƒ", "Ã"], ["Ã„", "Ä"],
    ["Ã‰", "É"], ["Ãˆ", "È"], ["ÃŠ", "Ê"], ["Ã‹", "Ë"],
    ["Ã", "Í"], ["ÃŒ", "Ì"], ["ÃŽ", "Î"], ["Ã�", "Ï"],
    ["Ã“", "Ó"], ["Ã’", "Ò"], ["Ã”", "Ô"], ["Ã•", "Õ"], ["Ã–", "Ö"],
    ["Ãš", "Ú"], ["Ã™", "Ù"], ["Ã›", "Û"], ["Ãœ", "Ü"],
    ["Ã‡", "Ç"],
    ["Ã‘", "Ñ"],
    // Símbolos
    ["Âº", "º"], ["Âª", "ª"], ["Â°", "°"],
    ["â€“", "—"], ["â€”", "–"], ["â€˜", "'"], ["â€™", "'"],
    ["â€œ", "\""], ["â€", "\""], ["â€¢", "•"], ["â€¦", "…"],
    ["â€°", "‰"], ["âˆ’", "−"], ["â„¢", "™"], ["Â®", "®"],
    ["Â©", "©"], ["Â±", "±"], ["Â²", "²"], ["Â³", "³"],
    ["Âµ", "µ"], ["Â¶", "¶"], ["Â·", "·"], ["Â¹", "¹"],
    ["Â»", "»"], ["Â¼", "¼"], ["Â½", "½"], ["Â¾", "¾"],
    ["Â¿", "¿"],
    // Caracteres especiais
    ["Â§", "§"], ["Â£", "£"], ["Â¥", "¥"], ["Â¢", "¢"],
    ["Â¬", "¬"], ["Â¯", "¯"], ["Â­", ""], ["Â¦", "|"],
    ["Â¨", "¨"], ["Â¸", "¸"], ["Â´", "´"], ["Â¸", "¸"],
    ["Å“", "œ"], ["Å½", "Ž"], ["Å¾", "ž"], ["Å ", "Š"],
    ["Å¡", "š"], ["Å¸", "Ÿ"], ["Å€", "Œ"],
    // "Nº" quebrado
    ["NÂº", "Nº"], ["Nâº", "Nº"], ["NÂ°", "Nº"], ["Nâ°", "Nº"],
    ["nÂº", "nº"], ["nâº", "nº"],
  ];

  for (const [garbled, fixed] of latin1ToUtf8) {
    while (result.includes(garbled)) {
      result = result.replace(garbled, fixed);
    }
  }

  // Segunda abordagem: tenta converter via TextEncoder/TextDecoder
  // Isso lida com casos não mapeados acima
  try {
    const chars = result.split("");
    const allLatin1 = chars.every((c) => c.charCodeAt(0) <= 0xFF);
    if (allLatin1 && hasBrokenEncoding(result)) {
      const bytes = new Uint8Array(chars.map((c) => c.charCodeAt(0)));
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const decoded = decoder.decode(bytes);
      if (decoded !== result && decoded.length > 0 && !decoded.includes("�")) {
        result = decoded;
      }
    }
  } catch {
    // Fallback silencioso
  }

  return result;
}

/* ═══════════════════════════════════════════════
   REGEX-BASED EXTRACTION (pré-IA)
   ═══════════════════════════════════════════════ */

/** Tipos que podem ser detectados no título (ordenados do mais específico ao mais genérico) */
const TIPOS_PATTERN = [...TIPOS_VALIDOS]
  .sort((a, b) => b.length - a.length)
  .join("|");

interface TipoDetectado {
  tipo: string | null;
}

/** Detecta o tipo de publicação a partir do título (case insensitive) */
function detectarTipo(titulo: string): TipoDetectado {
  // Tenta detectar "TIPO — complemento" ou "TIPO nº N/ANO — complemento"
  const regex = new RegExp(`^(${TIPOS_PATTERN})(?:\\s*[—–-]|\\s)`, "i");
  const match = titulo.match(regex);
  if (match) {
    const tipo = match[1];
    // Normaliza capitalização
    const encontrado = TIPOS_VALIDOS.find(
      (t) => t.toLowerCase() === tipo.toLowerCase()
    );
    if (encontrado) return { tipo: encontrado };
    // Se não encontrou exato, capitaliza primeira letra de cada palavra
    const capitalizado = tipo
      .split(" ")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
    return { tipo: capitalizado };
  }

  // Tenta detectar "TIPO —" em qualquer posição
  const regexMeio = new RegExp(
    `\\b(${TIPOS_PATTERN})\\s*[—–-]`,
    "i"
  );
  const matchMeio = titulo.match(regexMeio);
  if (matchMeio) {
    const encontrado = TIPOS_VALIDOS.find(
      (t) => t.toLowerCase() === matchMeio[1].toLowerCase()
    );
    return { tipo: encontrado || matchMeio[1] };
  }

  return { tipo: null };
}

interface NumeroAnoDetectado {
  numero: string | null;
  ano: string | null;
}

/** Extrai número e ano do título */
function extrairNumeroAno(titulo: string): NumeroAnoDetectado {
  let numero: string | null = null;
  let ano: string | null = null;

  // 1. Tenta "Nº 123/2024" ou "N. 123/2024" ou "nº 123/2024"
  const regexExplicito = /(?:N\s*[º°ª#]?\s*\.?\s*|n\s*[º°ª#]?\s*\.?\s*|N[Úú]MERO\s+)(\d{1,6})\s*[/\\]\s*((?:19|20)\d{2})/i;
  let m = titulo.match(regexExplicito);
  if (m) return { numero: m[1], ano: m[2] };

  // 2. Tenta "Nº 123 de 2024" 
  const regexDe = /(?:N\s*[º°ª#]?\s*\.?\s*|n\s*[º°ª#]?\s*\.?\s*|N[Úú]MERO\s+)(\d{1,6})\s*[,.]?\s*[dD][eE]\s+((?:19|20)\d{2})/i;
  m = titulo.match(regexDe);
  if (m) return { numero: m[1], ano: m[2] };

  // 3. Tenta "123/2024" sem prefixo N
  const regexBarra = /(\d{1,6})\s*[/]\s*((?:19|20)\d{2})/i;
  m = titulo.match(regexBarra);
  if (m) return { numero: m[1], ano: m[2] };

  // 4. Apenas número no início (formato simples)
  const soNumeroMatch = titulo.match(/(?:N\s*[º°ª#]?\s*\.?\s*|n\s*[º°ª#]?\s*\.?\s*)(\d{1,6})\b/i);
  if (soNumeroMatch) numero = soNumeroMatch[1];

  // 5. Ano solto no texto
  const anoMatch = titulo.match(/(?:^|\D)((?:19|20)\d{2})(?:\D|$)/);
  if (anoMatch && (!soNumeroMatch || anoMatch.index !== soNumeroMatch.index)) {
    // Só usa se for diferente da parte do número
    if (!numero || anoMatch[1] !== numero) {
      ano = anoMatch[1];
    }
  }

  return { numero, ano };
}

/** Converte mês em português para número */
function mesParaNumero(mes: string): string | null {
  return MESES[mes.toLowerCase()] || null;
}

/** Extrai data de publicação do título */
function extrairDataDoTitulo(titulo: string): string | null {
  const t = titulo;

  // 1. "DD de MES de AAAA" — ex: "05 de Março de 2024"
  const regexComMes = /(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)\s+de\s+((?:19|20)\d{2})/i;
  const m = t.match(regexComMes);
  if (m) {
    const dia = m[1].padStart(2, "0");
    const mes = mesParaNumero(m[2]);
    if (mes) return `${dia}/${mes}/${m[3]}`;
  }

  // 2. "DD/MM/AAAA" já no formato BR
  const brMatch = t.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (brMatch) {
    const d = parseInt(brMatch[1]);
    const m2 = parseInt(brMatch[2]);
    if (d >= 1 && d <= 31 && m2 >= 1 && m2 <= 12) {
      return brMatch[0];
    }
  }

  // 3. Formato ISO "AAAA-MM-DD"
  const isoMatch = t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  return null;
}

/* ═══════════════════════════════════════════════
   TITLE CLEANING
   ═══════════════════════════════════════════════ */

/** Limpa espaços extras, normaliza pontuação */
function limparEspacos(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/** Normaliza um título com capitalização correta */
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

/** Verifica se um texto está em CAPS LOCK excessivo */
function isExtremeCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 4) return false;
  const uppercase = letters.replace(/[^A-ZÀ-Ü]/g, "");
  return uppercase.length / letters.length > 0.65;
}

/** Corrige CAPS LOCK excessivo */
function fixExtremeCaps(text: string): string {
  if (!isExtremeCaps(text)) return text;
  return capitalizarTitulo(text);
}

/** Aplica todas as correções de título (encoding + caps + espaços) */
function limparTitulo(titulo: string): string {
  let t = fixMojibake(titulo);
  t = limparEspacos(t);
  t = fixExtremeCaps(t);
  return t;
}

/* ═══════════════════════════════════════════════
   PDF EXTRACTION
   ═══════════════════════════════════════════════ */

/**
 * Extrai datas em formato BR (DD/MM/AAAA) de um texto usando regex.
 * Retorna a primeira data válida encontrada.
 */
function extrairDataDoTexto(texto: string): string | null {
  // 1. "DD de MÊS de AAAA" — ex: "05 de Março de 2024"
  const regexMes = /(\d{1,2})\s+de\s+([a-zA-ZçÇ]+)\s+de\s+((?:19|20)\d{2})/i;
  const m = texto.match(regexMes);
  if (m) {
    const dia = m[1].padStart(2, "0");
    const mesStr = m[2].toLowerCase();
    const mes = MESES[mesStr];
    if (mes && parseInt(dia) >= 1 && parseInt(dia) <= 31) {
      return `${dia}/${mes}/${m[3]}`;
    }
  }

  // 2. "DD/MM/AAAA"
  const regexBR = /\b(\d{2})\/(\d{2})\/(\d{4})\b/g;
  let match;
  while ((match = regexBR.exec(texto)) !== null) {
    const d = parseInt(match[1]);
    const mm = parseInt(match[2]);
    if (d >= 1 && d <= 31 && mm >= 1 && mm <= 12) {
      return match[0];
    }
  }

  // 3. "AAAA-MM-DD" (ISO)
  const regexISO = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  while ((match = regexISO.exec(texto)) !== null) {
    const mm = parseInt(match[2]);
    const d = parseInt(match[3]);
    if (d >= 1 && d <= 31 && mm >= 1 && mm <= 12) {
      return `${match[3]}/${match[2]}/${match[1]}`;
    }
  }

  // 4. "DD.MM.AAAA" ou "DD-MM-AAAA" (separadores não padronizados)
  const regexSep = /\b(\d{2})[.\-](\d{2})[.\-](\d{4})\b/g;
  while ((match = regexSep.exec(texto)) !== null) {
    const d = parseInt(match[1]);
    const mm = parseInt(match[2]);
    if (d >= 1 && d <= 31 && mm >= 1 && mm <= 12) {
      return `${match[1]}/${match[2]}/${match[3]}`;
    }
  }

  return null;
}

/**
 * Baixa um PDF de uma URL e extrai o texto.
 * Tenta pdf-parse primeiro, depois OCR como fallback.
 * Também extrai data do texto localmente via regex.
 */
async function extrairTextoDoPdf(url: string): Promise<{ texto: string | null; dataExtraida: string | null }> {
  const resultado = { texto: null as string | null, dataExtraida: null as string | null };

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return resultado;

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number(contentLength) > 20_000_000) return resultado;

    // Tenta pdf-parse
    let texto: string | null = null;
    try {
      const buffer = Buffer.from(await res.arrayBuffer());
      const pdfParse = require("pdf-parse");
      const pdf = await pdfParse(buffer);
      texto = ((pdf.text as string) || "").trim();
    } catch {
      texto = null;
    }

    // Se pdf-parse não extraiu texto, tenta OCR
    if (!texto || texto.length < 50) {
      if (extrairTextoComFallback) {
        texto = await extrairTextoComFallback(url, true);
      }
    }

    if (texto) {
      resultado.texto = texto.slice(0, 4000);
      // Extrai data do texto via regex (rápido, não precisa de IA)
      resultado.dataExtraida = extrairDataDoTexto(texto);
    }

    return resultado;
  } catch {
    return resultado;
  }
}

/* ═══════════════════════════════════════════════
   UTILITY HELPERS
   ═══════════════════════════════════════════════ */

function isVazio(valor: string | null | undefined): boolean {
  return valor === null || valor === undefined || valor.trim() === "";
}

/** Verifica se um tipo é na verdade uma categoria (ex: "Diversas", "Atas", etc.) */
function isTipoCategorico(tipo: string | null | undefined): boolean {
  if (!tipo || isVazio(tipo)) return false;
  return CATEGORIAS_COMO_TIPO.has(tipo.toLowerCase().trim());
}

/** Determina se um campo está "ruim" e precisa de melhoria */
function campoPrecisaMelhoria(valor: string | null): boolean {
  if (isVazio(valor)) return true;
  return hasBrokenEncoding(valor!) || isExtremeCaps(valor!);
}

/** Normaliza valor de data para DD/MM/AAAA (formato BR) */
function normalizarData(data: string | null): string | null {
  if (!data) return null;

  // Já está no formato ISO (YYYY-MM-DD)
  const isoMatch = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  // Já está no formato BR (DD/MM/AAAA)
  const brMatch = data.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const d = parseInt(brMatch[1]);
    const m = parseInt(brMatch[2]);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) return data;
  }

  // Tenta extrair data solta (DD-MM-AAAA, DD.MM.AAAA)
  const anyMatch = data.match(/(\d{2})\D(\d{2})\D(\d{4})/);
  if (anyMatch) {
    const d = parseInt(anyMatch[1]);
    const m = parseInt(anyMatch[2]);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${anyMatch[1]}/${anyMatch[2]}/${anyMatch[3]}`;
    }
  }

  return null;
}

/* ═══════════════════════════════════════════════
   LOGGING
   ═══════════════════════════════════════════════ */

const LOG = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function logInfo(msg: string): void { console.log(`${LOG.blue}ℹ${LOG.reset} ${msg}`); }
function logSucesso(msg: string): void { console.log(`${LOG.green}✔${LOG.reset} ${msg}`); }
function logAlerta(msg: string): void { console.log(`${LOG.yellow}⚠${LOG.reset} ${msg}`); }
function logErro(msg: string): void { console.log(`${LOG.red}✘${LOG.reset} ${msg}`); }
function logDestaque(msg: string): void { console.log(`${LOG.magenta}${LOG.bright}${msg}${LOG.reset}`); }

function logCampo(campo: string, antes: string, depois: string, origem: string = "ia"): void {
  const prefix = origem === "regex" ? "🔧" : "🤖";
  const antesShort = antes.length > 70 ? antes.slice(0, 70) + "..." : antes;
  const depoisShort = depois.length > 70 ? depois.slice(0, 70) + "..." : depois;
  console.log(
    `  ${prefix} ${LOG.cyan}${campo}:${LOG.reset}`,
    `"${LOG.red}${antesShort}${LOG.reset}"`,
    `→`,
    `"${LOG.green}${depoisShort}${LOG.reset}"`
  );
}

/* ═══════════════════════════════════════════════
   PROMPTS
   ═══════════════════════════════════════════════ */

const SYSTEM_PROMPT = `Você é um assistente especializado em dados institucionais públicos brasileiros.

REGRAS:
- NÃO invente informações
- NÃO altere significado jurídico
- Preserve números e datas oficiais
- Se não tiver certeza, retorne null
- Corrija apenas encoding (mojibake), CAPS LOCK e padronização
- Para tipo: use o tipo correto em português (ex: "Lei", "Decreto", "Portaria", "Ofício", "Parecer", "Edital", "Projeto de Lei", "Contrato", "Ata", "Resolução", "Instrução Normativa", "Termo", "Relatório", "Plano")
- Para data_publicacao: se encontrar data explícita no texto, devolva no formato DD/MM/AAAA
- Responda SOMENTE JSON válido, sem texto extra`;

/**
 * Monta o prompt de usuário com os dados da publicação.
 * Inclui o texto extraído do PDF quando disponível.
 */
function montarPromptUsuario(pub: Publicacao, textoPdf?: string | null): string {
  const campos: string[] = [];

  campos.push(`titulo: ${pub.titulo ?? "(vazio)"}`);
  campos.push(`descricao: ${pub.descricao ?? "(vazio)"}`);
  campos.push(`numero: ${pub.numero ?? "(vazio)"}`);
  campos.push(`ano: ${pub.ano ?? "(vazio)"}`);
  campos.push(`tipo: ${pub.tipo ?? "(vazio)"}`);
  campos.push(`data_publicacao: ${pub.data_publicacao ?? "(vazio)"}`);

  if (textoPdf) {
    campos.push(`\n--- CONTEÚDO DO PDF ---\n${textoPdf.slice(0, 3000)}`);
  }

  return `Dados atuais da publicação:\n${campos.join("\n")}\n\nCorrija e padronize os campos problemáticos. Retorne APENAS JSON:\n{"titulo":"","descricao":"","numero":null,"ano":null,"tipo":null,"data_publicacao":null}`;
}

/* ═══════════════════════════════════════════════
   AI CALL
   ═══════════════════════════════════════════════ */

/** Chama a API do OpenRouter (OpenAI-compatible) com retry */
async function chamarGemini(prompt: string): Promise<IaResponse | null> {
  if (!OPENROUTER_API_KEY) {
    logErro("OPENROUTER_API_KEY não configurada");
    return null;
  }

  for (let tentativa = 0; tentativa <= MAX_RETRIES; tentativa++) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 200)}`);
      }

      const data = await response.json();
      const text: string | undefined = data?.choices?.[0]?.message?.content;

      if (!text) throw new Error("Resposta vazia da Gemini");

      const parsed = JSON.parse(text) as IaResponse;
      return validarResposta(parsed);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (tentativa < MAX_RETRIES) {
        logAlerta(`Tentativa ${tentativa + 1} falhou: ${msg} — retentando...`);
        await delay(REQUEST_DELAY_MS * 2);
      } else {
        logErro(`Gemini falhou após ${MAX_RETRIES + 1} tentativa(s): ${msg}`);
      }
    }
  }

  return null;
}

/** Valida e sanitiza a resposta da IA */
function validarResposta(res: IaResponse): IaResponse {
  const validado: IaResponse = {
    titulo: typeof res.titulo === "string" ? res.titulo.trim() : "",
    descricao: typeof res.descricao === "string" ? res.descricao.trim() : "",
    numero: typeof res.numero === "string" ? res.numero.trim() : null,
    ano: typeof res.ano === "string" ? res.ano.trim() : null,
    tipo: typeof res.tipo === "string" ? res.tipo.trim() : null,
    data_publicacao: typeof res.data_publicacao === "string" ? res.data_publicacao.trim() : null,
  };

  // Valida tipo contra lista conhecida (aceita o que não estiver na lista também, mas tenta normalizar)
  if (validado.tipo) {
    // Tenta encontrar na lista
    const tipoValido = TIPOS_VALIDOS.find(
      (t) => t.toLowerCase() === validado.tipo!.toLowerCase()
    );
    if (tipoValido) {
      validado.tipo = tipoValido;
    } else {
      // Normaliza capitalização da primeira letra
      validado.tipo = validado.tipo
        .split(" ")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(" ");
    }
  }

  // Valida ano
  if (validado.ano) {
    const anoMatch = validado.ano.match(/(\d{4})/);
    validado.ano = anoMatch ? anoMatch[1] : null;
  }

  // Valida numero (só dígitos)
  if (validado.numero) {
    validado.numero = validado.numero.replace(/\D/g, "");
    if (!validado.numero) validado.numero = null;
  }

  return validado;
}

/** Delay helper */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ═══════════════════════════════════════════════
   COMPARISON — O QUE REALMENTE MUDOU?
   ═══════════════════════════════════════════════ */

function calcularDiferencas(
  pub: Publicacao,
  ia: IaResponse
): Record<string, string> {
  const updates: Record<string, string> = {};

  // Título: atualiza se estava problemático E a IA mudou algo
  if (campoPrecisaMelhoria(pub.titulo) && !isVazio(ia.titulo) && ia.titulo !== pub.titulo) {
    updates.titulo = ia.titulo;
  }

  // Descrição: atualiza se estava problemática E IA mudou algo
  if (campoPrecisaMelhoria(pub.descricao) && !isVazio(ia.descricao) && ia.descricao !== pub.descricao) {
    updates.descricao = ia.descricao;
  }

  // Tipo: atualiza se estava vazio, problemático, ou é categoria (Diversas, Atas, Editais, etc.)
  if ((campoPrecisaMelhoria(pub.tipo) || isTipoCategorico(pub.tipo)) && ia.tipo && ia.tipo !== pub.tipo) {
    updates.tipo = ia.tipo;
  }

  // Número: atualiza se estava vazio E IA retornou algo
  if (campoPrecisaMelhoria(pub.numero) && ia.numero && ia.numero !== pub.numero) {
    updates.numero = ia.numero;
  }

  // Ano: atualiza se estava vazio E IA retornou algo
  if (campoPrecisaMelhoria(pub.ano) && ia.ano && ia.ano !== pub.ano) {
    updates.ano = ia.ano;
  }

  // Data: atualiza se estava vazia e IA retornou data válida
  if (campoPrecisaMelhoria(pub.data_publicacao) && !isVazio(ia.data_publicacao)) {
    const dataNorm = normalizarData(ia.data_publicacao);
    if (dataNorm && dataNorm !== pub.data_publicacao) {
      updates.data_publicacao = dataNorm;
    }
  }

  return updates;
}

/* ═══════════════════════════════════════════════
   SUPABASE UPDATE
   ═══════════════════════════════════════════════ */

async function aplicarAtualizacoes(
  atualizacoes: CampoAtualizacao[],
  dryRun: boolean
): Promise<void> {
  if (atualizacoes.length === 0) return;

  if (dryRun) {
    logInfo(`DRY RUN: ${atualizacoes.length} registro(s) seriam atualizados.`);
    return;
  }

  for (let i = 0; i < atualizacoes.length; i += BATCH_UPDATE_SIZE) {
    const batch = atualizacoes.slice(i, i + BATCH_UPDATE_SIZE);
    const promises = batch.map((a) =>
      supabase.from("publicacoes").update(a.campos).eq("id", a.id)
    );

    const results = await Promise.all(promises);
    const erros = results.filter((r) => r.error);

    for (const r of results) {
      if (r.error) logErro(`Erro ao atualizar #${r.status}: ${r.error.message}`);
    }

    if (erros.length === 0) {
      logSucesso(`Lote ${Math.floor(i / BATCH_UPDATE_SIZE) + 1} (${batch.length} registro(s))`);
    }
  }
}

/* ═══════════════════════════════════════════════
   PROCESSAMENTO PRÉ-IA (REGEX)
   ═══════════════════════════════════════════════ */

/**
 * Tenta extrair campos usando REGEX antes de chamar a IA.
 * Retorna os campos que puderam ser determinados com segurança.
 */
function extrairCamposPorRegex(pub: Publicacao): Record<string, string> {
  const updates: Record<string, string> = {};

  if (!pub.titulo) return updates;

  // 1. Corrige encoding do título
  const tituloLimpo = limparTitulo(pub.titulo);

  // 2. Detecta tipo — mesmo se já existir, corrige se for categoria ao invés de tipo
  const tipoEhCategoria = isTipoCategorico(pub.tipo);
  
  if (isVazio(pub.tipo) || tipoEhCategoria) {
    const { tipo } = detectarTipo(tituloLimpo);
    if (tipo && (!pub.tipo || tipo !== pub.tipo)) {
      updates.tipo = tipo;
    }
  }

  // 3. Extrai número e ano
  const { numero, ano } = extrairNumeroAno(tituloLimpo);
  if (isVazio(pub.numero) && numero) {
    updates.numero = numero;
  }
  if (isVazio(pub.ano) && ano) {
    updates.ano = ano;
  }

  // 4. Extrai data do título (se o título contém data explícita)
  if (isVazio(pub.data_publicacao)) {
    const data = extrairDataDoTitulo(tituloLimpo);
    if (data) {
      updates.data_publicacao = data;
    }
  }

  // 5. Corrige título com encoding quebrado
  if (hasBrokenEncoding(pub.titulo) && tituloLimpo !== pub.titulo) {
    updates.titulo = tituloLimpo;
  }

  return updates;
}

/* ═══════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════ */

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    limit: (() => {
      const a = args.find((a) => a.startsWith("--limit="));
      return a ? parseInt(a.split("=")[1], 10) || null : null;
    })(),
    fromId: (() => {
      const a = args.find((a) => a.startsWith("--from-id="));
      return a ? parseInt(a.split("=")[1], 10) || null : null;
    })(),
    delayMs: (() => {
      const a = args.find((a) => a.startsWith("--delay="));
      return a ? parseInt(a.split("=")[1], 10) || REQUEST_DELAY_MS : REQUEST_DELAY_MS;
    })(),
    onlyEmpty: args.includes("--only-empty"),
    noPdf: args.includes("--no-pdf"),
  };
}

export async function runEnriquecer(options?: Partial<RunOptions>): Promise<void> {
  const cfg = { ...parseArgs(), ...options };

  console.log("\n" + "═".repeat(60));
  logDestaque("  ENRIQUECER PUBLICAÇÕES COM IA");
  console.log("═".repeat(60));

  if (!OPENROUTER_API_KEY) {
    logErro("Variável OPENROUTER_API_KEY não encontrada no ambiente.");
    logInfo("Defina OPENROUTER_API_KEY no .env.local ou exporte no terminal.");
    return;
  }

  if (cfg.dryRun) logAlerta("MODO DRY RUN — NENHUMA ALTERAÇÃO SERÁ SALVA\n");
  else logInfo("MODO DE EXECUÇÃO — alterações serão salvas no banco\n");

  // 1. Buscar registros
  logInfo("Buscando publicações...");

  let query = supabase
    .from("publicacoes")
    .select("id, titulo, descricao, numero, ano, tipo, data_publicacao, arquivo_r2_url")
    .order("id", { ascending: true });

  if (cfg.fromId) {
    query = query.gte("id", cfg.fromId);
    logInfo(`Retomando a partir do ID ${cfg.fromId}`);
  }

  if (cfg.limit) query = query.limit(cfg.limit);

  const { data: registros, error } = await query;

  if (error) {
    logErro(`Erro ao buscar: ${error.message}`);
    throw error;
  }

  if (!registros || registros.length === 0) {
    logAlerta("Nenhuma publicação encontrada.");
    return;
  }

  logSucesso(`${registros.length} publicação(ões) encontrada(s)`);

  // 2. Filtrar registros que precisam de correção
  const aProcessar = cfg.onlyEmpty
    ? registros.filter(
        (r: any) =>
          isVazio(r.titulo) || isVazio(r.descricao) || isVazio(r.tipo) ||
          isVazio(r.numero) || isVazio(r.ano) || isVazio(r.data_publicacao)
      )
    : registros.filter(
        (r: any) =>
          campoPrecisaMelhoria(r.titulo) || campoPrecisaMelhoria(r.descricao) ||
          campoPrecisaMelhoria(r.tipo) || campoPrecisaMelhoria(r.numero) ||
          campoPrecisaMelhoria(r.ano) || campoPrecisaMelhoria(r.data_publicacao) ||
          isTipoCategorico(r.tipo)
      );

  if (aProcessar.length === 0) {
    logSucesso("Nenhum registro precisa de melhoria.");
    return;
  }

  logInfo(`${aProcessar.length} registro(s) precisam de melhoria\n`);

  // 3. PROCESSAMENTO PRÉ-IA (REGEX)
  //    Primeiro tenta extrair o máximo possível via regex, sem gastar tokens
  logDestaque("  ETAPA 1: Extração via REGEX");
  console.log("─".repeat(60));

  const regexUpdates: CampoAtualizacao[] = [];
  const paraIa: any[] = [];

  for (const raw of aProcessar) {
    const pub = raw as Publicacao;
    const regexDiffs = extrairCamposPorRegex(pub);

    if (Object.keys(regexDiffs).length > 0) {
      console.log(`\n${LOG.cyan}▸ Publicação #${pub.id}${LOG.reset}`);
      for (const [campo, valor] of Object.entries(regexDiffs)) {
        const original = (pub as any)[campo] ?? "(vazio)";
        logCampo(campo, String(original), String(valor), "regex");
      }
      regexUpdates.push({ id: pub.id, campos: regexDiffs });
    }

    // Verifica se ainda precisa de IA (campos que o regex não conseguiu resolver)
    const pubAtualizada = { ...pub, ...regexDiffs };
    const aindaPrecisa =
      campoPrecisaMelhoria(pubAtualizada.titulo) ||
      campoPrecisaMelhoria(pubAtualizada.descricao) ||
      campoPrecisaMelhoria(pubAtualizada.tipo) ||
      campoPrecisaMelhoria(pubAtualizada.numero) ||
      campoPrecisaMelhoria(pubAtualizada.ano) ||
      isVazio(pubAtualizada.data_publicacao) ||
      isVazio(pubAtualizada.numero) ||
      isVazio(pubAtualizada.ano);

    if (aindaPrecisa) {
      // Passa a versão atualizada (com regex aplicado) para a IA
      // para que ela veja o título já corrigido
      paraIa.push(pubAtualizada);
    }
  }

  // Aplica atualizações do regex
  if (regexUpdates.length > 0) {
    console.log("\n" + "─".repeat(40));
    logInfo(`Aplicando ${regexUpdates.length} atualização(ões) via REGEX...`);
    await aplicarAtualizacoes(regexUpdates, cfg.dryRun);
  } else {
    logInfo("Nenhuma atualização via REGEX necessária.");
  }

  // 4. PROCESSAMENTO COM IA
  if (paraIa.length === 0) {
    logSucesso("\n✔ Todos os campos foram resolvidos via REGEX. IA não necessária.");
    console.log("\n" + "═".repeat(60));
    logDestaque(cfg.dryRun ? "  DRY RUN CONCLUÍDO" : "  ENRIQUECIMENTO CONCLUÍDO");
    console.log("═".repeat(60) + "\n");
    return;
  }

  console.log("\n" + "─".repeat(60));
  logDestaque("  ETAPA 2: Enriquecimento via IA");
  logInfo(`${paraIa.length} registro(s) ainda precisam de IA`);
  console.log("─".repeat(60));

  const iaUpdates: CampoAtualizacao[] = [];
  let processados = 0;
  let errosIa = 0;
  let pdfsBaixados = 0;

  for (const raw of paraIa) {
    const pub = raw as Publicacao;

    logInfo(`[${processados + 1}/${paraIa.length}] Publicação #${pub.id}`);

    // Baixa PDF se disponível e se tiver data faltando
    let textoPdf: string | null = null;
    let dataDoPdf: string | null = null;
    if (!cfg.noPdf && pub.arquivo_r2_url && isVazio(pub.data_publicacao)) {
      const pdfResult = await extrairTextoDoPdf(pub.arquivo_r2_url);
      textoPdf = pdfResult.texto;
      dataDoPdf = pdfResult.dataExtraida;
      if (textoPdf) pdfsBaixados++;
    }

    // Se o regex já extraiu data do PDF, aplica mas CONTINUA para IA
    // (outros campos como tipo/descricao podem precisar de correção)
    if (dataDoPdf && isVazio(pub.data_publicacao)) {
      console.log(`  📅 Data extraída do PDF via regex: ${dataDoPdf}`);
      iaUpdates.push({ id: pub.id, campos: { data_publicacao: dataDoPdf } });
      // Não dá continue — IA ainda pode corrigir outros campos
    }

    const prompt = montarPromptUsuario(pub, textoPdf);
    const resposta = await chamarGemini(prompt);

    if (!resposta) {
      errosIa++;
      logAlerta(`  IA não retornou dados para #${pub.id}`);
      continue;
    }

    const diffs = calcularDiferencas(pub, resposta);

    if (Object.keys(diffs).length === 0) {
      processados++;
      continue;
    }

    // Mostra diferenças
    console.log(`\n${LOG.cyan}▸ Publicação #${pub.id}${LOG.reset}`);
    for (const [campo, valor] of Object.entries(diffs)) {
      const original = (pub as any)[campo] ?? "(vazio)";
      logCampo(campo, String(original), String(valor), "ia");
    }

    iaUpdates.push({ id: pub.id, campos: diffs });
    processados++;

    // Delay entre requisições
    if (processados < paraIa.length) {
      await delay(cfg.delayMs);
    }
  }

  // Aplica atualizações da IA
  if (iaUpdates.length > 0) {
    console.log("\n" + "─".repeat(40));
    logInfo(`Aplicando ${iaUpdates.length} atualização(ões) via IA...`);
    await aplicarAtualizacoes(iaUpdates, cfg.dryRun);
  }

  // 5. RESUMO FINAL
  console.log("\n" + "═".repeat(60));
  logDestaque("  RESUMO FINAL");
  console.log("═".repeat(60));
  logInfo(`Registros analisados: ${aProcessar.length}`);
  logInfo(`Atualizações via REGEX: ${regexUpdates.length}`);
  logInfo(`Atualizações via IA: ${iaUpdates.length}`);
  logInfo(`PDFs baixados para análise: ${pdfsBaixados}`);
  logInfo(`Erros de IA: ${errosIa}`);

  const totalCamposRegex = regexUpdates.reduce((a, b) => a + Object.keys(b.campos).length, 0);
  const totalCamposIa = iaUpdates.reduce((a, b) => a + Object.keys(b.campos).length, 0);
  logInfo(`Campos alterados (regex): ${totalCamposRegex}`);
  logInfo(`Campos alterados (IA): ${totalCamposIa}`);
  logInfo(`Total de campos alterados: ${totalCamposRegex + totalCamposIa}`);

  console.log("\n" + "═".repeat(60));
  logDestaque(cfg.dryRun ? "  DRY RUN CONCLUÍDO" : "  ENRIQUECIMENTO CONCLUÍDO");
  console.log("═".repeat(60) + "\n");
}

// ─── EXECUÇÃO DIRETA ───────────────────────

const isMain =
  typeof require !== "undefined" &&
  require.main === module;

if (isMain) {
  if (!OPENROUTER_API_KEY) {
    console.error("\n💥 Erro: OPENROUTER_API_KEY não configurada");
    console.log("  Adicione no .env.local:");
    console.log('  OPENROUTER_API_KEY="sua-chave-aqui"');
    process.exit(1);
  }
  runEnriquecer().catch((err) => {
    console.error("\n💥 Erro fatal:", err);
    process.exit(1);
  });
}
