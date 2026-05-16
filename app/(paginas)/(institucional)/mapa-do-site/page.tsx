import ContentPage from "@/components/layout/ContentPage";
import { Map, ExternalLink } from "lucide-react";
import Link from "next/link";

const sections = [
  {
    title: "Atendimento ao cidadão",
    links: [
      { href: "/esic", label: "e-SIC" },
      { href: "/ouvidoria", label: "Ouvidoria e Fale Conosco" },
      { href: "/carta-servicos", label: "Carta de Serviços" },
      { href: "/contatos-atendimento", label: "Contatos e Atendimento" },
    ],
  },
  {
    title: "Transparência",
    links: [
      { href: "/acesso-informacao", label: "Acesso à Informação" },
      { href: "/regulamentacao-lai", label: "Regulamentação da LAI" },
      { href: "/leis-normas", label: "Leis e Normas" },
      { href: "https://transparencia.padremarcos.pi.gov.br/transparencia/", label: "Portal da Transparência", external: true },
    ],
  },
  {
    title: "Prefeitura",
    links: [
      { href: "/estrutura-organizacional", label: "Estrutura Organizacional" },
      { href: "/competencias", label: "Competências" },
      { href: "/gestao", label: "Gestão" },
      { href: "/FAQ", label: "Perguntas Frequentes" },
    ],
  },
  {
    title: "Publicações e notícias",
    links: [
      { href: "/noticias", label: "Notícias" },
      { href: "/editais", label: "Editais" },
      { href: "/atas-reunioes", label: "Atas de Reuniões" },
      { href: "/avisos-comunicados", label: "Avisos e Comunicados" },
      { href: "/diversas", label: "Publicações Diversas" },
      { href: "/diario-oficial", label: "Diário Oficial" },
    ],
  },
  {
    title: "Acessibilidade e privacidade",
    links: [
      { href: "/acessibilidade", label: "Acessibilidade" },
      { href: "/lgpd", label: "Política de Privacidade (LGPD)" },
      { href: "/mapa-do-site", label: "Mapa do Site" },
    ],
  },
];

export default function MapaDoSitePage() {
  return (
    <ContentPage
      title="Mapa do Site"
      icon={<Map size={20} strokeWidth={1.5} />}
      description="Navegação estruturada pelas principais áreas do portal institucional."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Mapa do Site" },
      ]}
      lastUpdate="2026-05-15"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
            <h2 className="mb-3 text-base font-bold text-[#173572]">{section.title}</h2>
            <ul className="space-y-2 border-0 pl-0 py-0 my-0">
              {section.links.map((item) => (
                <li key={`${section.title}-${item.href}`} className="before:content-none">
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#173572] hover:underline underline-offset-2"
                  >
                    {item.label}
                    {item.external && <ExternalLink size={13} aria-hidden="true" />}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </ContentPage>
  );
}
