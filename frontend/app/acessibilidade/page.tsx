import ContentPage from "../../components/layout/ContentPage";
import { Accessibility } from "lucide-react";

export default function AcessibilidadePage() {
  return (
    <ContentPage
      title="Acessibilidade"
      icon={<Accessibility size={20} strokeWidth={1.5} />}
      description="Este portal foi desenvolvido buscando garantir acesso às informações públicas para todos os cidadãos, respeitando diferentes necessidades de navegação e acessibilidade."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Acessibilidade" },
      ]}
      lastUpdate="2026-04-07"
      responsavel="Prefeitura Municipal"
    >
      {/* DECLARAÇÃO */}
      <div className="mb-7">
        <p className="text-base sm:text-lg leading-relaxed text-[#374151] m-0">
          Este portal foi desenvolvido com base nas Diretrizes de Acessibilidade para Conteúdo Web (WCAG) e nas recomendações do Modelo de Acessibilidade em Governo Eletrônico (eMAG), buscando garantir que qualquer cidadão possa acessar as informações públicas, independentemente de limitações visuais, auditivas, motoras ou cognitivas.
        </p>
      </div>

      {/* SÍMBOLO */}
      <div className="mb-7">
        <h2 className="text-lg sm:text-[19px] font-medium text-[#173572] mb-2.5 pb-1.5 border-b-[2px] border-[#e8edf7]">
          Símbolo de acessibilidade
        </h2>
        <p className="text-base sm:text-lg text-[#374151]">
          O símbolo de acessibilidade presente no site permite acesso rápido a esta página e aos recursos disponíveis, facilitando a navegação para todos os usuários.
        </p>
      </div>

      {/* BARRA */}
      <div className="mb-7">
        <h2 className="text-lg sm:text-[19px] font-medium text-[#173572] mb-2.5 pb-1.5 border-b-[2px] border-[#e8edf7]">
          Barra de acessibilidade
        </h2>
        <ul className="pl-[18px] text-base sm:text-lg text-[#374151] list-disc">
          <li>Aumentar e reduzir o tamanho do texto (A+, A- e padrão)</li>
          <li>Ativar o modo de alto contraste</li>
          <li>Acessar rapidamente esta página de acessibilidade</li>
        </ul>
      </div>

      {/* VLIBRAS */}
      <div className="mb-7">
        <h2 className="text-lg sm:text-[19px] font-medium text-[#173572] mb-2.5 pb-1.5 border-b-[2px] border-[#e8edf7]">
          Tradução para Libras
        </h2>
        <p className="text-base sm:text-lg text-[#374151]">
          Este portal disponibiliza o recurso VLibras, presente em todas as páginas, que permite traduzir automaticamente os conteúdos digitais para a Língua Brasileira de Sinais (Libras), facilitando o acesso para pessoas surdas.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Para utilizar, clique no ícone do VLibras disponível na tela e selecione o conteúdo que deseja traduzir.
        </p>
      </div>

      {/* RECURSOS */}
      <div className="mb-7">
        <h2 className="text-lg sm:text-[19px] font-medium text-[#173572] mb-2.5 pb-1.5 border-b-[2px] border-[#e8edf7]">
          Recursos de acessibilidade disponíveis
        </h2>
        <ul className="pl-[18px] text-base sm:text-lg text-[#374151] list-disc">
          <li>Navegação completa por teclado</li>
          <li>Links de atalho para conteúdo, menu e busca</li>
          <li>Compatibilidade com leitores de tela</li>
          <li>Interface responsiva para diferentes dispositivos</li>
          <li>Mapa do site institucional para navegação estruturada</li>
        </ul>
      </div>

      {/* ATALHOS */}
      <div className="mb-7">
        <h2 className="text-lg sm:text-[19px] font-medium text-[#173572] mb-2.5 pb-1.5 border-b-[2px] border-[#e8edf7]">
          Atalhos de teclado
        </h2>

        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <div className="grid grid-cols-[100px_1fr] gap-2.5 py-2 px-3.5 bg-[#f9fafb] border-b border-[#e5e7eb]">
            <span className="text-xs font-medium text-gray-500">Atalho</span>
            <span className="text-xs font-medium text-gray-500">Ação</span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-2.5 py-2 px-3.5 border-b text-sm text-[#374151]">
            <div><span className="font-mono text-xs bg-[#f3f4f6] border rounded px-2 py-0.5 text-[#173572]">Alt + 1</span></div>
            <span>Conteúdo principal</span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-2.5 py-2 px-3.5 border-b text-sm text-[#374151]">
            <div><span className="font-mono text-xs bg-[#f3f4f6] border rounded px-2 py-0.5 text-[#173572]">Alt + 2</span></div>
            <span>Menu principal</span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-2.5 py-2 px-3.5 text-sm text-[#374151]">
            <div><span className="font-mono text-xs bg-[#f3f4f6] border rounded px-2 py-0.5 text-[#173572]">Alt + 3</span></div>
            <span>Busca</span>
          </div>
        </div>

        <p className="text-[12px] text-gray-500 mt-2.5 py-2 px-3 bg-[#f8faff] border-l-2 border-[#173572]">
          Em alguns navegadores, utilize <span className="font-mono">Alt + Shift + número</span>.
        </p>
      </div>

      {/* CONTATO */}
      <div className="mb-7">
        <h2 className="text-lg sm:text-[19px] font-medium text-[#173572] mb-2.5 pb-1.5 border-b-[2px] border-[#e8edf7]">
          Fale sobre acessibilidade
        </h2>
        <p className="text-base sm:text-lg text-[#374151] mb-4">
          Caso encontre dificuldades de acesso ou tenha sugestões de melhoria, entre em contato com a Prefeitura por meio da Ouvidoria. Seu feedback é essencial para o aprimoramento contínuo deste portal.
        </p>
        <a
          href="/ouvidoria"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white text-sm font-medium rounded-lg hover:bg-[#0f2847] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173572]"
        >
          Acessar Ouvidoria
        </a>
      </div>
    </ContentPage>
  );
}