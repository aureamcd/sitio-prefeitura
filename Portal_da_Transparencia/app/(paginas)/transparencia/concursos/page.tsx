'use client';

import { useState, useMemo, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { FileText, Users, ClipboardList, ExternalLink } from 'lucide-react';

// ---------------------------------------------------------------------------
// Static data (mock — será substituído por dados reais do banco futuramente)
// ---------------------------------------------------------------------------
const MOCK_DATA = [
  {
    id: 1,
    ano: "2026",
    edital: "001/2026",
    tipo: "Concurso Público",
    cargos: "Professor, Médico, Enfermeiro, Assistente Social, Aux. Administrativo",
    vagas: 45,
    situacao: "Em Andamento",
    data_publicacao: "15/02/2026",
    link_edital: "#",
    link_aprovados: null,
    link_nomeacoes: null,
    banca_organizadora: "NUCEPE",
    banca_site: "https://www.nucepe.uespi.br",
  },
  {
    id: 2,
    ano: "2025",
    edital: "002/2025",
    tipo: "Processo Seletivo Simplificado",
    cargos: "Motorista Escolar, Vigia, Merendeira",
    vagas: 20,
    situacao: "Homologado",
    data_publicacao: "10/06/2025",
    link_edital: "#",
    link_aprovados: "#",
    link_nomeacoes: "#",
    banca_organizadora: "Comissão Própria",
    banca_site: null,
  },
  {
    id: 3,
    ano: "2024",
    edital: "001/2024",
    tipo: "Concurso Público",
    cargos: "Guarda Civil Municipal",
    vagas: 15,
    situacao: "Concluído",
    data_publicacao: "05/01/2024",
    link_edital: "#",
    link_aprovados: "#",
    link_nomeacoes: "#",
    banca_organizadora: "NUCEPE",
    banca_site: "https://www.nucepe.uespi.br",
  },
];

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

const ANOS = ['2024', '2025', '2026'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalize(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getSituacaoBadge(situacao: string) {
  if (situacao === 'Em Andamento') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (situacao === 'Homologado') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (situacao === 'Inscrições Abertas') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (situacao === 'Concluído') return 'bg-gray-100 text-gray-700 border-gray-300';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function ConcursosPage() {
  const today = useTodayDate();
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '', entidade: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca' | 'entidade', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '', entidade: '' });
  }, []);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter((item) => {
      if (filters.ano && item.ano !== filters.ano) return false;

      if (filters.mes) {
        const itemMes = item.data_publicacao.split('/')[1];
        if (itemMes !== filters.mes) return false;
      }

      if (filters.busca) {
        const term = normalize(filters.busca);
        return (
          normalize(item.edital).includes(term) ||
          normalize(item.tipo).includes(term) ||
          normalize(item.situacao).includes(term) ||
          normalize(item.cargos).includes(term) ||
          normalize(item.banca_organizadora).includes(term)
        );
      }

      return true;
    });
  }, [filters]);

  const columns = [
    {
      header: "Identificação do Certame",
      accessor: "tipo",
      render: (val: string, row: typeof MOCK_DATA[0]) => (
        <div>
          <p className="text-sm font-semibold text-gray-900">{val} — Edital nº {row.edital}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="font-medium">Ano:</span> {row.ano}
            {' · '}
            <span className="font-medium">Publicação:</span> {row.data_publicacao}
          </p>
        </div>
      ),
    },
    {
      header: "Situação",
      accessor: "situacao",
      render: (val: string) => (
        <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-semibold ${getSituacaoBadge(val)}`}>
          {val}
        </span>
      ),
    },
    {
      header: "Banca Organizadora",
      accessor: "banca_organizadora",
      render: (val: string, row: typeof MOCK_DATA[0]) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 w-fit">
            {val || '-'}
          </span>
          {row.banca_site && (
            <a
              href={row.banca_site}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 underline underline-offset-2 mt-0.5"
            >
              <ExternalLink size={10} />
              Site da banca
            </a>
          )}
        </div>
      ),
    },
    {
      header: "Documentos",
      accessor: "acoes",
      render: (val: string, row: typeof MOCK_DATA[0]) => (
        <div className="flex flex-wrap gap-1.5">
          <a
            href={row.link_edital}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-semibold hover:bg-blue-100 transition-colors border border-blue-100"
            title="Baixar edital completo"
          >
            <FileText size={12} />
            Edital
          </a>

          {row.link_aprovados ? (
            <a
              href={row.link_aprovados}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-semibold hover:bg-emerald-100 transition-colors border border-emerald-100"
              title="Lista de aprovados e classificação"
            >
              <Users size={12} />
              Aprovados
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-[11px] border border-gray-100 cursor-not-allowed" title="Disponível após homologação">
              <Users size={12} />
              Aprovados
            </span>
          )}

          {row.link_nomeacoes ? (
            <a
              href={row.link_nomeacoes}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-semibold hover:bg-amber-100 transition-colors border border-amber-100"
              title="Nomeações e convocações realizadas"
            >
              <ClipboardList size={12} />
              Nomeações
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-[11px] border border-gray-100 cursor-not-allowed" title="Disponível após conclusão">
              <ClipboardList size={12} />
              Nomeações
            </span>
          )}
        </div>
      ),
    },
  ];

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
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Totalizer strip */}
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Certames</p>
          <p className="text-xl font-semibold text-gray-800 tabular-nums">{filteredData.length}</p>
        </div>
        <div className="w-px h-8 bg-gray-200 hidden sm:block" />
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Vagas Ofertadas</p>
          <p className="text-xl font-semibold text-gray-900 tabular-nums">
            {filteredData.reduce((acc, curr) => acc + curr.vagas, 0)}
          </p>
        </div>
      </div>

      <DataTable
        title="Relação de Concursos e Processos Seletivos"
        columns={columns}
        data={filteredData}
        exportable={true}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Aviso sobre banca organizadora */}
      <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <ExternalLink size={18} className="text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-purple-800 mb-1">Sobre a Banca Organizadora</p>
            <p className="text-sm text-purple-700/80 leading-relaxed">
              Quando as listas de aprovados e nomeações são publicadas no site da banca organizadora,
              a tabela acima disponibiliza o link direto para consulta externa. O cidadão pode acessar
              os dados completos de classificação e convocações diretamente no site da banca, sem necessidade
              de cadastro ou login.
            </p>
          </div>
        </div>
      </div>

      {/* Legal note */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Nota Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A publicação das informações referentes a concursos públicos e processos seletivos simplificados atende
          ao princípio constitucional da publicidade (Art. 37 da Constituição Federal) e obedece às diretrizes do
          Programa Nacional de Transparência Pública (PNTP). Os editais, resultados parciais/finais e atos de
          nomeação/convocação podem ser acompanhados nesta página.
        </p>
      </div>
    </ContentPage>
  );
}
