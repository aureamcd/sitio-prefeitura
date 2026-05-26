import ContentPage from "@/components/layout/ContentPage";
import { ClipboardList, CheckCircle, Clock, Users, FileText, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTodayDate } from '@/lib/utils/date';

const services = [
  {
    nome: "Solicitação de Informação (e-SIC)",
    descricao: "Registrar pedido de acesso à informação pública com base na Lei de Acesso à Informação (Lei nº 12.527/2011).",
    quemPode: "Qualquer cidadão, sem necessidade de justificativa.",
    documentos: ["Documento de identificação (opcional para pedidos simples)"],
    etapas: [
      "Acessar o formulário de solicitação no Portal da Transparência",
      "Preencher dados pessoais e descrever a informação desejada",
      "Acompanhar o protocolo gerado",
      "Receber resposta no prazo legal",
    ],
    prazo: "Até 20 dias, prorrogável por mais 10 dias",
    horario: "24 horas (online)",
    responsavel: "Ouvidoria Municipal / e-SIC",
  },
  {
    nome: "Registro de Manifestação na Ouvidoria",
    descricao: "Registrar reclamações, sugestões, elogios, denúncias ou solicitações de providências.",
    quemPode: "Qualquer cidadão.",
    documentos: [],
    etapas: [
      "Acessar o formulário de manifestação",
      "Selecionar o tipo de manifestação",
      "Descrever detalhadamente a situação",
      "Acompanhar o andamento pelo protocolo gerado",
    ],
    prazo: "Até 30 dias, prorrogável por mais 30 dias",
    horario: "24 horas (online)",
    responsavel: "Ouvidoria Municipal",
  },
  {
    nome: "Consulta de Processos Licitatórios",
    descricao: "Acessar editais, avisos, resultados e contratos de licitações municipais.",
    quemPode: "Qualquer cidadão ou empresa interessada.",
    documentos: [],
    etapas: [
      "Acessar a seção de Licitações",
      "Selecionar o período desejado",
      "Visualizar ou baixar os documentos de interesse",
    ],
    prazo: "Disponível permanentemente",
    horario: "24 horas (online)",
    responsavel: "Setor de Licitações e Contratos",
  },
  {
    nome: "Consulta de Despesas Municipais",
    descricao: "Acompanhar a execução orçamentária e financeira das despesas do município, incluindo empenhos, liquidações e pagamentos.",
    quemPode: "Qualquer cidadão.",
    documentos: [],
    etapas: [
      "Acessar a seção de Despesas no Portal da Transparência",
      "Filtrar por período, órgão ou categoria",
      "Visualizar dados detalhados da execução",
    ],
    prazo: "Atualizado diariamente",
    horario: "24 horas (online)",
    responsavel: "Secretaria de Finanças",
  },
  {
    nome: "Consulta de Receitas Municipais",
    descricao: "Acompanhar a arrecadação municipal por fonte de receita, incluindo transferências constitucionais e receitas próprias.",
    quemPode: "Qualquer cidadão.",
    documentos: [],
    etapas: [
      "Acessar a seção de Receitas no Portal da Transparência",
      "Filtrar por período e tipo de receita",
      "Visualizar dados detalhados da arrecadação",
    ],
    prazo: "Atualizado diariamente",
    horario: "24 horas (online)",
    responsavel: "Secretaria de Finanças",
  },
  {
    nome: "Consulta de Recursos Humanos",
    descricao: "Acessar informações sobre servidores municipais, cargos, salários e quadro de pessoal.",
    quemPode: "Qualquer cidadão.",
    documentos: [],
    etapas: [
      "Acessar a seção de Recursos Humanos",
      "Consultar dados agregados por cargo, secretaria ou vínculo",
    ],
    prazo: "Atualizado mensalmente",
    horario: "24 horas (online)",
    responsavel: "Setor de Recursos Humanos",
  },
];

export default function CartaDeServicosPage() {
  return (
    <ContentPage
      title="Carta de Serviços ao Usuário"
      description="Conheça os serviços oferecidos pelo Portal da Transparência de Padre Marcos - PI, como acessá-los e os prazos de atendimento."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Carta de Serviços" },
      ]}
      lastUpdate={getTodayDate()}
      showSearch={false}
    >
      {/* Banner - Link para Carta de Serviços do Portal Institucional */}
      <div className="mb-8 bg-gradient-to-r from-[#173572] to-[#1e4a8a] rounded-2xl p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-white/15 p-3 rounded-xl shrink-0">
            <ExternalLink size={28} className="text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-1">Carta de Serviços Completa</h2>
            <p className="text-sm text-white/80 leading-relaxed">
              A relação completa de todos os serviços públicos municipais — incluindo informações sobre
              documentos necessários, prazos, horários e responsáveis — está disponível no
              <strong> Portal Institucional da Prefeitura</strong>.
            </p>
          </div>
          <Link
            href="https://padremarcos.pi.gov.br/carta-servicos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#173572] rounded-xl font-bold text-sm hover:bg-blue-50 transition-all shadow-sm shrink-0"
          >
            Acessar Carta de Serviços <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* INTRODUÇÃO */}
      <section className="mb-8 space-y-4">
        <p className="text-gray-700 leading-relaxed">
          Abaixo estão listados os serviços diretamente relacionados ao Portal da Transparência.
          A Carta de Serviços ao Usuário tem como objetivo informar de forma clara e acessível
          os serviços disponíveis, orientando o cidadão sobre como
          acessá-los, quais os requisitos necessários, prazos de atendimento e formas de acompanhamento.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Este instrumento promove a transparência, fortalece o controle social e contribui
          para a melhoria contínua da gestão pública em conformidade com a Lei Federal nº 13.460/2017.
        </p>
      </section>

      {/* LISTA DE SERVIÇOS */}
      <section className="space-y-8">
        {services.map((service, index) => (
          <div
            key={index}
            className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-blue-50 p-2.5 rounded-xl text-[#173572] shrink-0">
                <ClipboardList size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{service.nome}</h3>
                <p className="text-sm text-gray-600 mt-1">{service.descricao}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* QUEM PODE */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Users size={16} />
                  Quem pode solicitar
                </div>
                <p className="text-sm text-gray-600">{service.quemPode}</p>
              </div>

              {/* PRAZO */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={16} />
                  Prazo
                </div>
                <p className="text-sm text-gray-600">{service.prazo}</p>
              </div>

              {/* DOCUMENTOS */}
              {service.documentos.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FileText size={16} />
                    Documentos necessários
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {service.documentos.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* HORÁRIO */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <Clock size={16} />
                  Horário de atendimento
                </div>
                <p className="text-sm text-gray-600">{service.horario}</p>
              </div>
            </div>

            {/* ETAPAS */}
            <div className="mt-4 bg-blue-50/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                <CheckCircle size={16} className="text-green-600" />
                Etapas
              </div>
              <ol className="space-y-2">
                {service.etapas.map((etapa, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-xs rounded-full shrink-0">
                      {i + 1}
                    </span>
                    {etapa}
                  </li>
                ))}
              </ol>
            </div>

            {/* RESPONSÁVEL */}
            <div className="mt-3 text-xs text-gray-500 text-right">
              Responsável: <span className="font-medium">{service.responsavel}</span>
            </div>
          </div>
        ))}
      </section>

      {/* OBSERVAÇÃO FINAL */}
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
