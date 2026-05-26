'use client';

import ContentPage from '@/components/layout/ContentPage';
import { Construction, Info } from 'lucide-react';
import { useTodayDate } from '@/lib/hooks/useTodayDate';

export default function ObrasPage() {
  const today = useTodayDate();
  return (
    <ContentPage
      title="Obras Públicas"
      description="Acompanhamento da execução física e financeira de obras e serviços de engenharia no município."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: "Obras Públicas" },
      ]}
      lastUpdate={today}
    >
      {/* Informação não disponível */}
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
          <Construction size={36} className="text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-3">
          Dados de Obras Públicas Indisponíveis
        </h2>
        <p className="text-gray-500 max-w-lg leading-relaxed text-base mb-8">
          O município ainda não disponibilizou os dados de obras públicas e serviços de engenharia
          para consulta neste portal. Esta seção será atualizada assim que as informações forem
          fornecidas pelos setores responsáveis.
        </p>

        <div className="grid gap-4 sm:grid-cols-3 w-full max-w-2xl">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Situação</p>
            <p className="text-sm font-medium text-gray-700">Em processo de coleta</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Previsão</p>
            <p className="text-sm font-medium text-gray-700">A consultar setor responsável</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Contato</p>
            <p className="text-sm font-medium text-gray-700">e-SIC ou Secretaria de Obras</p>
          </div>
        </div>
      </div>

      {/* Informações sobre o que será publicado */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <Info size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-2">
              Dados previstos para publicação conforme PNTP 2026
            </p>
            <ul className="text-sm text-blue-800/80 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Identificação da obra (objeto, localização, contratada)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Valor total contratado e aditivos (valor atualizado)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Situação: em andamento, concluída ou paralisada
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Percentual executado e medições
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Fotos atualizadas da obra (quando aplicável)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Motivo da paralisação, se aplicável
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-6 py-4">
        <p className="text-sm font-semibold text-gray-700 mb-1">Nota Legal</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          As informações de obras públicas e serviços de engenharia serão publicadas em conformidade com a
          Lei de Licitações (Lei nº 14.133/2021), a Lei de Transparência (LC nº 131/2009) e as normas do
          Tribunal de Contas do Estado do Piauí – PNTP 2026, tão logo sejam disponibilizadas pelo setor competente.
        </p>
      </div>
    </ContentPage>
  );
}
