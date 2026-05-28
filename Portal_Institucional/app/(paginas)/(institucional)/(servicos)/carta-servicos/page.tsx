"use client";

import ContentPage from "@/components/layout/ContentPage";
import ServiceDetail from "@/components/layout/ServiceDetail";
import portalData from "@/lib/data/portal.json";

/* =========================
   PÁGINA
========================= */
export default function CartaDeServicosPage() {
  
  // Transformando os dados do JSON para o formato esperado pelo ServiceDetail
  const services = ((portalData as any).servicos || []).map((s: any) => ({
    nome: s.servico,
    descricao: s.descricao,
    quemPode: "Cidadão em geral",
    documentos: [],
    etapas: ["Atendimento presencial ou online"],
    prazo: s.prazo,
    forma: "Presencial na Prefeitura",
    horario: s.horario,
    canais: "Em caso de dúvidas, procure a secretaria responsável.",
    responsavel: s.servico.includes("saúde") ? "Secretaria Municipal de Saúde" : "Prefeitura Municipal"
  }));

  return (
    <ContentPage
      title="Carta de Serviços ao Usuário"
      description="Conheça os serviços oferecidos pela Prefeitura Municipal de Padre Marcos - PI, como acessá-los e os prazos de atendimento."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Serviços", href: "/servicos" },
        { label: "Carta de Serviços" },
      ]}
      lastUpdate="2026-05-04"
      showSearch={false}
    >

      {/* INTRODUÇÃO */}
      <section className="mb-8 space-y-4">
        <p className="text-gray-700 leading-relaxed">
          A Carta de Serviços ao Usuário tem como objetivo informar de forma clara e acessível
          os serviços prestados pela Prefeitura Municipal, orientando o cidadão sobre como
          acessá-los, quais os requisitos necessários, prazos de atendimento e formas de acompanhamento.
        </p>

        <p className="text-gray-700 leading-relaxed">
          Este instrumento promove a transparência, fortalece o controle social e contribui
          para a melhoria contínua da gestão pública em conformidade com a Lei Federal nº 13.460/2017.
        </p>
      </section>

      {/* LISTA DE SERVIÇOS */}
      <section className="space-y-8">
        {services.map((service: any, index: number) => (
          <ServiceDetail key={index} service={service} />
        ))}
      </section>

      {/* OBSERVAÇÃO FINAL (PNTP) */}
      <section className="mt-10 p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow-sm">
        <h3 className="font-bold text-gray-900 mb-2">Informações Adicionais</h3>
        <p className="text-sm text-gray-600">
          Caso o serviço desejado não esteja listado nesta página, o cidadão poderá entrar em contato
          com a Prefeitura por meio dos canais oficiais de atendimento ou registrar uma solicitação
          junto à Ouvidoria Municipal.
        </p>
      </section>

    </ContentPage>
  );
}
