"use client";

import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";

import type { ReactNode } from "react";

type FAQ = {
  pergunta: string;
  resposta: ReactNode;
};

const faqs: FAQ[] = [
  {
    pergunta: "Qual o horário de atendimento da Prefeitura?",
    resposta:
      "O atendimento ao público ocorre de segunda a sexta-feira, das 07h às 12h, na sede da Prefeitura e nas secretarias municipais.",
  },
  {
    pergunta: "Como posso solicitar reparo na iluminação pública?",
    resposta: (
      <>
        O cidadão pode solicitar o serviço por meio da{" "}
        <Link href="/ouvidoria" className="text-blue-600 underline">
          Ouvidoria Municipal
        </Link>{" "}
        ou diretamente na Secretaria responsável, informando o local do problema.
      </>
    ),
  },
  {
    pergunta: "Como faço para marcar consultas ou exames pelo SUS?",
    resposta:
      "O agendamento deve ser realizado na Secretaria Municipal de Saúde ou na unidade de saúde mais próxima, mediante apresentação de documentos pessoais e cartão do SUS.",
  },
  {
    pergunta: "Quais documentos são necessários para retirar medicamentos?",
    resposta:
      "É necessário apresentar documento de identificação, cartão do SUS e a receita médica válida.",
  },
  {
    pergunta: "Como realizar matrícula na rede municipal de ensino?",
    resposta:
      "A matrícula deve ser feita diretamente na escola municipal desejada, com apresentação dos documentos do aluno e responsável.",
  },
  {
    pergunta: "Como entrar em contato com a Prefeitura?",
    resposta:
      "Os contatos da Prefeitura, incluindo telefone, e-mail e endereço, estão disponíveis na página 'Contatos e Atendimento'.",
  },
  {
    pergunta: "Onde posso registrar reclamações ou sugestões?",
    resposta: (
      <>
        As manifestações podem ser registradas por meio da{" "}
        <Link href="/ouvidoria" className="text-blue-600 underline">
          Ouvidoria Municipal
        </Link>
        , disponível no site oficial.
      </>
    ),
  },
];

export default function FAQPage() {
  return (
    <ContentPage
      title="Perguntas Frequentes (FAQ)"
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "FAQ" },
      ]}
      responsavel="Secretaria Municipal de Administração"
      lastUpdate="2026-05-04"
    >

      {/* INTRODUÇÃO */}
      <section className="mb-10">
        <p className="text-gray-700 leading-relaxed">
          Nesta seção são apresentadas as perguntas mais frequentes relacionadas
          aos serviços prestados pela Prefeitura Municipal.
        </p>
      </section>

      {/* FAQ LISTA */}
      <section className="space-y-4">
        {faqs.map((item, index) => (
          <div
            key={index}
            className="bg-white border rounded-lg p-4 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900">
              {item.pergunta}
            </h3>

            <p className="text-sm text-gray-600 mt-2">
              {item.resposta}
            </p>
          </div>
        ))}
      </section>

      {/* OBSERVAÇÃO */}
      <section className="mt-10 bg-gray-50 border rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Observação:</strong> As informações podem ser atualizadas conforme alterações nos serviços municipais.
        </p>
      </section>

    </ContentPage>
  );
}
