import TransparencyCard from "@/components/ui/Card";
import TransparencySection from "@/components/transparencia/Section";
import DashboardResumo from "@/components/transparencia/DashboardResumo";

import {
  Building2,
  Scale,
  Banknote,
  Receipt,
  AlertTriangle,
  FileText,
  Clipboard,
  ArrowLeftRight,
  Wrench,
  Users,
  GraduationCap,
  Ticket,
  BarChart,
  Info,
  Inbox,
  MessageSquare,
  HelpCircle,
  ShieldCheck,
  Database,
  Map,
  Activity,
  Book, // Novo ícone para Glossário
  ClipboardList,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

type CardItem = {
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  variant?: "highlight";
};

type SectionItem = {
  title: string;
  cards: CardItem[];
};

const sections: SectionItem[] = [
  {

    title: "Informações Institucionais",
    cards: [
      {
        title: "Estrutura Organizacional",
        description:
          "Estrutura organizacional (organograma) com a relação hierárquica entre as unidades administrativas (Gabinete, Secretarias e equivalentes), incluindo a identificação nominal dos atuais responsáveis pela gestão (Prefeito, Secretários e demais gestores).",
        href: "https://padremarcos.pi.gov.br/estrutura-organizacional",
        Icon: Building2,
        variant: "highlight",
      },
      {
        title: "Legislação e Atos Normativos",
        description: "Leis, decretos, portarias e demais atos normativos municipais.",
        href: "https://www.padremarcos.pi.gov.br/leis-normas",
        Icon: Scale,
      },
      {
        title: "Perguntas Frequentes (FAQ)",
        description:
          "Respostas para as dúvidas mais comuns dos cidadãos sobre as atividades e serviços oferecidos pela prefeitura.",
        href: "https://padremarcos.pi.gov.br/FAQ",
        Icon: HelpCircle,
      },
    ],
  },

  {
    title: "Execução Orçamentária e Financeira",
    cards: [
      {
        title: "Receitas",
        description:
          "Previsão e arrecadação, classificação orçamentária por natureza e a lista de inscritos em Dívida Ativa do município.",
        href: "/S2-Execucao_Orc_e_Fin/receitas",
        Icon: Banknote,
        variant: "highlight",
      },
      {
        title: "Despesas",
        description:
          "Total de despesas empenhadas, liquidadas e pagas, classificação orçamentária e possibilidade de consulta detalhada de pagamentos por credor e fornecedor.",
        href: "/S2-Execucao_Orc_e_Fin/despesas",
        Icon: Receipt,
        variant: "highlight",
      },
      {
        title: "Renúncias de Receita",
        description:
          "Desonerações tributárias concedidas, fundamentação legal, beneficiários e isenções fiscais.",
        href: "/S2-Execucao_Orc_e_Fin/renuncias-de-receitas",
        Icon: AlertTriangle,
      },
    ],
  },

  {
    title: "Compras, Contratos e Transferências",
    cards: [
      {
        title: "Licitações",
        description:
          "Editais, documentos das fases interna e externa, atas de adesão (SRP), dispensas e inexigibilidades, Plano de Contratações Anual e relação de Licitantes Sancionados.",
        href: "/S3-Compras_Cont_e_Conven/licitacoes",
        Icon: FileText,
        variant: "highlight",
      },
      {
        title: "Contratos",
        description:
          "Íntegra dos contratos vigentes e encerrados, termos aditivos, relação de fiscais e a Ordem Cronológica de Pagamentos.",
        href: "/transparencia/contratos",
        Icon: Clipboard,
        variant: "highlight",
      },
      {
        title: "Transferências e Convênios",
        description:
          "Consultas de Receitas da União, Receitas do Estado e transferências financeiras entre entidades municipais.",
        href: "/transparencia/transferencias",
        Icon: ArrowLeftRight,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Obras e Infraestrutura",
    cards: [
      {
        title: "Obras Públicas",
        description:
          "Situação atual, datas, empresas contratadas, quantitativos e preços contratados/executados, incluindo a relação de obras paralisadas e seus motivos.",
        href: "/transparencia/obras",
        Icon: Wrench,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Gestão de Pessoas e Benefícios",
    cards: [
      {
        title: "Recursos Humanos",
        description:
          "Relação nominal de servidores, cargos, lotação, remunerações, tabela de padrões remuneratórios, além da lista de estagiários e terceirizados.",
        href: "/transparencia/recursos-humanos",
        Icon: Users,
        variant: "highlight",
      },
      {
        title: "Concursos e Seleções Públicas",
        description:
          "Íntegra dos editais, resultados, lista de aprovados e nomeações de concursos e processos seletivos.",
        href: "/transparencia/concursos",
        Icon: GraduationCap,
      },
      {
        title: "Diárias e Passagens",
        description:
          "Nome e cargo do beneficiário, valor, destino, período e motivo do afastamento, além da tabela com os valores das diárias do município.",
        href: "/transparencia/diarias",
        Icon: Ticket,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Planejamento e Prestação de Contas",
    cards: [
      {
        title: "Relatórios e Contas Públicas",
        description:
          "Instrumentos de planejamento (PPA, LDO, LOA), Relatório de Gestão Fiscal (RGF), Relatório Resumido da Execução Orçamentária (RREO), Balanço Geral e Relatórios de Gestão.",
        href: "/transparencia/relatorios",
        Icon: FileText,
        variant: "highlight",
      },
      {
        title: "Emendas Parlamentares",
        description:
          'Recebimento e execução orçamentária e financeira de emendas parlamentares (incluindo as "emendas pix"), identificando origem, autoria e objeto do gasto.',
        href: "/transparencia/emendas",
        Icon: BarChart,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Serviços ao Cidadão (Atividades Finalísticas)",
    cards: [
      {
        title: "Saúde",
        description:
          "Plano Municipal de Saúde, programação anual, escala de médicos, horários de atendimento, lista de espera para consultas/exames e relação de estoque de medicamentos (inclusive de alto custo).",
        href: "/atividades/saude",
        Icon: Activity,
        variant: "highlight",
      },
      {
        title: "Educação",
        description:
          "Plano Municipal de Educação, relatório de resultados, lista de espera em creches públicas e seus critérios de priorização.",
        href: "/atividades/educacao",
        Icon: GraduationCap,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Conselhos Municipais",
    cards: [
      {
        title: "Conselho de Saúde",
        description:
          "Acompanhamento e controle social das ações e serviços públicos de saúde.",
        href: "/conselhos/saude",
        Icon: Users,
        variant: "highlight",
      },
      {
        title: "Conselho do FUNDEB / Educação",
        description:
          "Acompanhamento e controle social da aplicação dos recursos da Educação Básica.",
        href: "/conselhos/educacao",
        Icon: Users,
        variant: "highlight",
      },
      {
        title: "Conselho de Assistência Social",
        description:
          "Acompanhamento e controle social da Política Municipal de Assistência Social.",
        href: "/conselhos/assistencia",
        Icon: Users,
        variant: "highlight",
      },
    ],
  },
  {
    title: "Acesso à Informação e Controle Social",
    cards: [
      {
        title: "e-SIC (Serviço de Informação ao Cidadão)",
        description:
          "Sistema eletrônico para solicitar informações com base na LAI, prazos de resposta, autoridades competentes e relatórios estatísticos anuais.",
        href: "/LAI",
        Icon: Info,
        variant: "highlight",
      },
      {
        title: "Informações Classificadas e Desclassificadas",
        description:
          "Rol de documentos classificados com grau de sigilo ou informações desclassificadas nos últimos 12 meses.",
        href: "/ESIC",
        Icon: Inbox,
        variant: "highlight",
      },
      {
        title: "Ouvidoria",
        description:
          "Canal eletrônico e presencial para denúncias, reclamações, sugestões e elogios sobre a administração pública.",
        href: "/carta-de-servico",
        Icon: MessageSquare,
        variant: "highlight",
      },
      {
        title: "Carta de Serviços ao Usuário",
        description:
          "Informações detalhadas sobre os serviços prestados pela prefeitura, formas de acesso, requisitos, etapas e prazos de atendimento.",
        href: "/ouvidoria",
        Icon: FileText,
        variant: "highlight",
      },
      {
        title: "LGPD e Governo Digital",
        description:
          "Política de privacidade, identificação do encarregado de proteção de dados, regulamentação local e acesso digital a serviços.",
        href: "/lgpd",
        Icon: ShieldCheck,
      },
      {
        title: "Dados Abertos",
        description:
          "Acesso a bases de dados públicos do município em formatos estruturados e legíveis por máquina para reutilização.",
        href: "/dados-abertos",
        Icon: Database,
      },
    ],
  },

  {
    title: "Transparência Complementar",
    cards: [
      {
        title: "Pesquisa de Satisfação",
        description: " Participe da nossa pesquisa para nos ajudar a avaliar e melhorar continuamente o Portal da Transparência.",
        href: "/transparencia/pesquisa-satisfacao",
        Icon: BarChart,
      },
      {
        title: "Mapa do Site",
        description: "Navegue facilmente por toda a estrutura de links e páginas do Portal da Transparência.",
        href: "/mapa-do-site",
        Icon: Map,
      },
    ],
  },
];

export default function TransparenciaPage() {
  return (
    <div className="min-h-screen relative z-0">

      {/* ─── Hero + KPIs ─── */}
      <DashboardResumo />

      {/* ─── Sections ─── */}
      {sections.map((section, index) => (
        <TransparencySection
          key={section.title}
          id={`secao-${index}`}
          title={section.title}
          index={index + 1}
        >
          {section.cards.map((card) => (
            <TransparencyCard key={card.title} {...card} />
          ))}
        </TransparencySection>
      ))}

    </div>
  );
}