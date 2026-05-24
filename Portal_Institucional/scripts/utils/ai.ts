import "dotenv/config";
import type { TomConteudo, Prioridade } from "./filtro-conteudo";

export type AnaliseIA = {
  relevante: boolean;
  publicar: boolean;
  motivo_bloqueio: string | null;
  tom: TomConteudo;
  score_positivo: number;
  score_risco: number;
  prioridade: Prioridade;
  categorias: string[];
  resumo: string;
  imagem_posicao: "cover_center" | "cover_top" | "cover_face";
};

const CATEGORIAS_VALIDAS = [
  "saude",
  "educacao",
  "obras",
  "assistencia",
  "esporte",
  "licitacao",
];

const POSICOES_VALIDAS = ["cover_center", "cover_top", "cover_face"];

/** Remove HTML tags e normaliza espaços para passar texto limpo à IA */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Heurística de fallback para imagem_posicao baseada em palavras-chave.
 * Usada quando a IA falha ou retorna posição inválida.
 */
function inferirPosicaoHeuristica(
  titulo: string,
  conteudo: string
): AnaliseIA["imagem_posicao"] {
  const texto = `${titulo} ${conteudo}`.toLowerCase();

  // Palavras que indicam foco em PESSOAS / ROSTOS
  const palavrasFace = [
    "prefeito",
    "secretário",
    "secretária",
    "vereador",
    "atleta",
    "aluno",
    "aluna",
    "criança",
    "estudante",
    "professor",
    "professora",
    "médico",
    "médica",
    "enfermeiro",
    "enfermeira",
    "entregou",
    "entrega",
    "recebeu",
    "receberam",
    "discurso",
    "palestra",
    "homenagem",
    "prêmio",
    "premiação",
    "campeão",
    "campeã",
    "formatura",
    "posse",
    "inaugurou",
    "visita",
    "reunião",
    "assinatura",
    "assinam",
  ];

  // Palavras que indicam foco em OBRAS / INFRAESTRUTURA / ESPAÇOS ABERTOS
  const palavrasTop = [
    "obra",
    "obras",
    "construção",
    "reforma",
    "pavimentação",
    "asfalto",
    "calçada",
    "rua",
    "avenida",
    "quadra",
    "campo",
    "praça",
    "parque",
    "ginásio",
    "escola",
    "ubs",
    "posto de saúde",
    "hospital",
    "infraestrutura",
    "saneamento",
    "drenagem",
    "ponte",
    "viaduto",
    "paisagem",
    "evento ao ar livre",
    "torneio",
    "campeonato",
    "festival",
    "feira",
    "show",
    "inauguração",
  ];

  const temFace = palavrasFace.some((p) => texto.includes(p));
  const temTop = palavrasTop.some((p) => texto.includes(p));

  if (temFace && !temTop) return "cover_face";
  if (temTop && !temFace) return "cover_top";
  if (temFace && temTop) return "cover_face"; // pessoas têm prioridade
  return "cover_center";
}

