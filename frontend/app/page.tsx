import TransparencyCard from "../components/ui/Card";
import TransparencySection from "../components/transparencia/Section";
import DashboardResumo from "../components/transparencia/DashboardResumo";

import {
  Building2,
  ClipboardList,
  Scale,
  Phone,
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
        href: "/S1-Info_Institucionais/estrutura_organizacional",
        Icon: Building2,
        variant: "highlight",
      },
      {
        title: "Competências e Atribuições",
        description:
          "Competências legais do município e atribuições de cada secretaria e órgão.",
        href: "/S1-Info_Institucionais/competencias_atribuicoes",
        Icon: ClipboardList,
      },
      {
        title: "Legislação e Atos Normativos",
        description: "Leis, decretos, portarias e demais atos normativos municipais.",
        href: "/transparencia/legislacao",
        Icon: Scale,
      },
      {
        title: "Contatos Institucionais e Horários",
        description:
          "Endereços físicos, telefones, e-mails institucionais e horários de atendimento da sede da prefeitura e de suas secretarias.",
        href: "/transparencia/contatos",
        Icon: Phone,
        variant: "highlight",
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
    title: "Compras, Contratos e Convênios",
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
        title: "Convênios e Transferências",
        description:
          "Transferências voluntárias recebidas e concedidas, acordos sem repasse financeiro e a íntegra dos instrumentos de convênio.",
        href: "/transparencia/convenios",
        Icon: ArrowLeftRight,
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
        href: "/transparencia/relatorios",
        Icon: Activity,
        variant: "highlight",
      },
      {
        title: "Educação",
        description:
          "Plano Municipal de Educação, relatório de resultados, lista de espera em creches públicas e seus critérios de priorização.",
        href: "/transparencia/emendas",
        Icon: GraduationCap,
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
        title: "Perguntas Frequentes (FAQ)",
        description:
          "Respostas para as dúvidas mais comuns dos cidadãos sobre as atividades e serviços oferecidos pela prefeitura.",
        href: "/faq",
        Icon: HelpCircle,
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

      <div className="absolute top-0 left-0 right-0 h-[3px] flex">
        <div className="flex-1 bg-[#F7C325]" />
        <div className="flex-1 bg-[#E53935]" />
        <div className="flex-1 bg-[#0052CC]" />
      </div>

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