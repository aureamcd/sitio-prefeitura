import ContentPage from "@/components/layout/ContentPage";
import { Map, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTodayDate } from '@/lib/utils/date';

type SiteLink = {
  href: string;
  label: string;
  external?: boolean;
  description?: string;
};

const sections: { title: string; icon?: string; links: SiteLink[] }[] = [
  {
    title: "Início",
    links: [
      { href: "/", label: "Página Inicial do Portal da Transparência", description: "Dashboard com indicadores e cards de navegação por seção" },
    ],
  },
  {
    title: "Informações Institucionais",
    links: [
      { href: "https://padremarcos.pi.gov.br/estrutura-organizacional", label: "Estrutura Organizacional", external: true, description: "Organograma, secretarias, responsáveis e contatos" },
      { href: "/transparencia/legislacao", label: "Legislação e Atos Normativos", description: "Leis, decretos, portarias e atos normativos municipais" },
      { href: "/faq", label: "Perguntas Frequentes (FAQ)", description: "Dúvidas mais comuns sobre serviços e transparência" },
    ],
  },
  {
    title: "Execução Orçamentária e Financeira",
    links: [
      { href: "/#secao-1/receitas", label: "Receitas", description: "Previsão, arrecadação, classificação por natureza, dívida ativa e receitas extra-orçamentárias" },
      { href: "/#secao-1/despesas", label: "Despesas", description: "Empenhos, liquidações, pagamentos, despesas extra-orçamentárias e restos a pagar" },
      { href: "/#secao-1/renuncias-de-receitas", label: "Renúncias de Receita", description: "Desonerações tributárias, isenções fiscais e beneficiários" },
    ],
  },
  {
    title: "Compras, Contratos e Transferências",
    links: [
      { href: "/#secao-2/licitacoes", label: "Licitações", description: "Editais, atas, dispensas, inexigibilidades e licitantes sancionados" },
      { href: "/transparencia/contratos", label: "Contratos", description: "Íntegra dos contratos vigentes, aditivos, fiscais e ordem cronológica de pagamentos" },
      { href: "/transparencia/transferencias", label: "Transferências e Convênios", description: "Consultas de Receitas da União, Receitas do Estado e transferências financeiras entre entidades municipais" },
    ],
  },
  {
    title: "Obras e Infraestrutura",
    links: [
      { href: "/transparencia/obras", label: "Obras Públicas", description: "Situação, empresas contratadas, valores e relação de obras paralisadas" },
    ],
  },
  {
    title: "Gestão de Pessoas e Benefícios",
    links: [
      { href: "/transparencia/recursos-humanos", label: "Recursos Humanos", description: "Relação nominal de servidores, cargos, remunerações e terceirizados" },
      { href: "/transparencia/recursos-humanos/servidores", label: "Servidores Municipais", description: "Lista detalhada de servidores com cargo, lotação e remuneração" },
      { href: "/transparencia/recursos-humanos/servidores", label: "Servidores Municipais", description: "Lista detalhada de servidores com cargo, lotação e remuneração" },
      { href: "/transparencia/recursos-humanos/diarias", label: "Diárias e Passagens", description: "Beneficiários, valores, destinos e motivos de afastamento" },
      { href: "/transparencia/concursos", label: "Concursos e Seleções Públicas", description: "Editais, resultados, aprovados e nomeações" },
      { href: "/transparencia/diarias", label: "Diárias", description: "Tabela de valores e registro de diárias concedidas" },
    ],
  },
  {
    title: "Planejamento e Prestação de Contas",
    links: [
      { href: "/transparencia/relatorios", label: "Relatórios e Contas Públicas", description: "PPA, LDO, LOA, RGF, RREO, Balanço Geral e Relatórios de Gestão" },
      { href: "/transparencia/emendas", label: "Emendas Parlamentares", description: "Recebimento e execução de emendas, incluindo emendas pix" },
    ],
  },
  {
    title: "Atividades Finalísticas",
    links: [
      { href: "/atividades/saude", label: "Saúde", description: "Plano Municipal de Saúde, escala de médicos, lista de espera e medicamentos" },
      { href: "/atividades/educacao", label: "Educação", description: "Plano Municipal de Educação, lista de espera em creches e resultados" },
      { href: "/atividades/assistencia", label: "Assistência Social", description: "Programas sociais, CRAS, CadÚnico e benefícios" },
      { href: "/atividades/demais", label: "Demais Programas e Ações", description: "Outras políticas públicas e programas municipais" },
    ],
  },
  {
    title: "Serviços ao Cidadão",
    links: [
      { href: "/carta-servicos", label: "Carta de Serviços ao Usuário", description: "Relação completa dos serviços públicos municipais" },
      { href: "/faq", label: "Perguntas Frequentes (FAQ)", description: "Respostas para dúvidas comuns sobre os serviços" },
    ],
  },
  {
    title: "Acesso à Informação e Controle Social",
    links: [
      { href: "/LAI", label: "Lei de Acesso à Informação", description: "Direitos, prazos e procedimentos para acesso a informações públicas" },
      { href: "https://padremarcos.pi.gov.br/esic", external: true, label: "e-SIC (Solicitar Informação)", description: "Sistema eletrônico para pedidos de acesso à informação" },
      { href: "https://padremarcos.pi.gov.br/esic/consultar", external: true, label: "Consultar Manifestação e-SIC", description: "Acompanhe o andamento do seu pedido de informação" },
      { href: "/ouvidoria", label: "Ouvidoria Municipal", description: "Canal para denúncias, reclamações, sugestões e elogios" },
      { href: "/ouvidoria/consultar", label: "Consultar Manifestação Ouvidoria", description: "Acompanhe o andamento da sua manifestação" },
      { href: "/regulamentacao-lai", label: "Regulamentação da LAI", description: "Decreto municipal que regulamenta a Lei de Acesso à Informação" },
      { href: "/regulamentacao-governo-digital", label: "Regulamentação do Governo Digital", description: "Decreto municipal que regulamenta a Lei Federal nº 14.129/2021 (Governo Digital)" },
      { href: "/informacoes-classificadas", label: "Informações Classificadas e Desclassificadas", description: "Rol de documentos classificados ou desclassificados" },
      { href: "/dados-abertos", label: "Dados Abertos", description: "Bases de dados públicos em formatos estruturados e reutilizáveis" },
      { href: "/transparencia/pesquisa-satisfacao", label: "Pesquisa de Satisfação", description: "Avalie o Portal da Transparência e ajude-nos a melhorar" },
      { href: "/lgpd", label: "Política de Privacidade (LGPD)", description: "Proteção de dados pessoais e informações do encarregado (DPO)" },
    ],
  },
  {
    title: "Acessibilidade e Navegação",
    links: [
      { href: "/acessibilidade", label: "Acessibilidade", description: "Recursos e declaração de acessibilidade do portal" },
      { href: "/mapa-do-site", label: "Mapa do Site", description: "Estrutura completa de navegação do portal" },
    ],
  },
  {
    title: "Links Externos",
    links: [
      { href: "https://padremarcos.pi.gov.br", label: "Portal Institucional da Prefeitura", external: true, description: "Site oficial da Prefeitura Municipal de Padre Marcos" },
      { href: "https://padremarcos.pi.gov.br/diario-oficial", label: "Diário Oficial do Município", external: true, description: "Publicações oficiais e atos municipais" },
      { href: "https://radardatransparencia.atricon.org.br", label: "Radar Nacional da Transparência Pública", external: true, description: "Acompanhamento do PNTP" },
      { href: "https://falabr.cgu.gov.br", label: "Fala.BR - Plataforma Integrada de Ouvidoria e Acesso à Informação", external: true, description: "Sistema oficial do governo federal" },
    ],
  },
];

