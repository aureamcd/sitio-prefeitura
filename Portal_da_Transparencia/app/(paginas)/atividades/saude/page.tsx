import ContentPage from "@/components/layout/ContentPage";
import { Heart, Stethoscope, Pill, Users, Calendar, FileText, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTodayDate } from '@/lib/utils/date';

export default function SaudePage() {
  return (
    <ContentPage
      title="Atividades Finalísticas — Saúde"
      icon={<Heart size={20} strokeWidth={1.5} />}
      description="Informações sobre as políticas públicas e ações da Secretaria Municipal de Saúde, em conformidade com o PNTP 2026."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Atividades Finalísticas" },
        { label: "Saúde" },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Saúde"
    >
      {/* Nota de conformidade */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Esta seção atende aos critérios do PNTP 2026 para informações sobre atividades finalísticas do município,
          incluindo plano municipal, lista de espera, escala de profissionais e programas em execução na área da saúde.
        </p>
      </div>

      {/* Cards de informação */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600 shrink-0">
            <FileText size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Plano Municipal de Saúde</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Plano que define as diretrizes, objetivos e metas da saúde municipal para o quadriênio.
            </p>
            <p className="text-xs text-gray-400 mt-2">Período: 2025–2028</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
            <Pill size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Relação de Medicamentos</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Relação Municipal de Medicamentos Essenciais (REMUME) com medicamentos disponíveis na rede pública.
            </p>
            <p className="text-xs text-gray-400 mt-2">Atualizado em: maio/2026</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Escala de Profissionais</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Escala mensal de médicos, enfermeiros e demais profissionais da rede municipal de saúde.
            </p>
            <p className="text-xs text-gray-400 mt-2">Atualizado mensalmente</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-red-50 p-3 rounded-xl text-red-600 shrink-0">
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Lista de Espera</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Fila de espera por consultas especializadas, exames e cirurgias eletivas.
            </p>
            <p className="text-xs text-gray-400 mt-2">Atualizado em: maio/2026</p>
          </div>
        </div>
      </div>

      {/* Unidades de Saúde */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Unidades de Saúde</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { nome: "UBS - Centro de Saúde", endereco: "Rua Principal, s/n, Centro", horario: "7h às 17h (seg-sex)" },
            { nome: "PSF - São Francisco", endereco: "Rua Projetada, 100, São Francisco", horario: "7h às 12h (seg-sex)" },
            { nome: "PSF - Santa Teresinha", endereco: "Av. das Palmeiras, s/n, Santa Teresinha", horario: "7h às 12h (seg-sex)" },
          ].map((u) => (
            <div key={u.nome} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <Stethoscope size={20} className="text-[#173572] mb-2" />
              <h3 className="font-bold text-gray-900 text-sm">{u.nome}</h3>
              <p className="text-xs text-gray-500 mt-1">{u.endereco}</p>
              <p className="text-xs text-gray-400 mt-1">{u.horario}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programas */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Programas e Ações em Execução</h2>
        <div className="space-y-3">
          {[
            { programa: "Saúde da Família (ESF)", desc: "Equipes multiprofissionais atuando na atenção básica com cobertura de 100% do território municipal." },
            { programa: "Programa de Imunização", desc: "Campanhas de vacinação e cobertura vacinal conforme calendário nacional do SUS." },
            { programa: "Vigilância Sanitária", desc: "Fiscalização de estabelecimentos, alimentos e serviços de interesse à saúde." },
            { programa: "Saúde Bucal", desc: "Atendimento odontológico nas UBSs com equipes de saúde bucal." },
            { programa: "NASF-AB", desc: "Núcleo de Apoio à Saúde da Família com psicólogos, nutricionistas e fisioterapeutas." },
            { programa: "Programa Farmácia Popular", desc: "Dispensação de medicamentos gratuitos do programa federal." },
          ].map((p) => (
            <div key={p.programa} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-lg p-4">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{p.programa}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Links Relacionados</h3>
        <div className="space-y-2">
          <Link href="https://www.gov.br/saude" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Ministério da Saúde
          </Link>
          <Link href="https://www.saude.pi.gov.br" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Secretaria Estadual de Saúde do Piauí
          </Link>
        </div>
      </section>
    </ContentPage>
  );
}
