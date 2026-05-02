"use client";

import ContentPage from "@/components/layout/ContentPage";
import ServiceDetail from "@/components/layout/ServiceDetail";

/* =========================
   MOCK DE SERVIÇOS
   (depois você pode puxar do banco)
========================= */
const services = [
  {
    nome: "Emissão de Alvará de Funcionamento",
    descricao:
      "Serviço destinado à concessão de autorização para funcionamento de estabelecimentos comerciais no município.",
    quemPode: "Empresas e profissionais autônomos",
    documentos: [
      "Documento de identificação (RG e CPF)",
      "Comprovante de endereço",
      "CNPJ (se empresa)",
    ],
    etapas: [
      "Solicitação do serviço",
      "Análise da documentação",
      "Vistoria (quando necessário)",
      "Emissão do alvará",
    ],
    prazo: "Até 5 dias úteis",
    forma: "Presencial na Prefeitura ou via sistema online",
    canais:
      "Em caso de dúvidas ou reclamações, utilize a Ouvidoria Municipal ou o sistema Fala.BR.",
    responsavel: "Secretaria Municipal de Finanças",
  },
  {
    nome: "Solicitação de Poda de Árvores",
    descricao:
      "Permite ao cidadão solicitar a poda ou remoção de árvores em vias públicas.",
    quemPode: "Qualquer cidadão",
    documentos: [],
    etapas: [
      "Registro da solicitação",
      "Análise técnica",
      "Execução do serviço",
    ],
    prazo: "Até 15 dias úteis",
    forma: "Solicitação presencial ou via Ouvidoria",
    canais:
      "Acompanhe ou registre manifestação pela Ouvidoria ou pelo sistema Fala.BR.",
    responsavel: "Secretaria Municipal de Infraestrutura",
  },
];

/* =========================
   PÁGINA
========================= */
export default function CartaDeServicosPage() {
  return (
    <ContentPage
      title="Carta de Serviços ao Usuário"
      description="Conheça os serviços oferecidos pela Prefeitura Municipal, como acessá-los e os prazos de atendimento."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Serviços", href: "/servicos" },
        { label: "Carta de Serviços" },
      ]}
      lastUpdate="2026-04-30"
      responsavel="Prefeitura Municipal"
      showSearch={false}
    >

      {/* INTRODUÇÃO */}
      <section className="mb-8 space-y-4">
        <p>
          A Carta de Serviços ao Usuário tem como objetivo informar de forma clara e acessível
          os serviços prestados pela Prefeitura Municipal, orientando o cidadão sobre como
          acessá-los, quais os requisitos necessários, prazos de atendimento e formas de acompanhamento.
        </p>

        <p>
          Este instrumento promove a transparência, fortalece o controle social e contribui
          para a melhoria contínua da gestão pública.
        </p>
      </section>

      {/* LISTA DE SERVIÇOS */}
      <section className="space-y-8">
        {services.map((service, index) => (
          <ServiceDetail key={index} service={service} />
        ))}
      </section>

      {/* OBSERVAÇÃO FINAL (PNTP) */}
      <section className="mt-10 p-5 bg-gray-50 border rounded-xl">
        <p className="text-sm text-gray-600">
          Caso o serviço desejado não esteja listado nesta página, o cidadão poderá entrar em contato
          com a Prefeitura por meio dos canais oficiais de atendimento ou registrar uma solicitação
          junto à Ouvidoria Municipal.
        </p>
      </section>

    </ContentPage>
  );
}
