import ContentPage from "@/components/layout/ContentPage";
import { MessageCircle, ExternalLink } from "lucide-react";

export default function OuvidoriaPage() {
  return (
    <ContentPage
      title="Ouvidoria"
      icon={<MessageCircle size={20} strokeWidth={1.5} />}
      description="Canal oficial para envio de manifestações sobre os serviços públicos municipais."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Ouvidoria" },
      ]}
      lastUpdate="2026-04-30"
      responsavel="Prefeitura Municipal"
    >

      {/* INTRO */}
      <div className="mb-7 flex flex-col gap-4">
        <p>
          A Ouvidoria Municipal é a unidade responsável por receber, analisar e encaminhar manifestações da sociedade, atuando como instrumento de participação e controle social.
        </p>
        <p>
          A Ouvidoria é o canal de comunicação entre o cidadão e a Prefeitura,
          destinado ao recebimento de manifestações relacionadas aos serviços públicos,
          contribuindo para a melhoria contínua da gestão municipal.
        </p>
      </div>

      {/* 📍 ATENDIMENTO PRESENCIAL (CRITÉRIO 14.1) */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Atendimento presencial
        </h2>

        <ul>
          <li><strong>Endereço:</strong> Rua Anfrísio Macedo, 150, Centro – CEP 64.680-000</li>
          <li><strong>Telefone:</strong> (89) 98116-0296</li>
          <li><strong>Horário de funcionamento:</strong> Segunda a sexta, das 7h às 12h</li>
        </ul>
      </div>

      {/* 🧾 TIPOS DE MANIFESTAÇÃO (CRITÉRIO 14.2) */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Tipos de manifestação
        </h2>

        <ul>
          <li><strong>Denúncia:</strong> comunicação de irregularidades</li>
          <li><strong>Reclamação:</strong> insatisfação com serviços públicos</li>
          <li><strong>Solicitação:</strong> pedido de providência em serviços</li>
          <li><strong>Sugestão:</strong> proposta de melhoria</li>
          <li><strong>Elogio:</strong> reconhecimento de bom atendimento</li>
        </ul>
      </div>

      {/* ⚠️ DIFERENCIAÇÃO DO E-SIC (CRÍTICO) */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Diferença entre Ouvidoria e e-SIC
        </h2>

        <div className="bg-[#f8faff] border border-[#e5e7eb] border-l-[4px] border-l-[#173572] p-4 rounded-r-lg shadow-sm">
          <p className="text-[#374151] mb-3">
            A Ouvidoria é destinada ao recebimento de manifestações sobre os serviços públicos,
            como reclamações, denúncias e sugestões.
          </p>

          <p className="text-[#173572] text-[15px] leading-relaxed">
            Para solicitações de acesso à informação (Lei de Acesso à Informação),
            utilize o sistema específico do <a href="/esic" className="font-bold underline decoration-2 underline-offset-2 hover:text-[#0f2847] transition-colors">e-SIC</a> disponível no portal.
          </p>
        </div>
      </div>

      {/* 💻 CANAL ELETRÔNICO */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Registrar manifestação
        </h2>

        <p className="mb-4">
          Você pode registrar denúncias, reclamações, solicitações, sugestões e elogios por meio do sistema eletrônico de Ouvidoria:
        </p>
        <p className="mb-4 text-sm text-gray-500">
          Você será redirecionado para o sistema oficial do Governo Federal (Fala.BR).
        </p>

        <a
          href="https://falabr.cgu.gov.br/web/home"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-lg hover:bg-[#0f2847] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#173572]"
          aria-label="Registrar manifestação no sistema externo Fala.BR"
        >
          Registrar manifestação
          <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>



      {/* 📄 CARTA DE SERVIÇOS (CRITÉRIO 14.3) */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Carta de Serviços ao Usuário
        </h2>

        <p className="mb-4">
          A Carta de Serviços ao Usuário apresenta os serviços prestados pela Prefeitura,
          formas de acesso e prazos de atendimento.
        </p>

        <a
          href="/carta-de-servicos"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-[#173572] border border-[#173572] rounded-lg"
        >
          Acessar Carta de Serviços
        </a>
      </div>

      {/* PRAZO */}
      <div className="mb-7">
        <h2 className="text-lg font-medium text-[#173572] mb-2 border-b border-[#e8edf7] pb-1">
          Prazo de resposta
        </h2>

        <p>
          As manifestações registradas serão analisadas e respondidas no prazo de até <strong>30 dias</strong>,
          podendo ser prorrogado de forma justificada, conforme a legislação vigente.
        </p>
      </div>

    </ContentPage>
  );
}