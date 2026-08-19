import TransparencyCard from "@/components/ui/Card";
import TransparencySection from "@/components/transparencia/Section";
import DashboardResumo from "@/components/ui/Hero";
import HomeNewsSection from "@/components/news/HomeNewsSection";

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
  HeartPulse,
  Vote,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

type CardItem = {
  title: string;
  description: string;
  href: string;
  Icon: LucideIcon;
  variant?: "highlight";
  featured?: boolean;
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
        title: "Orçamento Participativo 2027",
        description: "Participe da elaboração do Orçamento Municipal (LOA 2027).",
        href: "/orcamento-participativo-2027",
        Icon: Vote,
        variant: "highlight",
        featured: true,
      },
      {
        title: "Certidão Negativa",
        description: "Emissão de Certidões Negativas de Débito.",
        href: "http://picontreina2.dcfiorilli.com.br:8084/servicosweb/home.jsf",
        Icon: FileCheck,
        featured: true,
      },
      {
        title: "Nota Fiscal Eletrônica",
        description: "Emissão de Nota Fiscal Eletrônica.",
        href: "https://picontreina2.dcfiorilli.com.br:8447/issweb/home",
        Icon: Receipt,
        variant: "highlight",
        featured: true,
      },
      {
        title: "Portal do Contribuinte",
        description: "Acesso aos serviços do contribuinte.",
        href: "http://picontreina2.dcfiorilli.com.br:8084/servicosweb/home.jsf",
        Icon: Landmark,
        variant: "highlight",
        featured: true,
      },
      {
        title: "Serviços de Saúde (e-SUS)",
        description: "Acesso ao sistema e-SUS da atenção básica.",
        href: "https://esus.padremarcos.pi.gov.br/",
        Icon: HeartPulse,
      },
      {
        title: "Carta de Serviços",
        description: "Guia completo de serviços oferecidos.",
        href: "/carta-servicos",
        Icon: BookOpen,
        variant: "highlight",
      },
      {
        title: "Portal do Servidor",
        description: "Acesso exclusivo para servidores municipais.",
        href: "https://transparencia.padremarcos.pi.gov.br/transparencia/recursos-humanos/servidores",
        Icon: IdCard,
      },
      {
        title: "Contracheque Online",
        description: "Emissão de contracheque online.",
        href: "https://picontreina2.dcfiorilli.com.br:8447/sipweb/",
        Icon: Banknote,
      },
    ],
  },

  {
    title: "Acesso Rápido",
    cards: [
      {
        title: "Orçamento Participativo 2027",
        description: "Consulta pública para prioridades do Orçamento Municipal.",
        href: "/orcamento-participativo-2027",
        Icon: Vote,
        variant: "highlight",
        featured: true,
      },
      {
        title: "Portal da Transparência",
        description: "Acompanhe as receitas e despesas do município.",
        href: "https://transparencia.padremarcos.pi.gov.br/",
        Icon: Eye,
        variant: "highlight",
        featured: true,
      },
      {
        title: "E-sic (Acesso à Informação)",
        description: "Serviço de Informação ao Cidadão.",
        href: "/esic",
        Icon: Info,
        featured: true,
      },
      {
        title: "Ouvidoria",
        description: "Canal de comunicação direta com a prefeitura.",
        href: "/ouvidoria",
        Icon: MessageSquare,
        featured: true,
      },
      {
        title: "Licitações",
        description: "Acompanhe os processos licitatórios.",
        href: "https://transparencia.padremarcos.pi.gov.br/S3-Compras_Cont_e_Conven/licitacoes",
        Icon: Gavel,
      },      
      {
        title: "Diário Oficial",
        description: "Acesso às publicações oficiais do município.",
        href: "https://www.diarioficialdosmunicipios.org/consulta/ConPublicacaoGeral/ConPublicacaoGeral.php",
        Icon: Newspaper,
        variant: "highlight",
      }, 
      {
        title: "Concursos e Processo Seletivos",
        description: "Informações sobre concursos e seletivos.",
        href: "https://transparencia.padremarcos.pi.gov.br/transparencia/concursos",
        Icon: Briefcase,
        variant: "highlight",
      },
    ],
  },

  {
    title: "Informações Institucionais",
    cards: [
      {
        title: "Estrutura Organizacional",
        description: "Conheça a organização da prefeitura.",
        href: "/estrutura-organizacional",
        Icon: Building2,
        variant: "highlight",
        featured: true,
      },
      {
        title: "Prestação de Contas",
        description: "Relatórios e contas públicas.",
        href: "https://transparencia.padremarcos.pi.gov.br/transparencia/relatorios",
        Icon: PieChart,
        featured: true,
      },
      {
        title: "Contratos",
        description: "Íntegra dos contratos vigentes.",
        href: "https://transparencia.padremarcos.pi.gov.br/transparencia/contratos",
        Icon: Handshake,
        featured: true,
      },
      {
        title: "Obras Públicas",
        description: "Acompanhamento das obras no município.",
        href: "https://transparencia.padremarcos.pi.gov.br/transparencia/obras",
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

      {/* ─── Notícias ─── */}
      <HomeNewsSection />

    </div>
  );
}
