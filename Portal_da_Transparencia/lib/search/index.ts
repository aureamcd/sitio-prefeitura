export type SearchResult = {
  title: string;
  description: string;
  href: string;
  category: string;
  keywords?: string[];
};

const searchItems: SearchResult[] = [
  // ── Portal ──
  {
    title: "Página Inicial",
    description: "Serviços ao cidadão, acesso rápido e informações da Prefeitura de Padre Marcos.",
    href: "/",
    category: "Portal",
    keywords: ["home", "inicio", "prefeitura", "padre marcos", "portal da transparencia"],
  },
  {
    title: "Acessibilidade",
    description: "Recursos e informações de acessibilidade disponíveis no portal.",
    href: "/acessibilidade",
    category: "Portal",
    keywords: ["contraste", "fonte", "libras", "atalhos", "vlibras"],
  },
  {
    title: "Mapa do Site",
    description: "Índice estruturado das principais páginas do portal.",
    href: "/mapa-do-site",
    category: "Portal",
    keywords: ["mapa", "site", "navegacao", "acessibilidade", "indice"],
  },
  {
    title: "Pesquisa de Satisfação",
    description: "Participe da pesquisa e avalie o Portal da Transparência.",
    href: "/transparencia/pesquisa-satisfacao",
    category: "Portal",
    keywords: ["pesquisa", "satisfacao", "avaliacao", "opiniao", "melhoria"],
  },

  // ── Execução Orçamentária e Financeira ──
  {
    title: "Despesas Municipais",
    description: "Empenhos, liquidações, pagamentos, despesas extra-orçamentárias e restos a pagar.",
    href: "/S2-Execucao_Orc_e_Fin/despesas",
    category: "Execução Orçamentária",
    keywords: ["despesa", "empenho", "liquidado", "pago", "credor", "fornecedor", "orcamento", "dotacao"],
  },
  {
    title: "Receitas Municipais",
    description: "Previsão e arrecadação de receitas, classificação hierárquica, dívida ativa e receitas extra-orçamentárias.",
    href: "/S2-Execucao_Orc_e_Fin/receitas",
    category: "Execução Orçamentária",
    keywords: ["receita", "arrecadacao", "previsao", "imposto", "divida ativa", "tributo"],
  },
  {
    title: "Renúncias de Receita",
    description: "Isenções, anistias, remissões e subsídios tributários concedidos pelo município.",
    href: "/S2-Execucao_Orc_e_Fin/renuncias-de-receitas",
    category: "Execução Orçamentária",
    keywords: ["renuncia", "isencao", "anistia", "subsidio", "beneficio fiscal", "incentivo"],
  },
  {
    title: "Despesas Extra-orçamentárias",
    description: "Pagamentos que independem de autorização orçamentária — consignações, cauções, restituições.",
    href: "/S2-Execucao_Orc_e_Fin/despesas/extra-orcamentarias",
    category: "Execução Orçamentária",
    keywords: ["extra orcamentaria", "consignacao", "caucao", "restituicao", "guia"],
  },
  {
    title: "Restos a Pagar",
    description: "Despesas empenhadas em exercícios anteriores que ainda não foram pagas.",
    href: "/S2-Execucao_Orc_e_Fin/despesas/restos-a-pagar",
    category: "Execução Orçamentária",
    keywords: ["restos a pagar", "inscricao", "processado", "nao processado"],
  },

  // ── Compras, Contratos e Convênios ──
  {
    title: "Licitações",
    description: "Editais, documentos das fases interna e externa, atas de adesão (SRP), dispensas e inexigibilidades.",
    href: "/S3-Compras_Cont_e_Conven/licitacoes",
    category: "Compras e Contratos",
    keywords: ["licitacao", "edital", "pregao", "concorrencia", "dispensa", "inexigibilidade", "srp"],
  },
  {
    title: "Contratos",
    description: "Íntegra dos contratos vigentes e encerrados, termos aditivos, documentos anexados.",
    href: "/transparencia/contratos",
    category: "Compras e Contratos",
    keywords: ["contrato", "aditivo", "contratado", "fornecedor", "vigencia"],
  },
  {
    title: "Convênios e Transferências",
    description: "Transferências voluntárias recebidas e concedidas, acordos sem repasse financeiro.",
    href: "/transparencia/convenios",
    category: "Compras e Contratos",
    keywords: ["convenio", "transferencia", "repasse", "acordo", "cooperacao"],
  },

  // ── Obras ──
  {
    title: "Obras Públicas",
    description: "Situação, contratos, valores, cronograma e detalhamento de execução de obras públicas municipais.",
    href: "/transparencia/obras",
    category: "Obras",
    keywords: ["obra", "construcao", "engenharia", "reforma", "paralisada", "execucao"],
  },

  // ── Gestão de Pessoas ──
  {
    title: "Recursos Humanos",
    description: "Relação nominal de servidores, cargos, lotação, remunerações, estagiários e terceirizados.",
    href: "/transparencia/recursos-humanos",
    category: "Gestão de Pessoas",
    keywords: ["servidor", "funcionario", "cargo", "salario", "remuneracao", "folha", "estagiario", "terceirizado"],
  },
  {
    title: "Folha de Pagamento",
    description: "Remuneração detalhada de todos os servidores municipais, incluindo vencimentos e descontos.",
    href: "/transparencia/recursos-humanos",
    category: "Gestão de Pessoas",
    keywords: ["folha", "pagamento", "salario", "vencimento", "desconto", "liquido"],
  },
  {
    title: "Concursos e Seleções Públicas",
    description: "Editais, resultados, lista de aprovados e nomeações de concursos e processos seletivos.",
    href: "/transparencia/concursos",
    category: "Gestão de Pessoas",
    keywords: ["concurso", "processo seletivo", "edital", "aprovado", "nomeacao", "vaga"],
  },
  {
    title: "Diárias e Passagens",
    description: "Valores pagos a servidores em viagens a serviço, com beneficiário, destino e motivo.",
    href: "/transparencia/diarias",
    category: "Gestão de Pessoas",
    keywords: ["diaria", "passagem", "viagem", "servidor", "afastamento", "padrao de valores"],
  },

  // ── Planejamento e Prestação de Contas ──
  {
    title: "Planejamento e Prestação de Contas",
    description: "PPA, LDO, LOA, RGF, RREO, Balanço Geral, Julgamento de Contas pelo TCE-PI.",
    href: "/transparencia/relatorios",
    category: "Planejamento",
    keywords: ["ppa", "ldo", "loa", "rgf", "rreo", "balanco", "prestacao de contas", "tce", "julgamento"],
  },
  {
    title: "Emendas Parlamentares",
    description: "Recebimento e execução orçamentária e financeira de emendas parlamentares, incluindo emendas pix.",
    href: "/transparencia/emendas",
    category: "Planejamento",
    keywords: ["emenda", "parlamentar", "deputado", "senador", "emenda pix", "transferencia especial"],
  },

  // ── Transparência ──
  {
    title: "Legislação e Atos Normativos",
    description: "Leis, decretos, portarias e demais atos normativos municipais para consulta e download.",
    href: "/transparencia/legislacao",
    category: "Transparência",
    keywords: ["lei", "decreto", "portaria", "norma", "legislacao", "ato normativo", "regulamento"],
  },

  // ── Atendimento e Serviços ──
  {
    title: "e-SIC — Serviço de Informação ao Cidadão",
    description: "Sistema para solicitar informações com base na Lei de Acesso à Informação (LAI).",
    href: "/ESIC",
    category: "Atendimento",
    keywords: ["esic", "sic", "lai", "informacao", "pedido", "acesso a informacao", "lei 12527"],
  },
  {
    title: "Ouvidoria",
    description: "Envie manifestações, sugestões, elogios, solicitações, reclamações e denúncias.",
    href: "/ouvidoria",
    category: "Atendimento",
    keywords: ["ouvidoria", "manifestacao", "denuncia", "reclamacao", "sugestao", "elogio", "contato"],
  },
  {
    title: "Carta de Serviços ao Usuário",
    description: "Informações detalhadas sobre os serviços prestados pela prefeitura e formas de acesso.",
    href: "/carta-servicos",
    category: "Atendimento",
    keywords: ["carta de servicos", "servico", "cidadao", "atendimento", "guia"],
  },
  {
    title: "LGPD e Governo Digital",
    description: "Política de privacidade, encarregado de proteção de dados e regulamentação local.",
    href: "/lgpd",
    category: "Atendimento",
    keywords: ["lgpd", "privacidade", "dado pessoal", "encarregado", "governo digital"],
  },
  {
    title: "Perguntas Frequentes (FAQ)",
    description: "Respostas para as dúvidas mais comuns sobre serviços e o portal.",
    href: "/faq",
    category: "Atendimento",
    keywords: ["faq", "pergunta", "duvida", "frequente", "ajuda"],
  },

  // ── Informações Institucionais ──
  {
    title: "Estrutura Organizacional",
    description: "Organograma e relação das secretarias e órgãos municipais com seus responsáveis.",
    href: "/S1-Info_Institucionais/estrutura_organizacional",
    category: "Informações Institucionais",
    keywords: ["estrutura", "organograma", "secretaria", "orgao", "prefeito", "gestor"],
  },
  {
    title: "Acesso à Informação",
    description: "Orientações sobre acesso a informação pública municipal.",
    href: "/acesso-informacao",
    category: "Informações Institucionais",
    keywords: ["acesso", "informacao", "lai", "transparencia", "dados abertos"],
  },
  {
    title: "Informações Classificadas e Desclassificadas",
    description: "Rol de documentos classificados com grau de sigilo ou desclassificados.",
    href: "/informacoes-classificadas",
    category: "Informações Institucionais",
    keywords: ["classificado", "sigilo", "desclassificado", "informacao"],
  },
  {
    title: "Regulamentação da LAI",
    description: "Regulamentação municipal da Lei de Acesso à Informação.",
    href: "/regulamentacao-lai",
    category: "Informações Institucionais",
    keywords: ["regulamentacao", "lai", "lei acesso informacao", "decreto"],
  },

  // ── Dados Abertos ──
  {
    title: "Dados Abertos",
    description: "Acesso a bases de dados públicos do município em formatos estruturados (CSV) para reutilização.",
    href: "/dados-abertos",
    category: "Dados Abertos",
    keywords: ["dados abertos", "csv", "download", "dataset", "api", "formato aberto"],
  },

  // ── Atividades Finalísticas ──
  {
    title: "Saúde",
    description: "Plano Municipal de Saúde, escala de médicos, lista de espera e estoque de medicamentos.",
    href: "/atividades/saude",
    category: "Atividades Finalísticas",
    keywords: ["saude", "medico", "consulta", "medicamento", "hospital", "ubs", "sus"],
  },
  {
    title: "Educação",
    description: "Plano Municipal de Educação, lista de espera em creches e resultados.",
    href: "/atividades/educacao",
    category: "Atividades Finalísticas",
    keywords: ["educacao", "escola", "creche", "aluno", "professor", "pme"],
  },

  // ── Conselhos ──
  {
    title: "Conselho Municipal de Saúde",
    description: "Acompanhamento e controle social das ações de saúde.",
    href: "/conselhos/saude",
    category: "Conselhos Municipais",
    keywords: ["conselho", "saude", "controle social", "cms"],
  },
  {
    title: "Conselho do FUNDEB / Educação",
    description: "Acompanhamento e controle social da aplicação dos recursos da Educação.",
    href: "/conselhos/educacao",
    category: "Conselhos Municipais",
    keywords: ["conselho", "fundeb", "educacao", "cacs", "controle social"],
  },
  {
    title: "Conselho de Assistência Social",
    description: "Acompanhamento e controle social da Política de Assistência Social.",
    href: "/conselhos/assistencia",
    category: "Conselhos Municipais",
    keywords: ["conselho", "assistencia social", "fmas", "controle social", "cmas"],
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
