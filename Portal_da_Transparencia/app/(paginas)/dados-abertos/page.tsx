import ContentPage from "@/components/layout/ContentPage";
import { Database, Download, FileJson, FileCog, ExternalLink } from "lucide-react";
import { getTodayDate } from '@/lib/utils/date';
import Link from "next/link";

interface Dataset {
  categoria: string;
  nome: string;
  descricao: string;
  formato: string;
  link: string;
  atualizacao: string;
}

const datasets: Dataset[] = [
  {
    categoria: "Execução Orçamentária",
    nome: "Despesas Municipais",
    descricao: "Empenhos, liquidações e pagamentos realizados pelo município, incluindo credor, classificação orçamentária e valores.",
    formato: "CSV",
    link: "/api/exportar/despesas",
    atualizacao: "Diária",
  },
  {
    categoria: "Execução Orçamentária",
    nome: "Receitas Municipais",
    descricao: "Previsão e arrecadação mensal por categoria econômica, origem, espécie e rubrica.",
    formato: "CSV",
    link: "/api/exportar/receitas",
    atualizacao: "Diária",
  },
  {
    categoria: "Execução Orçamentária",
    nome: "Renúncias de Receita",
    descricao: "Desonerações tributárias, isenções fiscais e beneficiários por exercício.",
    formato: "CSV",
    link: "/api/exportar/renuncias",
    atualizacao: "Mensal",
  },
  {
    categoria: "Execução Orçamentária",
    nome: "Despesas Extra-orçamentárias",
    descricao: "Valores que transitam pelo caixa sem integrar o orçamento anual (cauções, consignações, restituições).",
    formato: "CSV",
    link: "/api/exportar/despesas-extra",
    atualizacao: "Diária",
  },
  {
    categoria: "Execução Orçamentária",
    nome: "Restos a Pagar",
    descricao: "Despesas empenhadas e não pagas até o final do exercício, inscritas em restos a pagar.",
    formato: "CSV",
    link: "/api/exportar/restos-pagar",
    atualizacao: "Mensal",
  },
  {
    categoria: "Compras e Contratos",
    nome: "Licitações",
    descricao: "Editais, processos licitatórios, dispensas, inexigibilidades e licitantes sancionados.",
    formato: "CSV",
    link: "/api/exportar/licitacoes",
    atualizacao: "Diária",
  },
  {
    categoria: "Compras e Contratos",
    nome: "Contratos",
    descricao: "Íntegra dos contratos vigentes e encerrados, termos aditivos e ordem cronológica de pagamentos.",
    formato: "CSV",
    link: "/api/exportar/contratos",
    atualizacao: "Diária",
  },
  {
    categoria: "Compras e Contratos",
    nome: "Convênios",
    descricao: "Transferências voluntárias recebidas e concedidas, com valores e prazos.",
    formato: "CSV",
    link: "/api/exportar/convenios",
    atualizacao: "Mensal",
  },
  {
    categoria: "Gestão de Pessoas",
    nome: "Servidores Municipais",
    descricao: "Relação nominal de servidores, cargos, lotação e remunerações individuais.",
    formato: "CSV",
    link: "/api/exportar/servidores",
    atualizacao: "Mensal",
  },
  {
    categoria: "Gestão de Pessoas",
    nome: "Diárias e Passagens",
    descricao: "Concessões de diárias com beneficiário, valor, destino e motivo.",
    formato: "CSV",
    link: "/api/exportar/diarias",
    atualizacao: "Mensal",
  },
  {
    categoria: "Obras",
    nome: "Obras Públicas",
    descricao: "Relação de obras com situação, empresa contratada, valores e prazos, incluindo obras paralisadas.",
    formato: "CSV",
    link: "/api/exportar/obras",
    atualizacao: "Mensal",
  },
  {
    categoria: "Planejamento",
    nome: "Emendas Parlamentares",
    descricao: "Recebimento e execução de emendas parlamentares, incluindo emendas pix.",
    formato: "CSV",
    link: "/api/exportar/emendas",
    atualizacao: "Mensal",
  },
];

const categorias = [...new Set(datasets.map((d) => d.categoria))];

export default function DadosAbertosPage() {
  return (
    <ContentPage
      title="Dados Abertos"
      icon={<Database size={20} strokeWidth={1.5} />}
      description="Acesso a bases de dados públicas do município em formatos estruturados e legíveis por máquina, disponibilizados para reutilização pela sociedade."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Dados Abertos" },
      ]}
      lastUpdate={getTodayDate()}
    >
      {/* Introdução */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Em conformidade com o PNTP 2026 e a Lei de Acesso à Informação (Lei nº 12.527/2011),
          disponibilizamos aqui os dados públicos do município em formatos abertos (CSV) para
          download, processamento e reutilização por qualquer cidadão, pesquisador ou desenvolvedor.
        </p>
      </div>

      {/* Princípios */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Database, title: "Formato Aberto", desc: "Dados em CSV, formato legível por máquina e editável em planilhas." },
          { icon: Download, title: "Download Gratuito", desc: "Todos os datasets são de acesso livre, sem necessidade de cadastro." },
          { icon: FileCog, title: "Atualização Periódica", desc: "Dados atualizados conforme a periodicidade indicada em cada dataset." },
        ].map((item) => (
          <div key={item.title} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm text-center">
            <div className="bg-[#e8edf7] p-3 rounded-xl text-[#173572] inline-flex mb-3">
              <item.icon size={24} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Catálogo */}
      <div className="space-y-8">
        {categorias.map((categoria) => (
          <div key={categoria}>
            <h2 className="text-lg font-bold text-[#173572] mb-4 border-b border-[#e8edf7] pb-2">
              {categoria}
            </h2>
            <div className="space-y-3">
              {datasets
                .filter((d) => d.categoria === categoria)
                .map((dataset) => (
                  <div
                    key={dataset.nome}
                    className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{dataset.nome}</h3>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full">
                            <FileJson size={10} />
                            {dataset.formato}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{dataset.descricao}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Atualização: <span className="font-medium">{dataset.atualizacao}</span>
                        </p>
                      </div>
                      <a
                        href={dataset.link}
                        download
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#173572] text-white rounded-lg text-sm font-bold hover:bg-[#122a5a] transition-colors shrink-0 shadow-sm"
                      >
                        <Download size={14} />
                        Download
                      </a>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nota técnica */}
      <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-2">Sobre Dados Abertos</h3>
        <div className="text-sm text-gray-600 space-y-2 leading-relaxed">
          <p>
            Os dados disponibilizados seguem os princípios da Cartilha de Dados Abertos do
            PNTP 2026 e da Infraestrutura Nacional de Dados Abertos (INDA).
          </p>
          <p>
            <strong>Formatos:</strong> CSV (separado por ponto e vírgula, codificação UTF-8 com BOM).
            Compatível com Microsoft Excel, LibreOffice Calc, Google Sheets e ferramentas de análise de dados.
          </p>
          <p>
            <strong>Licença:</strong> Os dados são disponibilizados sob licença aberta, permitindo
            livre uso, reutilização e redistribuição, com a condição de atribuição da fonte.
          </p>
        </div>
      </div>
    </ContentPage>
  );
}
