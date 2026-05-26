import ContentPage from "@/components/layout/ContentPage";
import { Compass, Building2, Sprout, Plane, Briefcase, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getTodayDate } from '@/lib/utils/date';

export default function DemaisProgramasPage() {
  return (
    <ContentPage
      title="Atividades Finalísticas — Demais Programas e Ações"
      icon={<Compass size={20} strokeWidth={1.5} />}
      description="Informações sobre demais políticas públicas, programas e ações municipais, em conformidade com o PNTP 2026."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Atividades Finalísticas" },
        { label: "Demais Programas e Ações" },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Gabinete do Prefeito"
    >
      {/* Nota de conformidade */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Esta seção reúne informações sobre demais programas, projetos e ações municipais que não se enquadram
          exclusivamente nas áreas de Saúde, Educação ou Assistência Social, em atendimento aos critérios do PNTP 2026.
        </p>
      </div>

      {/* Cards por área */}
      <div className="mb-8 space-y-6">
        {/* Agricultura e Meio Ambiente */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-50 p-2.5 rounded-xl text-green-600">
              <Sprout size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Agricultura e Meio Ambiente</h2>
          </div>
          <div className="space-y-3">
            {[
              { programa: "Patrulha Agrícola Mecanizada", desc: "Apoio aos pequenos agricultores com preparo de solo e máquinas agrícolas." },
              { programa: "Programa de Sementes", desc: "Distribuição de sementes de milho, feijão e hortaliças para agricultura familiar." },
              { programa: "Coleta Seletiva e Reciclagem", desc: "Programa municipal de coleta seletiva com associação de catadores." },
              { programa: "Preservação de Nascentes", desc: "Ações de recuperação e preservação de nascentes e recursos hídricos." },
            ].map((p) => (
              <div key={p.programa} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.programa}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infraestrutura e Urbanismo */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <Building2 size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Infraestrutura e Urbanismo</h2>
          </div>
          <div className="space-y-3">
            {[
              { programa: "Programa de Pavimentação", desc: "Calçamento e pavimentação de ruas com parceria estadual e federal." },
              { programa: "Iluminação Pública (LED)", desc: "Substituição gradativa das lâmpadas por tecnologia LED." },
              { programa: "Saneamento Básico", desc: "Ações de ampliação do sistema de abastecimento e esgotamento sanitário." },
              { programa: "Habitação Popular", desc: "Programas de moradia para famílias de baixa renda (Minha Casa Minha Vida)." },
            ].map((p) => (
              <div key={p.programa} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.programa}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cultura, Turismo e Esporte */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600">
              <Plane size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cultura, Turismo e Esporte</h2>
          </div>
          <div className="space-y-3">
            {[
              { programa: "Festejos Municipais", desc: "Apoio às festas tradicionais e eventos culturais do município." },
              { programa: "Pontos de Cultura", desc: "Incentivo a grupos culturais locais e manifestações artísticas." },
              { programa: "Programa de Esportes", desc: "Escolinhas de futebol, vôlei e atividades físicas para a comunidade." },
              { programa: "Turismo Local", desc: "Desenvolvimento do potencial turístico do município." },
            ].map((p) => (
              <div key={p.programa} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.programa}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desenvolvimento Econômico */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <Briefcase size={22} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Desenvolvimento Econômico e Geração de Renda</h2>
          </div>
          <div className="space-y-3">
            {[
              { programa: "Qualificação Profissional", desc: "Cursos profissionalizantes e capacitação para o mercado de trabalho." },
              { programa: "Apoio ao Empreendedor", desc: "Apoio a microempreendedores individuais (MEI) e pequenos negócios." },
              { programa: "Feira do Produtor", desc: "Espaço para comercialização de produtos da agricultura familiar." },
            ].map((p) => (
              <div key={p.programa} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{p.programa}</h3>
                  <p className="text-xs text-gray-600 mt-0.5">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="font-bold text-gray-900 mb-3">Links Relacionados</h3>
        <div className="space-y-2">
          <Link href="https://www.gov.br/cultura" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Ministério da Cultura
          </Link>
          <Link href="https://www.gov.br/esporte" className="flex items-center gap-2 text-sm text-[#173572] hover:underline">
            <ExternalLink size={14} /> Ministério do Esporte
          </Link>
        </div>
      </section>
    </ContentPage>
  );
}
