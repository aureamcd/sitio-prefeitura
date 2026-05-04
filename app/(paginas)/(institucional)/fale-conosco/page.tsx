"use client";

import ContentPage from "@/components/layout/ContentPage";
import {
  FileText,
  ExternalLink,
  Clock,
  Building2,
  Info,
} from "lucide-react";

export default function AcessoInformacaoPage() {
  return (
    <ContentPage
      title="Acesso à Informação"
      description="Solicite informações públicas com base na Lei de Acesso à Informação (LAI)."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Acesso à Informação" },
      ]}
      lastUpdate="2026-05-04"
      responsavel="Controladoria Geral do Município"
    >
      {/* INTRODUÇÃO */}
      <section className="space-y-4">
        <p>
          A Lei nº 12.527/2011 (Lei de Acesso à Informação - LAI)
          garante ao cidadão o direito de solicitar informações públicas
          aos órgãos e entidades da administração pública.
        </p>

        <p>
          O acesso à informação é a regra, e o sigilo é a exceção.
          Este canal é destinado exclusivamente para pedidos de acesso à informação,
          não sendo utilizado para denúncias, reclamações ou sugestões.
        </p>

        <p className="text-sm text-gray-600">
          O pedido de acesso à informação não exige justificativa,
          conforme a Lei nº 12.527/2011.
        </p>
      </section>

      {/* BOTÃO ESIC */}
      <section className="mt-10 text-center">
        <a
          href="https://falabr.cgu.gov.br/publico/Manifestacao/SelecionarTipoManifestacao.aspx?tipo=1"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#173572] text-white px-6 py-4 rounded-xl text-lg font-semibold shadow-lg hover:bg-[#0f2550] transition"
        >
          <ExternalLink />
          Fazer Pedido de Informação (e-SIC)
        </a>

        <p className="text-sm text-gray-500 mt-3">
          Você será redirecionado para o sistema oficial do Governo Federal (Fala.BR).
        </p>
      </section>

      {/* SIC FÍSICO */}
      <section className="mt-12 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#173572]">
          <Building2 size={18} />
          Serviço de Informação ao Cidadão (SIC) - Atendimento Presencial
        </h2>

        <ul>
          <li><strong>Unidade:</strong> Prefeitura Municipal de Padre Marcos</li>
          <li><strong>Endereço:</strong> Rua XXXXX, Centro</li>
          <li><strong>Telefone:</strong> (89) XXXX-XXXX</li>
          <li><strong>E-mail:</strong> sic@padremarcos.pi.gov.br</li>
          <li><strong>Horário:</strong> Segunda a sexta, das 08h às 13h</li>
        </ul>
      </section>

      {/* PRAZOS E PROCEDIMENTOS */}
      <section className="mt-12 space-y-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#173572]">
          <Clock size={18} />
          Prazos, Recursos e Procedimentos
        </h2>

        <ul>
          <li>Prazo de resposta: até 20 dias, prorrogáveis por mais 10 dias.</li>
          <li>Prazo para interposição de recurso: até 10 dias após a resposta.</li>
          <li>O pedido não precisa de justificativa.</li>
          <li>Não é necessário envio de documentos pessoais.</li>
        </ul>

        <p className="text-sm text-gray-600">
          Autoridade responsável: Controladoria Geral do Município.
        </p>

        {/* PASSO A PASSO */}
        <div>
          <h3 className="flex items-center gap-2 font-semibold text-[#173572] mt-4">
            <Info size={16} />
            Como realizar um pedido
          </h3>

          <ol className="list-decimal pl-5 space-y-1 mt-2">
            <li>Acesse o sistema eletrônico e-SIC (Fala.BR).</li>
            <li>Preencha seus dados básicos de contato.</li>
            <li>Descreva de forma clara a informação desejada.</li>
            <li>Envie o pedido e acompanhe o andamento pelo sistema.</li>
          </ol>
        </div>
      </section>

      {/* DOCUMENTOS LAI */}
      <section className="mt-12 space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#173572]">
          <FileText size={18} />
          Informações e Relatórios da LAI
        </h2>

        <div className="space-y-3">

          <a
            href="/docs/regulamentacao-lai.pdf"
            target="_blank"
            className="block hover:underline"
          >
            📄 Regulamentação da LAI no Município
          </a>

          <a
            href="/docs/relatorio-esic.pdf"
            target="_blank"
            className="block hover:underline"
          >
            📊 Relatório Estatístico de Pedidos
          </a>

          <div className="text-gray-600">
            🔒 Rol de Informações Classificadas:
            <br />
            No período, nenhuma informação foi classificada com grau de sigilo.
          </div>

          <div className="text-gray-600">
            🔓 Rol de Informações Desclassificadas:
            <br />
            Nenhuma informação foi desclassificada nos últimos 12 meses.
          </div>

        </div>
      </section>
    </ContentPage>
  );
}