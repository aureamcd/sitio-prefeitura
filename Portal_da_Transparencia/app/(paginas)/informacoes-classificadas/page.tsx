import ContentPage from "@/components/layout/ContentPage";
import { Lock, Unlock, Shield, Info, FileText, Calendar, AlertTriangle } from "lucide-react";
import { getTodayDate } from '@/lib/utils/date';

export default function InformacoesClassificadasPage() {
  return (
    <ContentPage
      title="Informações Classificadas e Desclassificadas"
      icon={<Shield size={20} strokeWidth={1.5} />}
      description="Rol de informações classificadas em grau de sigilo e de informações desclassificadas, conforme arts. 30 e 45 da Lei de Acesso à Informação (Lei nº 12.527/2011)."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Informações Classificadas e Desclassificadas" },
      ]}
      lastUpdate={getTodayDate()}
    >
      {/* Introdução */}
      <div className="mb-8 bg-blue-50 border-l-4 border-[#173572] p-4 rounded-r-xl">
        <p className="text-sm text-[#173572] font-medium leading-relaxed">
          Em cumprimento aos arts. 30 e 45 da Lei de Acesso à Informação (Lei nº 12.527/2011) e
          aos critérios do PNTP 2026, esta página publica o rol de informações classificadas em
          qualquer grau de sigilo e o rol de informações desclassificadas nos últimos 3 anos.
        </p>
      </div>

      {/* Graus de Sigilo */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { grau: "Ultrassecreto", prazo: "25 anos", cor: "bg-red-50 border-red-200 text-red-700", icone: Lock },
          { grau: "Secreto", prazo: "15 anos", cor: "bg-orange-50 border-orange-200 text-orange-700", icone: Lock },
          { grau: "Reservado", prazo: "5 anos", cor: "bg-amber-50 border-amber-200 text-amber-700", icone: Lock },
        ].map((item) => (
          <div key={item.grau} className={`${item.cor} border rounded-xl p-5 shadow-sm`}>
            <div className="flex items-center gap-2 mb-2">
              <item.icone size={18} />
              <h3 className="font-bold text-sm">{item.grau}</h3>
            </div>
            <p className="text-sm opacity-80">Prazo máximo de sigilo: {item.prazo}</p>
          </div>
        ))}
      </div>

      {/* Rol de Informações Classificadas */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-50 text-red-600 p-2.5 rounded-xl">
            <Lock size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Informações Classificadas</h2>
            <p className="text-xs text-gray-500">
              Art. 30 da LAI — Rol de informações classificadas em grau de sigilo
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-4">
            <Info size={28} />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">
            Não há informações classificadas
          </p>
          <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
            O Município de Padre Marcos declara, para os devidos fins, que <strong>não possui</strong>,
            nos últimos 3 anos (2023 a 2026), nenhuma informação classificada em qualquer grau de sigilo
            (reservado, secreto ou ultrassecreto), nos termos do art. 30 da LAI.
          </p>
        </div>
      </div>

      {/* Rol de Informações Desclassificadas */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
            <Unlock size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Informações Desclassificadas</h2>
            <p className="text-xs text-gray-500">
              Art. 45 da LAI — Rol de informações anteriormente classificadas e posteriormente desclassificadas
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full text-blue-600 mb-4">
            <Info size={28} />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">
            Não houve desclassificação de informações
          </p>
          <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
            O Município de Padre Marcos declara que, no período de 2023 a 2026, <strong>não houve</strong>{' '}
            desclassificação de informações anteriormente classificadas como sigilosas, nos termos do art. 45 da LAI.
          </p>
        </div>
      </div>

      {/* Base Legal */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 leading-relaxed">
            <p className="font-bold mb-1">Base Legal</p>
            <p>
              Arts. 30 e 45 da Lei nº 12.527/2011 (Lei de Acesso à Informação).<br />
              O art. 30 determina a publicação do rol de informações classificadas em cada grau de sigilo.
              O art. 45 determina a publicação do rol de informações desclassificadas.
              Em caso de futura classificação ou desclassificação, esta página será atualizada
              imediatamente.
            </p>
          </div>
        </div>
      </div>
    </ContentPage>
  );
}
