import TransparencyCard from "../components/ui/Card";
import TransparencySection from "../components/transparencia/Section";
import DashboardResumo from "../components/transparencia/Hero";

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
  
];

export default function TransparenciaPage() {
  return (
    <div className="min-h-screen relative z-0">

      {/* ─── Hero ─── */}
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