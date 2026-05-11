/**
 * Pipeline editorial híbrido (pré-IA)
 *
 * ETAPA 0 — Whitelist contextual: frases positivas que neutralizam palavras suspeitas
 * ETAPA 1 — Bloqueio duro: palavras que NUNCA são ambíguas
 * ETAPA 2 — Zona cinza: palavras suspeitas → manda pra IA decidir
 * ETAPA 3 — Score + prioridade editorial
 *
 * Economiza tokens: só chama IA pra casos ambíguos.
 */

/* ═══════════════════════════════════════════════════
   LISTAS DE PALAVRAS
   ═══════════════════════════════════════════════════ */

/**
 * WHITELIST CONTEXTUAL — frases que NEUTRALIZAM palavras suspeitas.
 * Se o texto contém uma dessas frases, NÃO entra em zona cinza nem bloqueio.
 * Economiza token da IA quando o contexto é claramente positivo.
 */
export const CONTEXTOS_POSITIVOS = [
  // Violência em contexto institucional positivo
  "combate à violência",
  "combate a violência",
  "prevenção da violência",
  "prevenção à violência",
  "campanha contra violência",
  "enfrentamento à violência",
  "contra a violência",

  // Absolvição direta (palavra única = match exato)
  "absolvido",
  "absolvição",
  "inocentado",
  "contas aprovadas",
  "aprovação de contas",
  "arquivamento favorável",

  // Mortalidade em contexto de saúde pública
  "combate à mortalidade",
  "redução da mortalidade",
  "mortalidade infantil",
  "prevenção da morte súbita",
  "redução de mortes",

  // Combate ao crime (programa institucional)
  "combate ao crime",
  "combate à criminalidade",
  "prevenção ao crime",
  "combate à corrupção",
  "combate ao tráfico",
];

/**
 * PARES DE PALAVRAS — se AMBAS aparecem no texto (não precisam estar juntas),
 * o contexto é considerado POSITIVO.
 *
 * Resolve o caso:
 *   "Denúncias contra o ex-prefeito... são arquivadas por todos os órgãos"
 *   → "denúncia" + "arquivada" = contexto positivo (inocentado)
 *
 * Cada par: [palavra_suspeita, palavra_que_neutraliza]
 */
export const CONTEXTOS_COMBINADOS: [string[], string[]][] = [
  // denúncia/denúncias + arquivada/arquivadas/arquivamento
  [
    ["denúncia", "denúncias", "denunciado"],
    ["arquivada", "arquivadas", "arquivado", "arquivamento", "arquivaram"],
  ],
  // investigação + encerrada/arquivada
  [
    ["investigação", "investigado"],
    ["encerrada", "encerrado", "arquivada", "arquivado", "concluída"],
  ],
  // improbidade + arquivada/rejeitada
  [
    ["improbidade"],
    ["arquivada", "arquivado", "rejeitada", "rejeitado", "improcedente"],
  ],
  // corrupção + combate/arquivada
  [
    ["corrupção"],
    ["combate", "arquivada", "arquivado", "rejeitada"],
  ],
  // cassação + rejeitada/negada
  [
    ["cassação"],
    ["rejeitada", "rejeitado", "negada", "negado", "arquivada", "improcedente"],
  ],
  // crime + combate/prevenção/redução
  [
    ["crime", "criminalidade"],
    ["combate", "prevenção", "redução", "queda", "diminuição"],
  ],
];/**
 * BLOQUEIO DURO — palavras que NUNCA aparecem em contexto positivo.
 * Notícia com essas palavras é descartada imediatamente, sem IA.
 */
export const PALAVRAS_BLOQUEIO_DURO: { palavra: string; categoria: string }[] =
  [
    // Criminalidade extrema — jamais institucional
    { palavra: "homicídio", categoria: "criminalidade" },
    { palavra: "feminicídio", categoria: "criminalidade" },
    { palavra: "estupro", categoria: "criminalidade" },
    { palavra: "assassinato", categoria: "criminalidade" },
    { palavra: "assassinado", categoria: "criminalidade" },
    { palavra: "assassinada", categoria: "criminalidade" },
    { palavra: "latrocínio", categoria: "criminalidade" },
    { palavra: "tráfico de drogas", categoria: "criminalidade" },
    { palavra: "acidente fatal", categoria: "criminalidade" },
    { palavra: "operação policial", categoria: "criminalidade" },

    // Tragédia / desastre
    { palavra: "desabamento", categoria: "tragedia" },
    { palavra: "desastre", categoria: "tragedia" },
  ];

/**
 * ZONA CINZA — palavras que PODEM ser negativas ou positivas dependendo do contexto.
 *
 * ⚠️  "morte" removida — gera muito ruído (mortalidade infantil, morte súbita, etc.)
 * ⚠️  "violência" removida — muitos contextos positivos (campanha, combate, prevenção)
 *     Ambas ficam somente pra IA avaliar no fluxo normal.
 *
 * Exemplos de zona cinza:
 *   "denúncias arquivadas"        → POSITIVO (inocentado)
 *   "denúncia de corrupção"       → NEGATIVO
 *   "preso por tráfico"           → NEGATIVO
 *   "expressar"                   → contém "preso" mas é POSITIVO (word boundary resolve)
 */
