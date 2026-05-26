'use client';

import { useState, useMemo } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { useAvailableYears } from '@/lib/supabase/client';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];
interface Renuncia {
  exercicio: string;
  tributo: string;
  atoConcessorio: string;
  beneficiario: string;
  cpfCnpj: string;
  justificativa: string;
  valor: number;
}

const MOCK_DATA: Renuncia[] = [
  {
    exercicio: '2026',
    tributo: 'IPTU',
    atoConcessorio: 'Lei nº 1.247/2024, de 12/01/2024',
    beneficiario: 'Associação de Moradores do Bairro Jardim Esperança',
    cpfCnpj: '11.223.344/0001-55',
    justificativa: 'Imunidade concedida a entidade sem fins lucrativos nos termos do art. 150, VI, "c" da CF/88',
    valor: 4200.00,
  },
  {
    exercicio: '2026',
    tributo: 'ISS',
    atoConcessorio: 'Lei nº 1.312/2025, de 05/03/2025',
    beneficiario: 'Cooperativa de Trabalho dos Profissionais de Saúde do Piauí – COOPSA',
    cpfCnpj: '22.334.455/0001-66',
    justificativa: 'Isenção de ISS concedida a cooperativas de saúde vinculadas ao SUS conforme legislação municipal',
    valor: 9800.00,
  },
  {
    exercicio: '2025',
    tributo: 'ITBI',
    atoConcessorio: 'Decreto nº 892/2025, de 20/06/2025',
    beneficiario: 'Maria José Alves da Silva',
    cpfCnpj: '123.456.789-00',
    justificativa: 'Isenção de ITBI para aquisição de primeiro imóvel residencial por beneficiário de programa habitacional popular',
    valor: 1540.00,
  },
  {
    exercicio: '2025',
    tributo: 'IPTU',
    atoConcessorio: 'Lei nº 1.290/2024, de 30/10/2024',
    beneficiario: 'Igreja Evangélica Assembleia de Deus – Congregação Central',
    cpfCnpj: '33.445.566/0001-77',
    justificativa: 'Imunidade tributária a templo de qualquer culto, nos termos do art. 150, VI, "b" da Constituição Federal',
    valor: 3150.00,
  },
];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function RenunciasDeReceitasPage() {
  const { anos: ANOS } = useAvailableYears('renuncias');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });

  const handleChange = (field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClear = () => setFilters({ ano: '', mes: '', busca: '' });

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca);

  const filteredData = useMemo(() => {
    const term = filters.busca.toLowerCase().trim();
    if (!term) return MOCK_DATA;
    return MOCK_DATA.filter(row =>
      [row.exercicio, row.tributo, row.atoConcessorio, row.beneficiario, row.cpfCnpj, row.justificativa].some(f =>
        f.toLowerCase().includes(term)
      )
    );
  }, [filters.busca]);

  const totalRenuncia = filteredData.reduce((s, r) => s + r.valor, 0);
  const totalTributos = useMemo(() => [...new Set(filteredData.map(r => r.tributo))].length, [filteredData]);

  const columns = [
    { header: 'Exercício', accessor: 'exercicio' },
    { header: 'Tributo', accessor: 'tributo' },
    { header: 'Ato Concessório', accessor: 'atoConcessorio' },
    {
      header: 'Beneficiário',
      accessor: 'beneficiario',
      render: (val: string, row: Renuncia) => (
        <div>
          <span className="font-semibold text-gray-900">{val}</span>
          <br />
          <span className="text-xs text-gray-500">{row.cpfCnpj}</span>
        </div>
      ),
    },
    {
      header: 'Justificativa / Finalidade',
      accessor: 'justificativa',
      render: (val: string) => (
        <span
          className="block max-w-[280px]"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          title={val}
        >
          {val}
        </span>
      ),
    },
    {
      header: 'Valor da Renúncia',
      accessor: 'valor',
      render: (val: number) => (
        <span className="block text-right tabular-nums font-bold text-red-600">{formatBRL(val)}</span>
      ),
    },
  ];

  return (
    <ContentPage showSearch={false}
      title="Renúncias de Receita"
      description="Isenções, imunidades e desonerações tributárias concedidas pelo município, publicadas em conformidade com o PNTP 2026 e a Lei de Responsabilidade Fiscal."
    >
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Mini Dashboard Renúncias */}
      <div className="mt-4 mb-4 max-w-3xl mx-auto bg-white border border-red-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">

        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-amber-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <div className="flex flex-col items-center w-full relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-red-800 uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
            Exercício {filters.ano || 'Geral'} {filters.mes ? `· ${MESES.find((m) => m.value === filters.mes)?.label}` : ''}
          </span>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-10 w-full">
            <div className="flex flex-col items-center p-2 rounded-xl hover:bg-red-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-red-600/70 uppercase tracking-wider mb-1">Total de Renúncias</p>
              <p className="text-xl sm:text-2xl font-extrabold text-red-700 tabular-nums">{formatBRL(totalRenuncia)}</p>
            </div>

            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-red-200 to-transparent" />

            <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registros</p>
              <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{filteredData.length}</p>
            </div>

            <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-amber-200 to-transparent" />

            <div className="flex flex-col items-center p-2 rounded-xl hover:bg-amber-50 transition-colors">
              <p className="text-[10px] sm:text-xs font-semibold text-amber-600/70 uppercase tracking-wider mb-1">Tributos</p>
              <p className="text-xl sm:text-2xl font-extrabold text-amber-600 tabular-nums">{totalTributos}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100 w-full flex justify-center">
             <span className="text-xs text-gray-400">
               {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''} encontrado{filteredData.length !== 1 ? 's' : ''}
             </span>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        title="Renúncias de Receita"
        exportable
        updatedAt="25/05/2026"
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Legal note */}
      <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <strong>Nota Legal:</strong> A divulgação das renúncias de receita obedece ao art. 14 da Lei Complementar
        nº 101/2000 (LRF), que exige a estimativa do impacto orçamentário-financeiro, a demonstração de que a
        renúncia foi considerada na Lei de Diretrizes Orçamentárias e a adoção de medidas compensatórias.
        Informações atualizadas conforme PNTP 2026 – TCE-PI.
      </div>
    </ContentPage>
  );
}

