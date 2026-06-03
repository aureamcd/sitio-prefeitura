'use client';

import { useState, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import {
  GraduationCap,
  Info,
} from 'lucide-react';

const ANOS = ['2024', '2025', '2026'];

// ============================================================================
// Declaração de inexistência padronizada
// ============================================================================
function DeclaracaoInexistencia() {
  const today = new Date().toLocaleDateString('pt-BR');
  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-16 text-center flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
          <GraduationCap size={28} className="text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Declaração de Inexistência — Concursos e Processos Seletivos</h3>
        <p className="text-sm text-gray-600 max-w-lg leading-relaxed">
          A Prefeitura Municipal de Padre Marcos — PI informa que, no momento, não há concursos públicos ou processos seletivos simplificados em andamento, homologados ou concluídos registrados no banco de dados do portal. Os dados serão publicados tão logo os certames sejam realizados e os registros sejam inseridos no sistema.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <Info size={14} className="text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700 font-medium">
            Declaração atualizada em {today}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function ConcursosPage() {
  const today = useTodayDate();

  return (
    <ContentPage
      title="Concursos e Processos Seletivos"
      description="Acesse a relação completa de concursos públicos e processos seletivos simplificados, com editais, lista de aprovados, nomeações e informações sobre a banca organizadora."
      breadcrumb={[
        { label: "Portal da Transparência", href: "/" },
        { label: "Concursos e Seleções" },
      ]}
      lastUpdate={today}
    >
      <DeclaracaoInexistencia />

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação das informações referentes a concursos públicos e processos seletivos simplificados atende
          ao princípio constitucional da publicidade (Art. 37 da Constituição Federal) e obedece às diretrizes do
          Programa Nacional de Transparência Pública (PNTP). Os editais, resultados parciais/finais e atos de
          nomeação/convocação serão publicados nesta página tão logo sejam disponibilizados.
        </p>
      </div>
    </ContentPage>
  );
}
