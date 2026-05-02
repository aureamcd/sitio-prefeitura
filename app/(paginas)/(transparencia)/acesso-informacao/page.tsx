"use client";

import ContentPage from "@/components/layout/ContentPage";

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

      {/* 1. INTRODUÇÃO */}
      <section className="space-y-3">
        <h2>Lei de Acesso à Informação</h2>
        <p>
          A Lei nº 12.527/2011 garante ao cidadão o direito de acessar informações públicas.
          Qualquer pessoa pode solicitar dados aos órgãos públicos, sem necessidade de justificar o pedido.
        </p>
      </section>

      {/* 2. E-SIC */}
      <section className="mt-8 space-y-4">
        <h2>Como solicitar informações (e-SIC)</h2>

        <p>
          O pedido pode ser feito de forma eletrônica por meio do sistema oficial do Governo Federal (Fala.BR).
        </p>

        <a
          href="https://falabr.cgu.gov.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-5 py-2.5 bg-[#173572] text-white rounded-lg hover:bg-[#122a5a] transition"
        >
          Fazer solicitação de informação
        </a>
      </section>

      {/* 3. SIC PRESENCIAL */}
      <section className="mt-8 space-y-3">
        <h2>Atendimento presencial (SIC)</h2>

        <ul>
          <li><strong>Unidade responsável:</strong> Setor de Protocolo / SIC</li>
          <li><strong>Endereço:</strong> Rua Anfrísio Macedo, nº 150 – Centro</li>
          <li><strong>Telefone:</strong> (89) 98116-0296</li>
          <li><strong>E-mail:</strong> prefeitura@padremarcos.pi.gov.br</li>
          <li><strong>Horário de atendimento:</strong> Seg a Sex, 8h às 12h</li>
        </ul>
      </section>

      {/* 4. PRAZOS */}
      <section className="mt-8 space-y-3">
        <h2>Prazos e recursos</h2>

        <ul>
          <li>Prazo de resposta: até 20 dias, prorrogáveis por mais 10 dias.</li>
          <li>Em caso de negativa, o cidadão pode apresentar recurso.</li>
          <li>O recurso será analisado pela autoridade competente.</li>
        </ul>
      </section>

      {/* 5. PASSO A PASSO */}
      <section className="mt-8 space-y-3">
        <h2>Como funciona o pedido</h2>

        <ol>
          <li>O cidadão registra o pedido no e-SIC.</li>
          <li>O órgão responsável analisa a solicitação.</li>
          <li>A resposta é enviada dentro do prazo legal.</li>
          <li>Se necessário, o cidadão pode entrar com recurso.</li>
        </ol>
      </section>

      {/* 6. REGULAMENTAÇÃO */}
      <section className="mt-8 space-y-3">
        <h2>Regulamentação</h2>

        <p>
          A Lei de Acesso à Informação no município é regulamentada pelo seguinte instrumento:
        </p>

        <ul>
          <li>
            <a href="/docs/decreto-lai.pdf" target="_blank">
              Decreto Municipal da LAI (PDF)
            </a>
          </li>
        </ul>
      </section>

      {/* 7. RELATÓRIOS */}
      <section className="mt-8 space-y-3">
        <h2>Relatórios estatísticos</h2>

        <ul>
          <li>
            <a href="/docs/relatorio-lai-2025.pdf" target="_blank">
              Relatório anual de pedidos de informação
            </a>
          </li>
        </ul>
      </section>

      {/* 8. SIGILO */}
      <section className="mt-8 space-y-3">
        <h2>Informações classificadas</h2>

        <p>
          No período, nenhuma informação foi classificada com grau de sigilo.
        </p>

        <h3>Informações desclassificadas</h3>
        <p>
          Nenhuma informação foi desclassificada nos últimos 12 meses.
        </p>
      </section>

    </ContentPage>
  );
}