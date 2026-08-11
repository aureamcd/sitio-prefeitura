export type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  keywords?: string[];
};

const searchItems: SearchResult[] = [
  {
    title: "Página Inicial",
    description: "Serviços ao cidadão, acesso rápido e informações da Prefeitura de Padre Marcos.",
    href: "/",
    category: "Portal",
    keywords: ["home", "inicio", "prefeitura", "padre marcos"],
  },
  {
    title: "Portal da Transparência",
    description: "Acompanhe receitas, despesas, servidores, licitações, contratos, obras e informações públicas do município.",
    href: "https://transparencia.padremarcos.pi.gov.br/",
    category: "Transparência",
    keywords: ["receitas", "despesas", "contas publicas", "servidores", "licitacoes", "contratos"],
  },
  {
    title: "Notícias",
    description: "Acompanhe as últimas notícias, eventos e comunicados da Prefeitura de Padre Marcos.",
    href: "/noticias",
    category: "Portal",
    keywords: ["noticia", "evento", "comunicado", "imprensa"],
  },
  {
    title: "Diário Oficial",
    description: "Acesso ao Diário Oficial dos Municípios do Estado do Piauí para consulta de atos oficiais.",
    href: "/diario-oficial",
    category: "Transparência",
    keywords: ["diario oficial", "doe", "publicacao legal", "atos oficiais"],
  },
  {
    title: "LGPD — Proteção de Dados",
    description: "Política de privacidade, direitos do titular e contato do Encarregado de Dados (DPO).",
    href: "/lgpd",
    category: "Portal",
    keywords: ["lgpd", "privacidade", "dados pessoais", "dpo", "protecao de dados"],
  },
  {
    title: "E-SIC",
    description: "Serviço de Informação ao Cidadão para pedidos com base na Lei de Acesso à Informação.",
    href: "/esic",
    category: "Atendimento",
    keywords: ["lai", "informacao", "pedido", "acesso", "sic"],
  },
  {
    title: "Consultar Protocolo — e-SIC",
    description: "Acompanhe o andamento de sua solicitação de informação pelo número de protocolo.",
    href: "/esic/consultar",
    category: "Atendimento",
    keywords: ["protocolo", "consulta", "acompanhamento", "sic"],
  },
  {
    title: "Fale Conosco",
    description: "Canais de contato com a Prefeitura de Padre Marcos.",
    href: "/ouvidoria",
    category: "Atendimento",
    keywords: ["contato", "telefone", "email", "atendimento"],
  },
  {
    title: "Ouvidoria",
    description: "Envie manifestações, sugestões, elogios, solicitações, reclamações e denúncias.",
    href: "/ouvidoria",
    category: "Atendimento",
    keywords: ["manifestacao", "denuncia", "reclamacao", "sugestao", "elogio"],
  },
  {
    title: "Consultar Manifestação — Ouvidoria",
    description: "Acompanhe o andamento de sua manifestação enviada à Ouvidoria.",
    href: "/ouvidoria/consultar",
    category: "Atendimento",
    keywords: ["protocolo", "consulta", "acompanhamento", "manifestacao"],
  },
  {
    title: "Acesso à Informação",
    description: "Orientações sobre acesso à informação pública municipal conforme a Lei de Acesso à Informação.",
    href: "/acesso-informacao",
    category: "Transparência",
    keywords: ["lai", "informacao publica", "transparencia", "acesso"],
  },
  {
    title: "Regulamentação da LAI",
    description: "Decreto municipal que regulamenta a aplicação da Lei de Acesso à Informação no município.",
    href: "/regulamentacao-lai",
    category: "Transparência",
    keywords: ["lai", "decreto", "regulamentacao", "acesso informacao"],
  },
  {
    title: "Concursos e Seleções",
    description: "Editais, resultados, lista de aprovados e nomeações de concursos e processos seletivos.",
    href: "https://transparencia.padremarcos.pi.gov.br/transparencia/concursos",
    category: "Transparência",
    keywords: ["concurso", "processo seletivo", "edital", "aprovados", "nomeacao"],
  },
  {
    title: "Acessibilidade",
    description: "Recursos e informações de acessibilidade disponíveis no portal.",
    href: "/acessibilidade",
    category: "Portal",
    keywords: ["contraste", "fonte", "libras", "atalhos", "wcad"],
  },
  {
    title: "Mapa do Site",
    description: "Índice estruturado das principais páginas do portal.",
    href: "/mapa-do-site",
    category: "Portal",
    keywords: ["mapa", "site", "navegacao", "indice"],
  },
  {
    title: "Leis e Normas",
    description: "Consulta a leis, decretos, portarias e outros atos normativos municipais.",
    href: "/leis-normas",
    category: "Publicações",
    keywords: ["lei", "norma", "decreto", "portaria", "legislacao"],
  },
  {
    title: "Publicações Oficiais",
    description: "Consultar publicações oficiais, diários, boletins e documentos administrativos.",
    href: "/publicacoes-oficiais",
    category: "Publicações",
    keywords: ["publicacao", "diario oficial", "boletim", "documento"],
  },
  {
    title: "Editais",
    description: "Publicações de editais de convocação, chamamentos públicos, processos seletivos e audiências.",
    href: "/editais",
    category: "Publicações",
    keywords: ["edital", "convocacao", "chamamento", "audiencia publica"],
  },
  {
    title: "Avisos e Comunicados",
    description: "Avisos, comunicados e informações oficiais da Prefeitura.",
    href: "/avisos-comunicados",
    category: "Publicações",
    keywords: ["aviso", "comunicado", "informativo"],
  },
  {
    title: "Atas de Reuniões",
    description: "Consulta a atas de reuniões e sessões administrativas da Prefeitura.",
    href: "/atas-reunioes",
    category: "Publicações",
    keywords: ["ata", "reuniao", "sessao", "conselho"],
  },
  {
    title: "Publicações Diversas",
    description: "Outras publicações oficiais e documentos diversos do município.",
    href: "/diversas",
    category: "Publicações",
    keywords: ["documento", "publicacao", "diversos"],
  },
  {
    title: "Carta de Serviços",
    description: "Guia de serviços oferecidos pela Prefeitura ao cidadão.",
    href: "/carta-servicos",
    category: "Serviços",
    keywords: ["servico", "cidadao", "atendimento", "guia"],
  },
  {
    title: "Serviços Online",
    description: "Acesso aos serviços digitais disponíveis para o cidadão.",
    href: "/servicos-online",
    category: "Serviços",
    keywords: ["online", "digital", "internet", "sistema"],
  },
  {
    title: "Todos os Serviços",
    description: "Central de Serviços ao Cidadão com todas as categorias de atendimento.",
    href: "/todos-servicos",
    category: "Serviços",
    keywords: ["servicos", "categorias", "atendimento"],
  },
  {
    title: "Contatos e Atendimento",
    description: "Contatos, horários e informações de atendimento dos órgãos municipais.",
    href: "/contatos-atendimento",
    category: "Informações Institucionais",
    keywords: ["contato", "telefone", "horario", "atendimento", "endereco"],
  },
  {
    title: "Estrutura Organizacional",
    description: "Organização administrativa da Prefeitura com secretarias, órgãos e competências.",
    href: "/estrutura-organizacional",
    category: "Informações Institucionais",
    keywords: ["estrutura", "organograma", "secretaria", "orgao", "gestao"],
  },
  {
    title: "FAQ — Perguntas Frequentes",
    description: "Perguntas frequentes sobre o portal e os serviços municipais.",
    href: "/FAQ",
    category: "Informações Institucionais",
    keywords: ["perguntas", "duvidas", "frequentes", "faq"],
  },
  {
    title: "Gestão Municipal",
    description: "Informações sobre a gestão municipal, prefeita, vice-prefeito e secretários.",
    href: "/gestao",
    category: "Informações Institucionais",
    keywords: ["prefeito", "gestao", "administracao", "secretario"],
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function scoreItem(item: SearchResult, terms: string[]) {
  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const category = normalizeText(item.category);
  const keywords = normalizeText((item.keywords || []).join(" "));
  const href = normalizeText(item.href);

  return terms.reduce((score, term) => {
    if (title.includes(term)) score += 8;
    if (keywords.includes(term)) score += 5;
    if (category.includes(term)) score += 3;
    if (description.includes(term)) score += 2;
    if (href.includes(term)) score += 1;
    return score;
  }, 0);
}

export function searchPortal(query: string): SearchResult[] {
  const terms = normalizeText(query)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (terms.length === 0) return [];

  return searchItems
    .map((item) => ({ item, score: scoreItem(item, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(({ item }) => item);
}
