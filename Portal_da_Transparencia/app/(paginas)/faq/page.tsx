"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ContentPage from "@/components/layout/ContentPage";
import { ChevronDown, Search, Info, HelpCircle, MessagesSquare, FileText, Stethoscope, GraduationCap, HardHat, HeartHandshake, Users, Landmark } from "lucide-react";
import type { ReactNode } from "react";
import { useTodayDate } from '@/lib/hooks/useTodayDate';

type FAQ = {
  id: string;
  categoria: string;
  pergunta: string;
  resposta: ReactNode;
};

const faqs: FAQ[] = [
  // Geral
  {
    id: "g1",
    categoria: "Geral",
    pergunta: "Qual o horário de atendimento da Prefeitura?",
    resposta: "O atendimento ao público ocorre de segunda a sexta-feira, das 07h às 12h, na sede da Prefeitura e nas secretarias municipais.",
  },
  {
    id: "g2",
    categoria: "Geral",
    pergunta: "Como entrar em contato com a Prefeitura?",
    resposta: "Os contatos da Prefeitura, incluindo telefone, e-mail e endereço, estão disponíveis na página do Portal Institucional.",
  },
  {
    id: "g3",
    categoria: "Geral",
    pergunta: "Onde consultar a legislação municipal?",
    resposta: (
      <>
        A legislação municipal está disponível na seção de{" "}
        <Link href="/legislacao" className="text-blue-600 font-medium hover:underline">
          Legislação
        </Link>{" "}
        do Portal da Transparência.
      </>
    ),
  },

  // Transparência e Licitações
  {
    id: "t1",
    categoria: "Transparência e Licitações",
    pergunta: "Como acessar as informações de despesas e receitas?",
    resposta: "As informações de despesas e receitas estão disponíveis no Portal da Transparência, nas abas 'Receitas' e 'Despesas', onde é possível consultar dados detalhados da execução orçamentária.",
  },
  {
    id: "t2",
    categoria: "Transparência e Licitações",
    pergunta: "Como acompanhar licitações?",
    resposta: "Todos os processos licitatórios estão publicados no Portal da Transparência, na aba 'Licitações e Contratos', onde é possível baixar os editais, acompanhar avisos, resultados e visualizar os contratos firmados.",
  },

  // Ouvidoria
  {
    id: "o1",
    categoria: "Ouvidoria",
    pergunta: "Onde posso registrar reclamações ou sugestões?",
    resposta: (
      <>
        As manifestações podem ser registradas por meio da{" "}
        <Link href="/ouvidoria" className="text-blue-600 font-medium hover:underline">
          Ouvidoria Municipal
        </Link>
        , disponível de forma online no Portal da Transparência.
      </>
    ),
  },
  {
    id: "o2",
    categoria: "Ouvidoria",
    pergunta: "Como solicitar informação via e-SIC?",
    resposta: "Você pode solicitar informações acessando o e-SIC (Serviço de Informação ao Cidadão) no Portal da Transparência. Basta preencher o formulário com seus dados e descrever a informação desejada.",
  },
  {
    id: "o3",
    categoria: "Ouvidoria",
    pergunta: "Como registrar denúncia?",
    resposta: "Denúncias devem ser registradas diretamente no canal da Ouvidoria Municipal e podem ser realizadas de forma identificada, sigilosa ou anônima, garantindo a proteção do denunciante.",
  },

  // Saúde
  {
    id: "s1",
    categoria: "Saúde",
    pergunta: "Como faço para marcar consultas ou exames pelo SUS?",
    resposta: "O agendamento deve ser realizado na Secretaria Municipal de Saúde ou na Unidade Básica de Saúde (UBS) mais próxima, mediante apresentação de documentos pessoais e do cartão do SUS.",
  },
  {
    id: "s2",
    categoria: "Saúde",
    pergunta: "Quais documentos são necessários para retirar medicamentos?",
    resposta: "É necessário apresentar documento de identificação com foto, cartão do SUS e a receita médica válida (no prazo adequado).",
  },

  // Educação
  {
    id: "e1",
    categoria: "Educação",
    pergunta: "Como realizar matrícula na rede municipal de ensino?",
    resposta: "A matrícula deve ser feita diretamente na escola municipal desejada durante o período oficial de matrículas, com apresentação da certidão de nascimento do aluno, documentos dos responsáveis e comprovante de residência.",
  },

  // Tributos
  {
    id: "tr1",
    categoria: "Tributos",
    pergunta: "Como emitir nota fiscal eletrônica (NFS-e)?",
    resposta: "A emissão da NFS-e é realizada através do Portal do Contribuinte no site da prefeitura. Consulte a Secretaria de Finanças para mais informações.",
  },

  // Infraestrutura
  {
    id: "i1",
    categoria: "Infraestrutura",
    pergunta: "Como solicitar reparo na iluminação pública?",
    resposta: (
      <>
        O cidadão pode solicitar o serviço através da{" "}
        <Link href="/ouvidoria" className="text-blue-600 font-medium hover:underline">
          Ouvidoria Municipal
        </Link>{" "}
        ou presencialmente na Secretaria de Obras e Infraestrutura.
      </>
    ),
  },

  // Assistência Social
  {
    id: "a1",
    categoria: "Assistência Social",
    pergunta: "Como participar de programas sociais?",
    resposta: "Para ingressar em programas sociais, procure o Centro de Referência de Assistência Social (CRAS) portando seus documentos pessoais e comprovantes de renda para se inscrever ou atualizar o Cadastro Único (CadÚnico).",
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Geral": <Info size={18} />,
  "Transparência e Licitações": <Landmark size={18} />,
  "Ouvidoria": <MessagesSquare size={18} />,
  "Saúde": <Stethoscope size={18} />,
  "Educação": <GraduationCap size={18} />,
  "Tributos": <FileText size={18} />,
  "Infraestrutura": <HardHat size={18} />,
  "Assistência Social": <HeartHandshake size={18} />,
};

export default function FAQPage() {
  const today = useTodayDate();
  const [busca, setBusca] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const termo = busca.toLowerCase();
    if (!termo) return faqs;

    return faqs.filter(
      (faq) =>
        faq.pergunta.toLowerCase().includes(termo) ||
        (typeof faq.resposta === "string" && faq.resposta.toLowerCase().includes(termo))
    );
  }, [busca]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, FAQ[]> = {};
    for (const faq of filteredFaqs) {
      if (!groups[faq.categoria]) groups[faq.categoria] = [];
      groups[faq.categoria].push(faq);
    }
    return groups;
  }, [filteredFaqs]);

  return (
    <ContentPage
      title="Perguntas Frequentes (FAQ)"
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Informações Institucionais", href: "/#secao-0" },
        { label: "FAQ" },
      ]}
      lastUpdate={today}
      showSearch={false}
    >
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* CABEÇALHO E BUSCA */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-[#0B3D91] rounded-2xl mb-2">
            <HelpCircle size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Como podemos ajudar?</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Encontre respostas rápidas para as principais dúvidas sobre transparência pública e serviços municipais.
          </p>

          <div className="relative max-w-xl mx-auto mt-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]/30 focus:border-[#0B3D91] transition shadow-sm"
              placeholder="Busque por uma dúvida ou palavra-chave..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </section>

        {/* LISTA AGRUPADA POR CATEGORIA */}
        <section className="space-y-8">
          {Object.keys(groupedFaqs).length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-medium text-lg">Nenhuma pergunta encontrada para &ldquo;{busca}&rdquo;</p>
              <button 
                onClick={() => setBusca("")}
                className="mt-4 text-[#0B3D91] font-bold hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            Object.entries(groupedFaqs).map(([categoria, items]) => (
              <div key={categoria} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                
                {/* Título da Categoria */}
                <div className="flex items-center gap-2 text-[#0B3D91] pb-2 border-b border-gray-100">
                  {CATEGORY_ICONS[categoria] || <Info size={18} />}
                  <h3 className="text-lg font-bold uppercase tracking-widest">{categoria}</h3>
                  <span className="ml-2 bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                {/* Itens Accordion */}
                <div className="space-y-3">
                  {items.map((faq) => {
                    const isExpanded = expandedId === faq.id;
                    return (
                      <div 
                        key={faq.id} 
                        className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                          isExpanded ? "border-[#0B3D91] shadow-md bg-white" : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                          className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                        >
                          <span className={`font-bold pr-4 ${isExpanded ? "text-[#0B3D91]" : "text-gray-900"}`}>
                            {faq.pergunta}
                          </span>
                          <div className={`shrink-0 p-1 rounded-full transition-transform duration-300 ${isExpanded ? "bg-blue-50 text-[#0B3D91] rotate-180" : "bg-gray-50 text-gray-400"}`}>
                            <ChevronDown size={20} />
                          </div>
                        </button>
                        
                        <div 
                          className={`transition-all duration-300 ease-in-out ${
                            isExpanded ? "max-h-96 opacity-100 pb-5 px-5" : "max-h-0 opacity-0 overflow-hidden"
                          }`}
                        >
                          <p className="text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                            {faq.resposta}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>

        {/* NOTA DE RODAPÉ */}
        <div className="mt-12 bg-blue-50/50 border border-blue-100 rounded-2xl p-6 text-center space-y-2">
          <p className="text-sm text-gray-700 font-medium">
            Não encontrou o que procurava?
          </p>
          <p className="text-sm text-gray-500">
            Acesse nossa <Link href="/ouvidoria" className="text-[#0B3D91] font-bold hover:underline">Ouvidoria</Link> ou entre em contato pelos canais oficiais.
          </p>
        </div>

      </div>
    </ContentPage>
  );
}
