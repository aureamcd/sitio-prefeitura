import "dotenv/config";

export type AnaliseIA = {
  relevante: boolean;
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
{ "relevante": false, "categorias": [], "resumo": "", "imagem_posicao": "cover_center" }

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
          max_tokens: 300,
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

    return {
      relevante: Boolean(parsed.relevante),
      categorias,
      resumo: parsed.resumo || "",
      imagem_posicao,
    };
  } catch (error) {
    console.error("❌ Erro na IA:", error);

    // Fallback completo com heurística
    return {
      relevante: false,
      categorias: [],
      resumo: "",
      imagem_posicao: inferirPosicaoHeuristica(titulo, conteudo),
    };
  }
}