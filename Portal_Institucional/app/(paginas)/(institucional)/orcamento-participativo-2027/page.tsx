import ContentPage from "@/components/layout/ContentPage";
import { Vote, Landmark, ExternalLink, Info, CheckCircle2, ShieldCheck } from "lucide-react";

export default function OrcamentoParticipativoPage() {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdgeW-YV26gqGiW217qsgJ2i7NF4Hwa5zP_VamBBXyVPJs6_A/viewform?embedded=true";
  const formDirectUrl = "https://docs.google.com/forms/d/e/1FAIpQLSdgeW-YV26gqGiW217qsgJ2i7NF4Hwa5zP_VamBBXyVPJs6_A/viewform";

  return (
    <ContentPage
      title="Orçamento Participativo 2027"
      icon={<Vote size={20} strokeWidth={1.5} />}
      description="Consulta Pública On-line para a elaboração do Projeto de Lei Orçamentária Anual (LOA 2027) do Município de Padre Marcos - PI."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Orçamento Participativo 2027" },
      ]}
      lastUpdate="2026-08-18"
    >
      {/* 1. APRESENTAÇÃO E CONVITE OFICIAL */}
      <div className="mb-8 bg-linear-to-br from-blue-900 via-[#173572] to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-extrabold uppercase tracking-wider mb-4 border border-yellow-400/30">
            <Landmark size={14} /> Consulta Pública Aberta
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
            ORÇAMENTO PARTICIPATIVO 2027
          </h2>

          <p className="text-blue-100 text-base sm:text-lg leading-relaxed font-medium mb-6">
            A <strong>Prefeitura Municipal de Padre Marcos - PI</strong> convida toda a população a participar ativamente da elaboração da <strong>Lei Orçamentária Anual (LOA) para o exercício de 2027</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-sm text-blue-50">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <span>Indique as prioridades de investimento para seu bairro ou comunidade.</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-yellow-400 shrink-0 mt-0.5" />
              <span>Participação garantida tanto para moradores da zona urbana quanto rural.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TEXTO EXPLICATIVO E EMBASAMENTO LEGAL */}
      <div className="mb-10 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Info className="text-[#173572]" size={20} /> Sobre a Consulta Pública
          </h3>
          <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
            Esta consulta pública tem como objetivo ouvir a comunidade e identificar quais áreas devem receber maior investimento no próximo ano. Por meio deste formulário, você pode indicar prioridades e sugerir ações importantes para o desenvolvimento do município.
          </p>
        </div>

        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          Com o compromisso de qualificar os serviços públicos e garantir voz e protagonismo aos cidadãos, a Prefeitura adota mecanismos de participação social que permitem conhecer as necessidades reais dos moradores, tanto da zona urbana quanto da zona rural.
        </p>

        {/* Amparo Legal */}
        <div className="bg-amber-50/80 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-950 text-sm">
          <p className="font-semibold flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-amber-700" /> Amparo Legal (Lei de Responsabilidade Fiscal)
          </p>
          <p className="text-amber-900 leading-relaxed">
            A presente consulta atende ao disposto no <strong>art. 48 da Lei Complementar nº 101/2000 (LRF)</strong>, que determina a transparência e a participação popular na gestão orçamentária municipal.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-[#173572] text-sm leading-relaxed">
          <p className="font-semibold mb-1">Convite da Secretaria Municipal de Administração e Planejamento:</p>
          <p>
            A Secretaria Municipal de Administração e Planejamento tem a satisfação de convidar todos os interessados a participar da Consulta Pública On-line do Orçamento Municipal 2027, respondendo o questionário a seguir. Sua participação é simples, rápida e essencial para construirmos juntos um município melhor.
          </p>
          <p className="font-bold text-[#173572] mt-3 text-base">
            Participe. Sua opinião faz a diferença!
          </p>
        </div>
      </div>

      {/* 3. BOTÃO DE ABERTURA DIRETA */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5">
        <div>
          <h4 className="font-bold text-gray-900 text-sm">Preencher Formulário da Consulta</h4>
          <p className="text-xs text-gray-500">Responda diretamente abaixo ou abra em uma nova aba no seu navegador.</p>
        </div>
        <a
          href={formDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173572] hover:bg-blue-900 text-white font-bold text-xs sm:text-sm transition-all shadow-xs"
        >
          <ExternalLink size={16} />
          Abrir Formulário em Nova Aba
        </a>
      </div>

      {/* 4. FORMULÁRIO GOOGLE FORMS INCORPORADO */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden p-2 sm:p-4">
        <iframe
          src={formUrl}
          width="100%"
          height="1200"
          className="w-full min-h-[900px] border-0 rounded-xl"
          title="Formulário do Orçamento Participativo 2027"
        >
          Carregando formulário...
        </iframe>
      </div>
    </ContentPage>
  );
}
