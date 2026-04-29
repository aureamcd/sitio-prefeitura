import TransparencyCard from "../components/ui/Card";
import TransparencySection from "../components/transparencia/Section";
import DashboardResumo from "../components/transparencia/Hero";

import {
  Receipt,
  FileCheck,
  Landmark,
  IdCard,
  Banknote,
  BookOpen,
  Eye,
  Gavel,
  Newspaper,
  MessageSquare,
  Info,
  Briefcase,
  Building2,
  PieChart,
  Handshake,
  HardHat,
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
    title: "Serviços ao Cidadão",
    cards: [
      {
        title: "Nota Fiscal Eletrônica",
        description: "Emissão de Nota Fiscal Eletrônica.",
        href: "/servicos/nota-fiscal",
        Icon: Receipt,
        variant: "highlight",
      },
      {
        title: "Certidão Negativa",
        description: "Emissão de Certidões Negativas de Débito.",
        href: "/servicos/certidao-negativa",
        Icon: FileCheck,
      },
      {
        title: "Portal do Contribuinte",
        description: "Acesso aos serviços do contribuinte.",
        href: "/servicos/portal-contribuinte",
        Icon: Landmark,
        variant: "highlight",
      },
      {
        title: "Portal do Servidor",
        description: "Acesso exclusivo para servidores municipais.",
        href: "/servicos/portal-servidor",
        Icon: IdCard,
      },
      {
        title: "Contracheque",
        description: "Emissão de contracheque online.",
        href: "/servicos/contracheque",
        Icon: Banknote,
      },
      {
        title: "Carta de Serviços",
        description: "Guia completo de serviços oferecidos.",
        href: "/servicos/carta-servicos",
        Icon: BookOpen,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Acesso Rápido",
    cards: [
      {
        title: "Portal da Transparência",
        description: "Acompanhe as receitas e despesas do município.",
        href: "/transparencia",
        Icon: Eye,
        variant: "highlight",
      },
      {
        title: "Licitações",
        description: "Acompanhe os processos licitatórios.",
        href: "/transparencia/licitacoes",
        Icon: Gavel,
      },
      {
        title: "Diário Oficial",
        description: "Acesso às publicações oficiais do município.",
        href: "/transparencia/diario-oficial",
        Icon: Newspaper,
        variant: "highlight",
      },
      {
        title: "Ouvidoria",
        description: "Canal de comunicação direta com a prefeitura.",
        href: "/ouvidoria",
        Icon: MessageSquare,
      },
      {
        title: "E-SIC",
        description: "Serviço de Informação ao Cidadão.",
        href: "/esic",
        Icon: Info,
      },
      {
        title: "Concursos",
        description: "Informações sobre concursos e seletivos.",
        href: "/concursos",
        Icon: Briefcase,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Institucional",
    cards: [
      {
        title: "Estrutura Organizacional",
        description: "Conheça a organização da prefeitura.",
        href: "/prefeitura/estrutura-organizacional",
        Icon: Building2,
        variant: "highlight",
      },
      {
        title: "Prestação de Contas",
        description: "Relatórios e contas públicas.",
        href: "/prefeitura/prestacao-contas",
        Icon: PieChart,
      },
      {
        title: "Contratos",
        description: "Íntegra dos contratos vigentes.",
        href: "/prefeitura/contratos",
        Icon: Handshake,
      },
      {
        title: "Obras Públicas",
        description: "Acompanhamento das obras no município.",
        href: "/prefeitura/obras-publicas",
        Icon: HardHat,
        variant: "highlight",
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