export const PALAVRAS_ZONA_CINZA: { palavra: string; categoria: string }[] = [
  // Criminalidade — contexto importa
  { palavra: "morre", categoria: "criminalidade" },
  { palavra: "morto", categoria: "criminalidade" },
  { palavra: "morta", categoria: "criminalidade" },
  { palavra: "crime", categoria: "criminalidade" },
  { palavra: "preso", categoria: "criminalidade" },
  { palavra: "prisão", categoria: "criminalidade" },
  { palavra: "assalto", categoria: "criminalidade" },
  { palavra: "roubo", categoria: "criminalidade" },
  { palavra: "furto", categoria: "criminalidade" },
  { palavra: "tráfico", categoria: "criminalidade" },

  // Crise administrativa — contexto importa
  { palavra: "denúncia", categoria: "crise_administrativa" },
  { palavra: "denunciado", categoria: "crise_administrativa" },
  { palavra: "investigação", categoria: "crise_administrativa" },
  { palavra: "investigado", categoria: "crise_administrativa" },
  { palavra: "irregularidade", categoria: "crise_administrativa" },
  { palavra: "afastamento", categoria: "crise_administrativa" },
  { palavra: "greve", categoria: "crise_administrativa" },
  { palavra: "colapso", categoria: "crise_administrativa" },
  { palavra: "atraso salarial", categoria: "crise_administrativa" },
  { palavra: "improbidade", categoria: "crise_administrativa" },
  { palavra: "corrupção", categoria: "crise_administrativa" },
  { palavra: "cassação", categoria: "crise_administrativa" },
  { palavra: "desvio de verba", categoria: "crise_administrativa" },
  { palavra: "desvio de recurso", categoria: "crise_administrativa" },

  // Tragédia — contexto importa
  { palavra: "tragédia", categoria: "tragedia" },
  { palavra: "enchente", categoria: "tragedia" },
  { palavra: "incêndio", categoria: "tragedia" },
  { palavra: "acidente grave", categoria: "tragedia" },
];

/** Palavras que indicam conteúdo POSITIVO institucional */
export const PALAVRAS_POSITIVAS = [
  // Gestão pública positiva
  "inauguração",
  "inaugurou",
  "inaugurada",
  "investimento",
  "investimentos",
  "melhoria",
  "melhorias",
  "capacitação",
  "capacitações",
  "programa social",
  "programas sociais",
  "entrega",
  "entregou",
  "entregaram",
  "obra entregue",
  "pavimentação",
  "reforma",
  "construção",

  // Saúde / Educação / Assistência
  "saúde",
  "educação",
  "assistência social",
  "bolsa família",
  "cras",
  "creas",
  "ubs",
  "vacinação",
  "atendimento",
  "matrícula",

  // Eventos / Esporte / Cultura
  "evento",
  "festival",
  "campeonato",
  "torneio",
  "atleta",
  "medalha",
  "cultura",
  "agricultura",
  "esporte",

  // Política positiva/neutra
  "assinatura de obras",
  "convênio",
  "convênios",
  "recurso",
  "recursos",
  "visita institucional",
  "aprovação de contas",
  "arquivamento",
  "arquivadas",
  "arquivado",
  "premiação",
  "premiações",
  "prêmio",
  "ranking",
];

/* ═══════════════════════════════════════════════════
   TIPOS
   ═══════════════════════════════════════════════════ */

export type TomConteudo =
  | "institucional_positivo"
  | "institucional_neutro"
  | "institucional_negativo";

export type Prioridade =
  | "hero"      // notícia de grande destaque (inauguração, prêmio, investimento alto)
  | "destaque"  // notícia relevante com bom tom positivo
  | "normal"    // notícia institucional padrão
  | "baixa";    // notícia menor, informativa

export type ResultadoFiltro = {
  /** true = publicar direto | false = bloquear | null = zona cinza (mandar pra IA) */
  publicar: boolean | null;
  motivo_bloqueio: string | null;
  zona_cinza: boolean;
  palavras_encontradas: string[];
  tom: TomConteudo;
  score_positivo: number;
  score_risco: number;
  prioridade: Prioridade;
};

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

/** Normaliza texto para comparação (minúsculas, mantém acentos) */
function normalizar(texto: string): string {
  return texto.toLowerCase();
}

/**
 * Verifica se uma palavra aparece como termo isolado no texto.
 * Evita falsos positivos como "expressar" matchando "preso".
 * Para termos compostos (ex: "acidente fatal"), usa includes simples.
 */
