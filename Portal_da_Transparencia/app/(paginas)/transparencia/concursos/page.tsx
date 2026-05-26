import ContentPage from "@/components/layout/ContentPage";
import { ExternalLink, FileText, CalendarDays, Users, Award, ClipboardList } from "lucide-react";
import { getTodayDate } from '@/lib/utils/date';

export default function ConcursosPage() {
  return (
    <ContentPage
      title="Concursos e Processos Seletivos"
      description="Acompanhe os concursos públicos e processos seletivos simplificados da Prefeitura Municipal de Padre Marcos."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Concursos" },
      ]}
      lastUpdate={getTodayDate()}
    >
      <div className="space-y-6">

        <p className="text-gray-600 text-lg leading-relaxed">
          A Prefeitura Municipal divulga aqui todas as informações relativas a concursos públicos,
          processos seletivos simplificados e testes seletivos para contratação temporária,
          em conformidade com os princípios da transparência e publicidade.
        </p>

        {/* INFORMAÇÕES GERAIS */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
              <Award size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Informações disponíveis</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#173572]">Editais</p>
              <p className="text-xs text-gray-500 mt-1">Documentos completos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#173572]">Resultados</p>
              <p className="text-xs text-gray-500 mt-1">Classificação final</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#173572]">Cronogramas</p>
              <p className="text-xs text-gray-500 mt-1">Datas e prazos</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#173572]">Cargos</p>
              <p className="text-xs text-gray-500 mt-1">Vagas disponíveis</p>
            </div>
          </div>
        </section>

        {/* LISTA DE CONTEÚDO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
              <ClipboardList size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Conteúdo publicado</h2>
          </div>
          <ul className="space-y-3">
            {[
              "Edital completo do concurso/processo seletivo",
              "Quadro de vagas por cargo/especialidade",
              "Cronograma com datas de provas e resultados",
              "Relação de candidatos inscritos (por cargo)",
              "Resultado preliminar e final",
              "Homologação do resultado",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center bg-amber-50 text-amber-600 font-bold text-xs rounded-full shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ACESSO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
              <ExternalLink size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Acesso aos Editais</h2>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Os editais e resultados de concursos e processos seletivos podem ser consultados no sistema:
          </p>
          <a
            href="https://transparencia.padremarcos.pi.gov.br/transparencia/?AcessoIndividual=LnkConcursos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173572] text-white rounded-xl font-bold text-sm hover:bg-[#122a5a] transition shadow-sm"
          >
            <ExternalLink size={16} />
            Acessar concursos e editais
          </a>
        </section>

        {/* LEGISLAÇÃO */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
              <FileText size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Base Legal</h2>
          </div>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span>Constituição Federal (art. 37, II) — concurso público</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span>Lei nº 8.745/1993 — contratação temporária</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 w-2 h-2 rounded-full bg-purple-400 shrink-0" />
              <span>Lei de Acesso à Informação (Lei nº 12.527/2011)</span>
            </li>
          </ul>
        </section>

      </div>
    </ContentPage>
  );
}
