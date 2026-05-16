import ContentPage from "@/components/layout/ContentPage";
import {
  Accessibility,
  FileText,
  CheckCircle,
  Keyboard,
  Languages,
  Type,
  MousePointer2,
  MessageCircle,
  ShieldCheck,
  Info
} from "lucide-react";

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
      lastUpdate="2026-05-15"
    >
      {/* 1. INTRODUÇÃO / DECLARAÇÃO */}
      <div className="mb-12">
        <div className="bg-[#173572] text-white p-5 rounded-2xl shadow-sm mb-6 flex items-start sm:items-center gap-4 border-l-4 border-blue-400">
          <Info size={28} className="shrink-0 text-blue-200 mt-0.5 sm:mt-0" />
          <p className="font-medium text-[15px] sm:text-base leading-relaxed">
            Este portal segue as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) e o Modelo de Acessibilidade em Governo Eletrônico (eMAG).
          </p>
        </div>
        <p className="text-gray-600 leading-relaxed max-w-4xl">
          Nosso objetivo é garantir que qualquer cidadão possa acessar as informações públicas de forma autônoma, independentemente de limitações visuais, auditivas, motoras ou cognitivas.
        </p>
      </div>

      {/* 2. RECURSOS PRINCIPAIS (GRID DE CARDS) */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#173572] mb-6 flex items-center gap-2">
          <ShieldCheck size={22} /> Recursos de Acessibilidade
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card: Barra de Acessibilidade */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-xl text-[#173572]">
                <Type size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Personalização Visual</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Utilize a barra no topo do site para ajustar o portal às suas necessidades:</p>
            <ul className="space-y-2">
              {["Aumentar e reduzir o tamanho do texto", "Ativar o modo de alto contraste (cores escuras)", "Acesso rápido a esta página"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle size={14} className="text-green-600 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Card: VLibras */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-xl text-[#173572]">
                <Languages size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Tradução para Libras</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Disponibilizamos o <strong>VLibras</strong> em todas as páginas. O recurso traduz automaticamente os conteúdos para a Língua Brasileira de Sinais, facilitando o acesso para pessoas surdas.
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-[11px] text-gray-500 font-medium">COMO USAR: Clique no ícone azul flutuante à direita e selecione o texto.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO E DOCUMENTOS (LISTA MODERNA) */}
      <div className="mb-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col h-full">
          <h2 className="text-xl font-bold text-[#173572] mb-6 flex items-center gap-2">
            <MousePointer2 size={22} /> Navegação Técnica
          </h2>
          <div className="bg-linear-to-br from-white to-blue-50/30 border border-blue-100 rounded-2xl p-4 shadow-sm h-full">
            {[
              { title: "Navegação por Teclado", desc: "Uso total da tecla TAB para percorrer links e botões." },
              { title: "Links de Atalho", desc: "Saltos diretos para conteúdo, menu e busca." },
              { title: "Leitores de Tela", desc: "Código semântico otimizado para softwares de voz." },
              { title: "Interface Responsiva", desc: "Adaptável para celulares, tablets e desktops." },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-blue-50/30 transition-all">
                <div className="bg-blue-100/50 text-[#173572] w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col h-full">
          <h2 className="text-xl font-bold text-[#173572] mb-6 flex items-center gap-2">
            <FileText size={22} /> Documentos Acessíveis
          </h2>
          <div className="bg-linear-to-br from-white to-blue-50/30 border border-blue-100 rounded-2xl p-6 shadow-sm h-full">
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Nossos documentos são publicados, sempre que possível, em formatos que permitem:
            </p>
            <div className="grid grid-cols-1 gap-1">
              {[
                "Seleção e pesquisa interna de texto",
                "Leitura por softwares de voz",
                "Formato aberto e não proprietário",
                "Estrutura de tópicos navegável"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-gray-700 py-1.5">
                  <CheckCircle size={16} className="text-[#173572]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ATALHOS */}
      <div className="mb-7 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-[#173572] mb-5">Atalhos de teclado</h2>

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="grid grid-cols-[100px_1fr] gap-2.5 py-3 px-4 bg-gray-50 border-b border-gray-200">
            <span className="text-xs font-medium text-gray-500">Atalho</span>
            <span className="text-xs font-medium text-gray-500">Ação</span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-2.5 py-3 px-4 border-b border-gray-200 text-sm text-[#374151]">
            <div><span className="font-mono text-xs bg-[#f3f4f6] border border-gray-200 rounded px-2 py-0.5 text-[#173572]">Alt + 1</span></div>
            <span>Conteúdo principal</span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-2.5 py-3 px-4 border-b border-gray-200 text-sm text-[#374151]">
            <div><span className="font-mono text-xs bg-[#f3f4f6] border border-gray-200 rounded px-2 py-0.5 text-[#173572]">Alt + 2</span></div>
            <span>Menu principal</span>
          </div>

          <div className="grid grid-cols-[100px_1fr] items-center gap-2.5 py-3 px-4 text-sm text-[#374151]">
            <div><span className="font-mono text-xs bg-[#f3f4f6] border border-gray-200 rounded px-2 py-0.5 text-[#173572]">Alt + 3</span></div>
            <span>Busca</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-5 bg-blue-50/60 rounded-2xl px-4 py-3 border border-blue-100">
          Em alguns navegadores, utilize <span className="font-mono">Alt + Shift + número</span>.
        </p>
      </div>

      {/* 5. CONTATO (CALL TO ACTION) */}
      <div className="bg-[#173572] rounded-3xl p-8 sm:p-10 text-center text-white shadow-xl shadow-[#173572]/20 relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
            <MessageCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Encontrou alguma barreira?</h2>
          <p className="text-blue-100 max-w-2xl mx-auto mb-8 text-[15px] leading-relaxed">
            Seu feedback é fundamental para nossa melhoria. Caso tenha dificuldades de acesso ou sugestões de acessibilidade, entre em contato conosco.
          </p>
          <a
            href="/ouvidoria"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#173572] font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
          >
            Acessar Ouvidoria Municipal
            <CheckCircle size={18} />
          </a>
        </div>
      </div>
    </ContentPage>
  );
}