export async function analisarNoticiaIA(
  titulo: string,
  conteudo: string
): Promise<AnaliseIA> {
  const conteudoLimpo = stripHtml(conteudo).slice(0, 1800);

  const prompt = `Você é um sistema de curadoria de notícias institucionais do município de Padre Marcos-PI.

Retorne APENAS JSON puro, sem texto antes ou depois, sem markdown:

{
  "relevante": boolean,
  "publicar": boolean,
  "motivo_bloqueio": string | null,
  "tom": "institucional_positivo" | "institucional_neutro" | "institucional_negativo",
  "score_positivo": number (0-100),
  "score_risco": number (0-100),
  "prioridade": "hero" | "destaque" | "normal" | "baixa",
  "categorias": string[],
  "resumo": string,
  "imagem_posicao": string
}

═══ REGRAS DE RELEVÂNCIA ═══
Relevante = notícia sobre Padre Marcos ou Padre Marcus, incluindo:
- ações da prefeitura, secretarias ou câmara
- saúde, educação, obras, assistência social
- esportes, torneios, atletas do município
- projetos sociais, culturais ou comunitários locais
NÃO é relevante: crimes, homicídios, roubos, prisões, acidentes fatais

═══ CONTEXTO IMPORTA (MUITO IMPORTANTE) ═══
Palavras negativas NÃO significam notícia negativa quando o CONTEXTO é de resolução positiva:
✅ PUBLICAR: "denúncias ARQUIVADAS" → ex-prefeito inocentado = POSITIVO
✅ PUBLICAR: "investigação ENCERRADA sem irregularidades" = POSITIVO  
✅ PUBLICAR: "combate à VIOLÊNCIA" = programa social = POSITIVO
✅ PUBLICAR: "improbidade REJEITADA" = absolvição = POSITIVO
✅ PUBLICAR: "cassação NEGADA" = gestor mantido = POSITIVO
❌ BLOQUEAR: "prefeito DENUNCIADO por corrupção" = crise = NEGATIVO
❌ BLOQUEAR: "investigação ABERTA contra secretário" = NEGATIVO

REGRA: se o texto contém palavras como "arquivada", "encerrada", "absolvido", "inocentado", "rejeitada", "improcedente", "combate à", "prevenção", o tom é POSITIVO ou NEUTRO, NUNCA negativo.

═══ TOM DA NOTÍCIA ═══
"institucional_positivo" → gestão positiva, obras, inaugurações, entregas, investimentos, capacitações, convênios, premiações, rankings positivos, arquivamento favorável, aprovação de contas, denúncias arquivadas, absolvição, inocentação
"institucional_neutro" → anúncios oficiais, comunicados, licitações, editais, visitas, assinaturas de convênio
"institucional_negativo" → criminalidade ativa, violência em curso, crise administrativa real, denúncia EM ANDAMENTO, investigação ABERTA, corrupção confirmada, tragédia, desastre

═══ PUBLICAR / BLOQUEIO ═══
publicar = true → conteúdo institucional positivo ou neutro, SEM risco reputacional. INCLUI notícias de arquivamento/absolvição/inocentação.
publicar = false → conteúdo negativo ATIVO (criminalidade em curso, crise real, violência, risco reputacional)
motivo_bloqueio = null quando publicar=true, senão usar: "criminalidade", "crise_administrativa", "tragedia", "risco_reputacional"

═══ SCORES ═══
score_positivo = de 0 a 100. Quanto mais positiva/institucional a notícia, mais alto.
score_risco = de 0 a 100. Quanto mais risco reputacional, mais alto.
Exemplo inauguração de escola: score_positivo=85, score_risco=2
Exemplo comunicado genérico: score_positivo=30, score_risco=0
Exemplo denúncia arquivada: score_positivo=60, score_risco=25

═══ PRIORIDADE EDITORIAL ═══
"hero" → notícia de grande impacto positivo (inauguração, prêmio estadual/nacional, investimento alto)
"destaque" → notícia relevante com bom tom positivo
"normal" → notícia institucional padrão, informativa
"baixa" → notícia menor, rotineira, sem destaque especial

═══ CATEGORIAS PERMITIDAS ═══
saude, educacao, obras, assistencia, esporte, licitacao
(pode retornar mais de uma)

═══ RESUMO ═══
Máximo 2 frases. Tom institucional e claro.

═══ POSICIONAMENTO DA IMAGEM ═══
Analise o título e conteúdo para escolher ONDE a imagem provavelmente foca:

"cover_face" → use quando a notícia é sobre PESSOAS em destaque:
  ✅ Prefeito entrega cestas básicas
  ✅ Atleta conquista medalha
  ✅ Formatura de alunos
  ✅ Secretária visita escola
  ✅ Posse de servidores
  ✅ Entrega de prêmio, homenagem, discurso

"cover_top" → use quando a notícia é sobre LUGARES ou OBRAS:
  ✅ Pavimentação de rua concluída
  ✅ Reforma da quadra esportiva
  ✅ Inauguração do posto de saúde
  ✅ Campeonato de futebol (foco no campo)
  ✅ Festival ou feira ao ar livre
  ✅ Construção de escola ou creche

"cover_center" → use apenas para conteúdo genérico sem foco claro:
  ✅ Comunicado ou aviso
  ✅ Licitação ou edital
  ✅ Notícia sem imagem relevante identificada

═══ SE NÃO FOR RELEVANTE ═══
{ "relevante": false, "publicar": false, "motivo_bloqueio": "irrelevante", "tom": "institucional_neutro", "score_positivo": 0, "score_risco": 0, "prioridade": "baixa", "categorias": [], "resumo": "", "imagem_posicao": "cover_center" }

Título: ${titulo}

Conteúdo:
${conteudoLimpo}`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.1-8b-instruct",
          temperature: 0.1,
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) throw new Error("Resposta vazia da IA");

    // Extrai o JSON — tenta fechar se vier truncado
    let jsonStr = (text.match(/\{[\s\S]*\}/) ?? [text])[0];
    if (!jsonStr.trimEnd().endsWith("}")) jsonStr += "}";

    if (!jsonStr.includes("relevante")) {
      throw new Error("JSON não encontrado na resposta da IA");
    }

    const parsed = JSON.parse(jsonStr);

    const categorias = Array.isArray(parsed.categorias)
      ? parsed.categorias.filter((c: string) =>
          CATEGORIAS_VALIDAS.includes(c)
        )
      : [];

    // Valida posição — se inválida, usa heurística local
    const imagem_posicao = POSICOES_VALIDAS.includes(parsed.imagem_posicao)
      ? (parsed.imagem_posicao as AnaliseIA["imagem_posicao"])
      : inferirPosicaoHeuristica(titulo, conteudoLimpo);

    // Valida tom
    const TOMS_VALIDOS: TomConteudo[] = [
      "institucional_positivo",
      "institucional_neutro",
      "institucional_negativo",
    ];
    const tom: TomConteudo = TOMS_VALIDOS.includes(parsed.tom)
      ? parsed.tom
      : "institucional_neutro";

    // Valida prioridade
    const PRIORIDADES_VALIDAS = ["hero", "destaque", "normal", "baixa"];
    const prioridade = PRIORIDADES_VALIDAS.includes(parsed.prioridade)
      ? (parsed.prioridade as AnaliseIA["prioridade"])
      : "normal";

    return {
      relevante: Boolean(parsed.relevante),
      publicar: Boolean(parsed.publicar ?? parsed.relevante),
      motivo_bloqueio: parsed.motivo_bloqueio || null,
      tom,
      score_positivo: Math.min(100, Math.max(0, Number(parsed.score_positivo) || 0)),
      score_risco: Math.min(100, Math.max(0, Number(parsed.score_risco) || 0)),
      prioridade,
      categorias,
      resumo: parsed.resumo || "",
      imagem_posicao,
    };
  } catch (error) {
    console.error("❌ Erro na IA:", error);

    // Fallback completo com heurística
    return {
      relevante: false,
      publicar: false,
      motivo_bloqueio: "erro_ia",
      tom: "institucional_neutro",
      score_positivo: 0,
      score_risco: 0,
      prioridade: "baixa",
      categorias: [],
      resumo: "",
      imagem_posicao: inferirPosicaoHeuristica(titulo, conteudo),
    };
  }
}