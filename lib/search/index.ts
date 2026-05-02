export type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  keywords?: string[];
};

const searchItems: SearchResult[] = [
  {
    title: "Pagina inicial",
    description: "Servicos ao cidadao, acesso rapido e informacoes da Prefeitura de Padre Marcos.",
    href: "/",
    category: "Portal",
    keywords: ["home", "inicio", "prefeitura", "padre marcos"],
  },
  {
    title: "Portal da Transparencia",
    description: "Acompanhe receitas, despesas, servidores e informacoes publicas do municipio.",
    href: "https://transparencia.padremarcos.pi.gov.br/transparencia/",
    category: "Transparencia",
    keywords: ["receitas", "despesas", "contas publicas", "servidores"],
  },
  {
    title: "E-SIC",
    description: "Servico de Informacao ao Cidadao para pedidos com base na Lei de Acesso a Informacao.",
    href: "/esic",
    category: "Atendimento",
    keywords: ["lai", "informacao", "pedido", "acesso"],
  },
  {
    title: "Fale Conosco",
    description: "Canais de contato com a Prefeitura de Padre Marcos.",
    href: "/fale-conosco",
    category: "Atendimento",
    keywords: ["contato", "telefone", "email", "atendimento"],
  },
  {
    title: "Ouvidoria",
    description: "Envie manifestacoes, sugestoes, elogios, solicitacoes, reclamacoes e denuncias.",
    href: "/ouvidoria",
    category: "Atendimento",
    keywords: ["manifestacao", "denuncia", "reclamacao", "sugestao"],
  },
  {
    title: "Acesso a Informacao",
    description: "Orientacoes sobre acesso a informacao publica municipal.",
    href: "/acesso-informacao",
    category: "Transparencia",
    keywords: ["lai", "informacao publica", "transparencia"],
  },
  {
    title: "Acessibilidade",
    description: "Recursos e informacoes de acessibilidade disponiveis no portal.",
    href: "/acessibilidade",
    category: "Portal",
    keywords: ["contraste", "fonte", "libras", "atalhos"],
  },
  {
    title: "Leis e Normas",
    description: "Consulta a leis, normas e atos oficiais municipais.",
    href: "/leis-normas",
    category: "Publicacoes",
    keywords: ["lei", "norma", "decreto", "portaria"],
  },
  {
    title: "Editais",
    description: "Publicacoes de editais da administracao municipal.",
    href: "/publicacoes/editais",
    category: "Publicacoes",
    keywords: ["edital", "licitacao", "publicacao"],
  },
  {
    title: "Avisos e Comunicados",
    description: "Avisos, comunicados e informacoes oficiais da Prefeitura.",
    href: "/publicacoes/avisos-comunicados",
    category: "Publicacoes",
    keywords: ["aviso", "comunicado", "noticia"],
  },
  {
    title: "Atas de Reunioes",
    description: "Consulta a atas de reunioes e documentos relacionados.",
    href: "/publicacoes/atas-reunioes",
    category: "Publicacoes",
    keywords: ["ata", "reuniao", "conselho"],
  },
  {
    title: "Publicacoes Diversas",
    description: "Outras publicacoes oficiais e documentos do municipio.",
    href: "/publicacoes/diversas",
    category: "Publicacoes",
    keywords: ["documento", "publicacao"],
  },
  {
    title: "Carta de Servicos",
    description: "Guia de servicos oferecidos pela Prefeitura ao cidadao.",
    href: "/servicos/carta",
    category: "Servicos",
    keywords: ["servico", "cidadao", "atendimento"],
  },
  {
    title: "Servicos Online",
    description: "Acesso aos servicos digitais disponiveis para o cidadao.",
    href: "/servicos/online",
    category: "Servicos",
    keywords: ["online", "digital", "internet"],
  },
  {
    title: "Todos os Servicos",
    description: "Lista completa de servicos disponiveis no portal.",
    href: "/servicos/todos",
    category: "Servicos",
    keywords: ["servicos", "lista", "cidadao"],
  },
  {
    title: "Concursos e Processos Seletivos",
    description: "Informacoes sobre concursos publicos e processos seletivos.",
    href: "/servicos/concursos-e-processos",
    category: "Servicos",
    keywords: ["concurso", "seletivo", "vagas", "edital"],
  },
  {
    title: "Competencias",
    description: "Competencias institucionais dos orgaos municipais.",
    href: "/info-institucional/competencias",
    category: "Informacoes Institucionais",
    keywords: ["competencia", "orgao", "atribuicao"],
  },
  {
    title: "Contatos e Atendimento",
    description: "Contatos, horarios e informacoes de atendimento dos orgaos municipais.",
    href: "/info-institucional/contatos-atendimento",
    category: "Informacoes Institucionais",
    keywords: ["contato", "telefone", "horario", "atendimento"],
  },
  {
    title: "Estrutura Organizacional",
    description: "Organizacao administrativa da Prefeitura de Padre Marcos.",
    href: "/info-institucional/estrutura-organizacional",
    category: "Informacoes Institucionais",
    keywords: ["estrutura", "organograma", "secretaria", "orgao"],
  },
  {
    title: "FAQ",
    description: "Perguntas frequentes sobre o portal e os servicos municipais.",
    href: "/info-institucional/FAQ",
    category: "Informacoes Institucionais",
    keywords: ["perguntas", "duvidas", "frequentes"],
  },
  {
    title: "Gestao",
    description: "Informacoes sobre a gestao municipal.",
    href: "/info-institucional/gestao",
    category: "Informacoes Institucionais",
    keywords: ["prefeito", "gestao", "administracao"],
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
