import ContentPage from "@/components/layout/ContentPage";
import { BookOpen, School, Users, Calendar, ClipboardList, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTodayDate } from '@/lib/utils/date';

export default function EducacaoPage() {
  return (
    <ContentPage
      title="Atividades Finalísticas — Educação"
      icon={<BookOpen size={20} strokeWidth={1.5} />}
      description="Informações sobre as políticas públicas e ações da Secretaria Municipal de Educação, em conformidade com o PNTP 2026."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Atividades Finalísticas" },
        { label: "Educação" },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Educação"
    >
      {/* Nota de conformidade */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Esta seção atende aos critérios do PNTP 2026 para informações sobre atividades finalísticas do município,
          incluindo plano municipal de educação, lista de espera em creches, escala de profissionais e resultados educacionais.
        </p>
      </div>

      {/* Cards de informação */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
            <ClipboardList size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Plano Municipal de Educação (PME)</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Plano decenal com metas e estratégias para a educação municipal.
            </p>
            <p className="text-xs text-gray-400 mt-2">Vigência: 2025–2035</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Lista de Espera — Creche</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Relação de crianças aguardando vaga em creche municipal, por faixa etária e região.
            </p>
            <p className="text-xs text-gray-400 mt-2">Atualizado em: maio/2026</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600 shrink-0">
            <School size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Rede Municipal de Ensino</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Escolas municipais, número de alunos matriculados, turmas e modalidades de ensino.
            </p>
            <p className="text-xs text-gray-400 mt-2">Ano letivo: 2026</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600 shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Calendário Escolar</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Calendário letivo com dias letivos, recessos e feriados municipais.
            </p>
            <p className="text-xs text-gray-400 mt-2">Ano: 2026</p>
          </div>
        </div>
      </div>

      {/* Escolas Municipais */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Escolas Municipais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { nome: "Escola Municipal João XXIII", nivel: "Ensino Fundamental (1º ao 9º ano)", alunos: 320, localizacao: "Sede" },
            { nome: "Creche Municipal Tia Maria", nivel: "Educação Infantil (0 a 3 anos)", alunos: 80, localizacao: "Sede" },
            { nome: "Escola Municipal São João", nivel: "Ensino Fundamental (1º ao 5º ano)", alunos: 150, localizacao: "Zona Rural" },
            { nome: "Escola Municipal Santa Luzia", nivel: "Ensino Fundamental (1º ao 5º ano)", alunos: 120, localizacao: "Zona Rural" },
          ].map((e) => (
            <div key={e.nome} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <School size={20} className="text-[#173572] mb-2" />
              <h3 className="font-bold text-gray-900 text-sm">{e.nome}</h3>
              <p className="text-xs text-gray-500 mt-1">{e.nivel}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{e.alunos} alunos</span>
                <span>{e.localizacao}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Programas */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Programas e Ações</h2>
        <div className="space-y-3">
          {[
            { programa: "Programa de Alimentação Escolar (PNAE)", desc: "Merenda escolar balanceada para todos os alunos da rede municipal." },
            { programa: "Programa Nacional do Livro Didático (PNLD)", desc: "Distribuição de livros didáticos para alunos do ensino fundamental." },
            { programa: "Transporte Escolar", desc: "Frota de veículos para transporte de alunos da zona rural." },
            { programa: "Programa Saúde na Escola (PSE)", desc: "Ações de prevenção e promoção da saúde no ambiente escolar." },
            { programa: "Formação Continuada de Professores", desc: "Capacitação e aperfeiçoamento dos profissionais da educação." },
          ].map((p) => (
            <div key={p.programa} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-lg p-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{p.programa}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resultados */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8">
        <h3 className="font-bold text-gray-900 mb-3">Indicadores Educacionais</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Taxa de Alfabetização", valor: "87,3%", ano: "2024" },
            { label: "IDEB — Anos Iniciais", valor: "5,2", ano: "2024" },
            { label: "Matrículas na Rede", valor: "1.120", ano: "2026" },
          ].map((ind) => (
            <div key={ind.label} className="bg-white border border-gray-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-extrabold text-[#173572]">{ind.valor}</p>
              <p className="text-xs text-gray-600 mt-1">{ind.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Ano: {ind.ano}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Links Relacionados</h3>
        <div className="space-y-2">
          <Link href="https://www.gov.br/mec" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Ministério da Educação
          </Link>
          <Link href="https://www.educacao.pi.gov.br" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Secretaria Estadual de Educação do Piauí
          </Link>
          <Link href="https://www.gov.br/inep" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> INEP — Instituto Nacional de Estudos e Pesquisas Educacionais
          </Link>
        </div>
      </section>
    </ContentPage>
  );
}
