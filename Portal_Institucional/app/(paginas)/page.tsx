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
  ArrowRight,
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

      {/* ─── BANNER DE DESTAQUE: ORÇAMENTO PARTICIPATIVO 2027 ─── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-16 -mt-8 sm:-mt-12 mb-8 relative z-30">
        <div className="bg-gradient-to-r from-blue-900 via-[#173572] to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-yellow-400/50 flex flex-col md:flex-row items-center justify-between gap-6 transition-all transform hover:scale-[1.005]">
          
          <div className="flex items-start sm:items-center gap-4">
            <div className="bg-yellow-400 text-blue-950 p-3.5 sm:p-4 rounded-2xl shrink-0 shadow-lg font-black animate-pulse">
              <Vote size={32} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-wider mb-2 border border-yellow-400/30">
                🚨 CONSULTA PÚBLICA ABERTA
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                ORÇAMENTO PARTICIPATIVO 2027
              </h2>
              <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1 max-w-2xl leading-relaxed">
                A Prefeitura de Padre Marcos convida você a opinar na elaboração da Lei Orçamentária Anual (LOA 2027). Indique as áreas prioritárias para o desenvolvimento da cidade!
              </p>
            </div>
          </div>

          <a
            href="/orcamento-participativo-2027"
            className="inline-flex items-center justify-center gap-2 bg-[#FFD84D] hover:bg-yellow-300 text-blue-950 font-extrabold py-3.5 px-7 rounded-2xl transition-all shadow-xl text-sm sm:text-base shrink-0 w-full md:w-auto hover:translate-x-1"
          >
            Participar Agora
            <ArrowRight size={18} />
          </a>

        </div>
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

      {/* ─── Notícias ─── */}
      <HomeNewsSection />

    </div>
  );
}
