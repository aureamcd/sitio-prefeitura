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

export async function analisarNoticiaIA(
  titulo: string,
  conteudo: string
): Promise<AnaliseIA> {
  const prompt = `
Você é um sistema de curadoria de notícias institucionais municipais.

Retorne APENAS JSON válido:

{
  "relevante": boolean,
  "categorias": string[],
  "resumo": string,
  "imagem_posicao": string
}

REGRAS:

- Relevante se a notícia for sobre o município de Padre Marcos, incluindo:
  - ações da prefeitura ou secretarias
  - saúde, educação, obras, assistência social
  - esportes, torneios, campeonatos e atletas do município
  - projetos sociais, culturais ou comunitários locais
  - serviços públicos ou programas municipais
- NÃO é relevante se envolver: crimes, homicídios, roubos, prisões, acidentes fatais

Categorias possíveis:
saude, educacao, obras, assistencia, esporte, licitacao

Resumo:
- até 2 frases
- claro e institucional

Posicionamento da imagem (escolha o mais adequado ao contexto):
- "cover_top"    → notícias de obras, infraestrutura, eventos ao ar livre, paisagens, quadras, ruas
- "cover_face"   → notícias com pessoas em destaque: autoridades, atletas, crianças, discurso, entrega de prêmio
- "cover_center" → padrão genérico, use quando não houver elemento claro de foco

Se não for relevante:
{
  "relevante": false,
  "categorias": [],
  "resumo": "",
  "imagem_posicao": "cover_center"
}

Título: ${titulo}

Responda APENAS com JSON puro.
NÃO escreva frases como "Aqui está o JSON".
NÃO use markdown.

Conteúdo:
${conteudo.slice(0, 2000)}
`;

  try {
    console.log("🔑 KEY:", process.env.OPENROUTER_API_KEY);
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct",
          temperature: 0.2,
          max_tokens: 256,
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

    const imagem_posicao = POSICOES_VALIDAS.includes(
      parsed.imagem_posicao
    )
      ? parsed.imagem_posicao
      : "cover_center";

    return {
      relevante: Boolean(parsed.relevante),
      categorias,
      resumo: parsed.resumo || "",
      imagem_posicao,
    };
  } catch (error) {
    console.error("❌ Erro na IA:", error);

    return {
      relevante: false,
      categorias: [],
      resumo: "",
      imagem_posicao: "cover_center",
    };
  }
}