function contemPalavra(texto: string, palavra: string): boolean {
  // Termos compostos → includes simples (já são específicos o suficiente)
  if (palavra.includes(" ")) {
    return texto.includes(palavra);
  }

  // Termos simples → regex com word boundary
  // \\b não funciona bem com acentos em português, então usamos lookaround
  const escaped = palavra.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?:^|[\\s,.;:!?()\\[\\]"'—–-])${escaped}(?:$|[\\s,.;:!?()\\[\\]"'—–-])`, "i");
  return regex.test(` ${texto} `); // espaços para garantir match no início/fim
}

/**
 * Calcula score de 0-100 baseado em quantas palavras de uma lista aparecem.
 * Normalizado pelo tamanho da lista.
 */
function calcularScore(
  texto: string,
  lista: readonly string[] | { palavra: string }[]
): number {
  let matches = 0;

  for (const item of lista) {
    const palavra = typeof item === "string" ? item : item.palavra;
    if (contemPalavra(texto, palavra)) matches++;
  }

  const total = lista.length;
  if (total === 0) return 0;

  // Score de 0-100, com peso maior nos primeiros matches
  // 1 match = ~15, 2 = ~28, 3 = ~40, 5+ = 60+
  return Math.min(100, Math.round((matches / total) * 100 * 3));
}

/**
 * Determina prioridade editorial baseada nos scores.
 */
function calcularPrioridade(
  scorePositivo: number,
  scoreRisco: number,
  tom: TomConteudo
): Prioridade {
  if (tom === "institucional_negativo") return "baixa";

  // Hero: alta positividade E zero risco
  if (scorePositivo >= 60 && scoreRisco === 0) return "hero";

  // Destaque: boa positividade
  if (scorePositivo >= 30 && scoreRisco <= 5) return "destaque";

  // Normal: alguma positividade
  if (scorePositivo >= 10) return "normal";

  // Baixa: sem sinal claro
  return "baixa";
}

/* ═══════════════════════════════════════════════════
   FAST FILTER — Pipeline editorial
   ═══════════════════════════════════════════════════ */

/**
 * Filtro rápido em etapas:
 *
 * ETAPA 0 — Whitelist contextual: frases positivas neutralizam suspeitas
 * ETAPA 1 — Bloqueio duro: descarta imediatamente (sem IA)
 * ETAPA 2 — Zona cinza: marca pra IA decidir
 * ETAPA 3 — Score + prioridade editorial
 */
export function filtrarConteudo(
  titulo: string,
  conteudo: string
): ResultadoFiltro {
  const textoNormal = normalizar(`${titulo} ${conteudo}`);

  // ══════ SCORES (calculados sempre) ══════
  const scorePositivo = calcularScore(textoNormal, PALAVRAS_POSITIVAS);
  const scoreRisco = calcularScore(textoNormal, PALAVRAS_ZONA_CINZA);

  // ══════ ETAPA 0: WHITELIST CONTEXTUAL ══════
  // Se contém frase positiva conhecida OU par de palavras positivo, pula zona cinza

  // Check 1: frases exatas
  const matchFrase = CONTEXTOS_POSITIVOS.some((c) =>
    textoNormal.includes(c)
  );

  // Check 2: pares de palavras (não precisam estar juntas)
  const matchPar = CONTEXTOS_COMBINADOS.some(([suspeitas, neutralizadoras]) => {
    const temSuspeita = suspeitas.some((s) => contemPalavra(textoNormal, s));
    const temNeutralizadora = neutralizadoras.some((n) => contemPalavra(textoNormal, n));
    return temSuspeita && temNeutralizadora;
  });

  const contextoPositivo = matchFrase || matchPar;

  // ══════ ETAPA 1: BLOQUEIO DURO ══════
  // Whitelist NÃO salva de bloqueio duro (homicídio, estupro, etc.)
  for (const { palavra, categoria } of PALAVRAS_BLOQUEIO_DURO) {
    if (contemPalavra(textoNormal, palavra)) {
      return {
        publicar: false,
        motivo_bloqueio: categoria,
        zona_cinza: false,
        palavras_encontradas: [palavra],
        tom: "institucional_negativo",
        score_positivo: scorePositivo,
        score_risco: 100,
        prioridade: "baixa",
      };
    }
  }

  // ══════ ETAPA 2: ZONA CINZA ══════
  // Se whitelist bateu, PULA zona cinza (contexto já é positivo)
  if (!contextoPositivo) {
    const palavrasCinza: string[] = [];

    for (const { palavra } of PALAVRAS_ZONA_CINZA) {
      if (contemPalavra(textoNormal, palavra)) {
        palavrasCinza.push(palavra);
      }
    }

    if (palavrasCinza.length > 0) {
      return {
        publicar: null, // ← null = IA decide
        motivo_bloqueio: null,
        zona_cinza: true,
        palavras_encontradas: palavrasCinza,
        tom: "institucional_neutro", // provisório, IA vai definir
        score_positivo: scorePositivo,
        score_risco: scoreRisco,
        prioridade: "baixa", // provisório
      };
    }
  }

  // ══════ ETAPA 3: LIMPO — publicar direto ══════
  const tom: TomConteudo =
    scorePositivo >= 30
      ? "institucional_positivo"
      : "institucional_neutro";

  const prioridade = calcularPrioridade(scorePositivo, scoreRisco, tom);

  return {
    publicar: true,
    motivo_bloqueio: null,
    zona_cinza: false,
    palavras_encontradas: contextoPositivo ? ["(whitelist)"] : [],
    tom,
    score_positivo: scorePositivo,
    score_risco: scoreRisco,
    prioridade,
  };
}