export default function MapaDoSitePage() {
  return (
    <ContentPage
      title="Mapa do Site"
      icon={<Map size={20} strokeWidth={1.5} />}
      description="Navegação estruturada por todas as páginas e seções do Portal da Transparência de Padre Marcos - PI, organizada conforme os critérios do PNTP 2026."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Mapa do Site" },
      ]}
      lastUpdate={getTodayDate()}
    >
      {/* Observação sobre conformidade */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium">
          Este mapa do site atende ao critério do PNTP 2026 (Programa Nacional de Transparência Pública),
          organizando a estrutura completa de links e seções do portal para facilitar a navegação e localização
          de informações por parte do cidadão.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((section) => (
          <section key={section.title} className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
            <h2 className="mb-3 text-base font-bold text-[#173572]">{section.title}</h2>
            <ul className="space-y-2.5 border-0 pl-0 py-0 my-0">
              {section.links.map((item) => (
                <li key={`${section.title}-${item.href}`} className="before:content-none">
                  <Link
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="group block"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-[#173572] group-hover:underline underline-offset-2 transition-colors">
                      {item.label}
                      {item.external && <ExternalLink size={13} aria-hidden="true" />}
                    </span>
                    {item.description && (
                      <span className="block text-xs text-gray-500 mt-0.5 ml-0 leading-relaxed">
                        {item.description}
                      </span>
                    )}
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
