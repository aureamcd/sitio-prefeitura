"use client";

import ContentPage from "@/components/layout/ContentPage";
import {
  BookOpen,
  Send,
  MapPin,
  Clock,
  ListOrdered,
  ScrollText,
  BarChart3,
  ShieldCheck,
  Lock,
} from "lucide-react";

export default function AcessoInformacaoPage() {
  return (
    <ContentPage
      title="Acesso à Informação"
      description="Solicite informações públicas conforme a Lei nº 12.527/2011 (Lei de Acesso à Informação)."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Acesso à Informação" },
      ]}
      lastUpdate="2025-12-10"
      responsavel="Setor de Transparência Pública"
    >
      <div className="space-y-6">

        <p className="text-gray-600 text-lg leading-relaxed">
          Aqui você pode solicitar informações públicas, consultar regras da Lei de Acesso à Informação e acompanhar relatórios do município.
        </p>

        {/* 1. INTRODUÇÃO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
              <BookOpen size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Lei de Acesso à Informação</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            A Lei nº 12.527/2011 garante ao cidadão o direito de acessar informações públicas.
            Qualquer pessoa pode solicitar dados aos órgãos públicos, sem necessidade de justificar o pedido.
          </p>
        </section>

        {/* 2. E-SIC */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
              <Send size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Como solicitar informações (e-SIC)</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            O pedido pode ser feito de forma eletrônica por meio do sistema oficial do Governo Federal (Fala.BR).
          </p>
          <a
            href="https://falabr.cgu.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-xl font-bold text-sm hover:bg-[#122a5a] transition shadow-sm"
          >
            <Send size={16} />
            Fazer solicitação de informação
          </a>
          <p className="text-sm text-gray-500 italic">
            O pedido não exige justificativa nem envio de documentos pessoais.
          </p>
        </section>

        {/* 3. SIC PRESENCIAL */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl">
              <MapPin size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Atendimento presencial (SIC)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Unidade</span>
              <p className="text-sm font-semibold text-gray-800">Setor de Protocolo / SIC</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Endereço</span>
              <p className="text-sm font-semibold text-gray-800">Rua Anfrísio Macedo, nº 150 – Centro</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefone</span>
              <p className="text-sm font-semibold text-gray-800">(89) 98116-0296</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-mail</span>
              <p className="text-sm font-semibold text-gray-800">prefeitura@padremarcos.pi.gov.br</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-blue-50/50 px-4 py-2.5 rounded-xl border border-blue-100">
            <Clock size={16} className="text-blue-500" />
            Seg a Sex, 8h às 12h
          </div>
        </section>

        {/* 4. PRAZOS */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
              <Clock size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Prazos e recursos</h2>
          </div>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-gray-600">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              Prazo de resposta: até <strong>20 dias</strong>, prorrogáveis por mais 10 dias.
            </li>
            <li className="flex items-start gap-2 text-gray-600">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              Em caso de negativa, o cidadão pode apresentar recurso.
            </li>
            <li className="flex items-start gap-2 text-gray-600">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              O recurso será analisado pela autoridade competente.
            </li>
          </ul>
        </section>

        {/* 5. PASSO A PASSO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-50 text-cyan-600 p-2.5 rounded-xl">
              <ListOrdered size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Como funciona o pedido</h2>
          </div>
          <ol className="space-y-3">
            {[
              "O cidadão registra o pedido no e-SIC.",
              "O órgão responsável analisa a solicitação.",
              "A resposta é enviada dentro do prazo legal.",
              "Se necessário, o cidadão pode entrar com recurso.",
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-4">
                <span className="w-8 h-8 flex items-center justify-center bg-cyan-50 text-cyan-700 font-black text-sm rounded-lg shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* 6. REGULAMENTAÇÃO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
              <ScrollText size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Regulamentação</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            A Lei de Acesso à Informação no município é regulamentada pelo seguinte instrumento:
          </p>
          <a
            href="/docs/decreto-lai.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
          >
            <ScrollText size={16} />
            Decreto Municipal da LAI (PDF)
          </a>
        </section>

        {/* 7. RELATÓRIOS */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
              <BarChart3 size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Relatórios estatísticos</h2>
          </div>
          <a
            href="/docs/relatorio-lai-2025.pdf"
            target="_blank"
            className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline"
          >
            <BarChart3 size={16} />
            Relatório estatístico anual de pedidos de acesso à informação (quantidade de pedidos recebidos, atendidos e indeferidos)
          </a>
        </section>

        {/* 8. SIGILO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
              <Lock size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Informações classificadas</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            No período, nenhuma informação foi classificada com grau de sigilo.
          </p>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-1">Informações desclassificadas</h3>
            <p className="text-gray-600">
              Nenhuma informação foi desclassificada nos últimos 12 meses.
            </p>
          </div>
        </section>

        {/* 9. LGPD */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
              <ShieldCheck size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Proteção de Dados (LGPD)</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            O município respeita a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
          <a href="/lgpd" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:underline">
            <ShieldCheck size={16} />
            Acesse a Política de Privacidade e dados do encarregado (DPO)
          </a>
        </section>

      </div>
    </ContentPage>
  );
}