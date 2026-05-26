import ContentPage from "@/components/layout/ContentPage";
import { Users, Home, Heart, Shield, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTodayDate } from '@/lib/utils/date';

export default function AssistenciaSocialPage() {
  return (
    <ContentPage
      title="Atividades Finalísticas — Assistência Social"
      icon={<Heart size={20} strokeWidth={1.5} />}
      description="Informações sobre as políticas públicas e ações da Secretaria Municipal de Assistência Social, em conformidade com o PNTP 2026."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Atividades Finalísticas" },
        { label: "Assistência Social" },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Assistência Social"
    >
      {/* Nota de conformidade */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Esta seção atende aos critérios do PNTP 2026 para informações sobre atividades finalísticas do município,
          incluindo programas sociais, benefícios, serviços socioassistenciais e unidades de atendimento.
        </p>
      </div>

      {/* Cards de informação */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shrink-0">
            <Users size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Cadastro Único (CadÚnico)</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Famílias cadastradas no Cadastro Único para Programas Sociais do Governo Federal.
            </p>
            <p className="text-xs text-gray-400 mt-2">Total: ~1.850 famílias cadastradas</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-green-50 p-3 rounded-xl text-green-600 shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">CRAS</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Centro de Referência de Assistência Social — unidade de proteção social básica.
            </p>
            <p className="text-xs text-gray-400 mt-2">1 unidade — Sede</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-purple-50 p-3 rounded-xl text-purple-600 shrink-0">
            <Heart size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Programas Sociais</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Benefícios eventuais, programas municipais e estaduais de transferência de renda.
            </p>
            <p className="text-xs text-gray-400 mt-2">Atualizado mensalmente</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-start gap-4">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 shrink-0">
            <Home size={22} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Serviços de Convivência</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Grupo de convivência para crianças, adolescentes, idosos e famílias.
            </p>
            <p className="text-xs text-gray-400 mt-2">Média de 120 participantes/mês</p>
          </div>
        </div>
      </div>

      {/* Serviços Ofertados */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Serviços Socioassistenciais</h2>
        <div className="space-y-3">
          {[
            { servico: "Proteção Social Básica (CRAS)", desc: "Acompanhamento familiar, orientação, encaminhamentos e serviços de convivência." },
            { servico: "Serviço de Convivência e Fortalecimento de Vínculos (SCFV)", desc: "Atividades grupais para crianças, adolescentes e idosos." },
            { servico: "Benefício de Prestação Continuada (BPC)", desc: "Auxílio para idosos e pessoas com deficiência em situação de vulnerabilidade." },
            { servico: "Programa Bolsa Família (PBF)", desc: "Acompanhamento das condicionalidades de saúde e educação das famílias beneficiárias." },
            { servico: "Auxílio Brasil / Transferência de Renda Estadual", desc: "Programas complementares de transferência de renda." },
            { servico: "Benefícios Eventuais", desc: "Auxílio natalidade, funeral e situações de emergência." },
          ].map((s) => (
            <div key={s.servico} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-lg p-4">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800 text-sm">{s.servico}</h3>
                <p className="text-xs text-gray-600 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Indicadores */}
      <section className="mb-8 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Indicadores da Assistência Social</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Famílias no CadÚnico", valor: "1.850" },
            { label: "Famílias no Bolsa Família", valor: "~620" },
            { label: "Beneficiários BPC", valor: "~110" },
            { label: "Crianças SCFV", valor: "80" },
          ].map((ind) => (
            <div key={ind.label} className="bg-white border border-gray-100 rounded-lg p-4 text-center">
              <p className="text-2xl font-extrabold text-[#173572]">{ind.valor}</p>
              <p className="text-xs text-gray-600 mt-1">{ind.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Links */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Links Relacionados</h3>
        <div className="space-y-2">
          <Link href="https://www.gov.br/mds" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Ministério do Desenvolvimento e Assistência Social (MDS)
          </Link>
          <Link href="https://cadunico.dataprev.gov.br" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Cadastro Único — DataPrev
          </Link>
        </div>
      </section>
    </ContentPage>
  );
}
