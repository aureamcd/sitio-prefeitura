'use client';

import { useState, useCallback, useEffect } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { createBrowserClient, useAvailableYears } from '@/lib/supabase/client';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import { deduplicateServidores } from '@/lib/utils/deduplicate';
import {
  Users,
  DollarSign,
  FileText,
  GraduationCap,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
];

function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getVinculoBadge(vinculo: string) {
  if (!vinculo) return 'bg-gray-50 text-gray-700 border-gray-200';
  const v = vinculo.toLowerCase();
  if (v.includes('efetivo')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (v.includes('comissionado')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (v.includes('temporário') || v.includes('temporario')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function formatDate(val: string | null): string {
  if (!val) return '-';
  return new Date(val).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// ============================================================================
// Tab: Servidores (Aba 1)
// ============================================================================
function ServidoresTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: any;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('servidores')
        .select('*');

      if (filters.status === 'ativo') {
        query = query.eq('ativo', true).is('data_desligamento', null);
      } else if (filters.status === 'desligado') {
        query = query.or('ativo.eq.false,data_desligamento.not.is.null');
      }

      if (filters.busca) {
        query = query.or(`nome.ilike.%${filters.busca}%,cargo.ilike.%${filters.busca}%,lotacao.ilike.%${filters.busca}%`);
      }

      const { data: result, error } = await query.order('nome', { ascending: true });
      if (!error && result) setData(deduplicateServidores(result));
      else setData([]);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [filters.busca, filters.status, supabase]);

  const totalServidores = data.length;

  return (
    <div>
      {/* Totalizer strip */}
      <div className="mt-4 bg-gray-50 rounded-xl px-6 py-4 flex flex-wrap gap-6 items-center border border-gray-100 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-0.5">Total de Servidores (Filtro)</p>
          {loading ? (
            <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-xl font-semibold text-gray-800 tabular-nums">{totalServidores}</p>
          )}
        </div>
      </div>

      <DataTable
        title="Quadro Geral de Servidores"
        columns={[
          {
            header: 'Servidor / Matrícula',
            accessor: 'nome',
            render: (val: string, row: any) => (
              <div>
                <p className="text-sm font-semibold text-gray-900">{val}</p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">Mat: {row.matricula || '-'}</p>
              </div>
            ),
          },
          {
            header: 'Cargo e Vínculo',
            accessor: 'cargo',
            render: (val: string, row: any) => (
              <div className="flex flex-col gap-1 items-start">
                <p className="text-sm font-medium text-gray-800">{val || '-'}</p>
                <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wide ${getVinculoBadge(row.situacao || row.vinculo || '')}`}>
                  {row.situacao || row.vinculo || 'Vínculo N/D'}
                </span>
              </div>
            ),
          },
          {
            header: 'Lotação',
            accessor: 'lotacao',
            render: (val: string) => (
              <div className="max-w-[200px]">
                <p className="text-xs text-gray-700 line-clamp-2" title={val || '-'}>{val || '-'}</p>
              </div>
            ),
          },
          {
            header: 'Carga Horária',
            accessor: 'carga_horaria',
            render: (val: string) => (
              <div className="text-center">
                <span className="text-sm text-gray-700 tabular-nums">{val ? `${val}h/sem` : 'N/D'}</span>
              </div>
            ),
          },
          {
            header: 'Admissão',
            accessor: 'data_admissao',
            render: (val: string) => (
              <span className="text-sm text-gray-600">{formatDate(val)}</span>
            ),
          },
          {
            header: 'Desligamento',
            accessor: 'data_desligamento',
            render: (val: string) => (
              <span className="text-sm text-gray-600">{formatDate(val)}</span>
            ),
          },
        ]}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}

// ============================================================================
// Tab: Folha de Pagamento / Remuneração (Aba 2)
// ============================================================================
function RemuneracaoTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('remuneracoes')
        .select('*');

      if (filters.ano) query = query.eq('ano', parseInt(filters.ano));
      if (filters.mes) query = query.eq('mes', parseInt(filters.mes));
      if (filters.busca) {
        query = query.or(`nome.ilike.%${filters.busca}%,cargo.ilike.%${filters.busca}%`);
      }

      const { data: result, error } = await query.order('nome', { ascending: true });
      if (!error && result) setData(result);
      else setData([]);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [filters.ano, filters.mes, filters.busca, supabase]);

  const totalBruto = data.reduce((acc, curr) => acc + (Number(curr.remuneracao_bruta) || 0), 0);
  const totalDescontos = data.reduce((acc, curr) => acc + (Number(curr.descontos) || 0), 0);
  const totalLiquido = data.reduce((acc, curr) => acc + (Number(curr.remuneracao_liquida) || 0), 0);

  return (
    <div>
      {/* Dashboard summary */}
      <div className="mt-4 mb-4 mx-auto bg-white border border-blue-100 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-100 rounded-full blur-2xl opacity-50 pointer-events-none" />

        <span className="relative z-10 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1 text-[10px] sm:text-xs font-semibold tracking-widest text-[#0B3D91] uppercase mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block animate-pulse" />
          Folha de Pagamento — {filters.ano || 'Geral'}{filters.mes ? ` / ${MESES.find(m => m.value === filters.mes)?.label}` : ''}
        </span>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full relative z-10">
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Bruto</p>
            {loading ? (
              <div className="h-6 w-24 bg-gray-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-slate-700 tabular-nums">{formatBRL(totalBruto)}</p>
            )}
          </div>
          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-red-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-red-600/70 uppercase tracking-wider mb-1">Total Descontos</p>
            {loading ? (
              <div className="h-6 w-24 bg-red-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-red-600 tabular-nums">-{formatBRL(totalDescontos)}</p>
            )}
          </div>
          <div className="hidden sm:block w-px bg-gradient-to-b from-transparent via-emerald-200 to-transparent" />
          <div className="flex flex-col items-center p-2 rounded-xl hover:bg-emerald-50 transition-colors">
            <p className="text-[10px] sm:text-xs font-semibold text-emerald-600/70 uppercase tracking-wider mb-1">Total Líquido</p>
            {loading ? (
              <div className="h-6 w-24 bg-emerald-100 animate-pulse rounded mt-1" />
            ) : (
              <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums">{formatBRL(totalLiquido)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Aviso de busca aberta */}
      <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
        <p className="text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle size={14} className="shrink-0" />
          A busca por servidores é totalmente aberta — não é necessário cadastro, login, CPF ou matrícula para consultar a remuneração.
        </p>
      </div>

      <DataTable
        title={`Folha de Pagamento - ${filters.ano || 'Geral'}`}
        columns={[
          {
            header: 'Servidor',
            accessor: 'nome',
            render: (val: string, row: any) => (
              <div>
                <p className="text-sm font-semibold text-gray-900">{val}</p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">Mat: {row.matricula || '-'}</p>
              </div>
            ),
          },
          {
            header: 'Cargo',
            accessor: 'cargo',
            render: (val: string) => (
              <span className="text-sm text-gray-700">{val || '-'}</span>
            ),
          },
          {
            header: 'Tipo de Folha',
            accessor: 'tipo',
            render: (val: string) => (
              <span className="inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-[#0B3D91] border-blue-200">
                {val || 'Folha Mensal'}
              </span>
            ),
          },
          {
            header: 'Remuneração Bruta',
            accessor: 'remuneracao_bruta',
            render: (val: number) => (
              <div className="text-right">
                <span className="font-medium text-gray-800 tabular-nums">{formatBRL(Number(val))}</span>
              </div>
            ),
          },
          {
            header: 'Descontos',
            accessor: 'descontos',
            render: (val: number) => (
              <div className="text-right">
                <span className="text-sm text-red-600 tabular-nums">-{formatBRL(Number(val))}</span>
              </div>
            ),
          },
          {
            header: 'Líquido',
            accessor: 'remuneracao_liquida',
            render: (val: number) => (
              <div className="text-right">
                <span className="font-semibold text-gray-900 tabular-nums">{formatBRL(Number(val))}</span>
              </div>
            ),
          },
        ]}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}

// ============================================================================
// Tab: Padrão Remuneratório (Aba 3)
// ============================================================================
const PADROES = [
  { cargo: 'Prefeito', nivel: 'Único', faixa: 'Subsídio', valor_min: 18000.00, valor_max: 18000.00 },
  { cargo: 'Vice-Prefeito', nivel: 'Único', faixa: 'Subsídio', valor_min: 9000.00, valor_max: 9000.00 },
  { cargo: 'Secretário Municipal', nivel: 'Único', faixa: 'Subsídio', valor_min: 7000.00, valor_max: 7000.00 },
  { cargo: 'Procurador Geral', nivel: 'Único', faixa: 'Subsídio', valor_min: 12000.00, valor_max: 12000.00 },
  { cargo: 'Controlador Geral', nivel: 'Único', faixa: 'Subsídio', valor_min: 8000.00, valor_max: 8000.00 },
  { cargo: 'Professor Nível Superior (40h)', nivel: 'A', faixa: 'Vencimento + Gratificações', valor_min: 4587.00, valor_max: 6500.00 },
  { cargo: 'Professor Nível Médio (40h)', nivel: 'B', faixa: 'Vencimento + Gratificações', valor_min: 3188.00, valor_max: 4500.00 },
  { cargo: 'Médico (40h)', nivel: 'Superior', faixa: 'Vencimento + Gratificações', valor_min: 10000.00, valor_max: 15000.00 },
  { cargo: 'Enfermeiro (40h)', nivel: 'Superior', faixa: 'Vencimento + Gratificações', valor_min: 4000.00, valor_max: 6000.00 },
  { cargo: 'Técnico em Enfermagem (40h)', nivel: 'Médio', faixa: 'Vencimento + Gratificações', valor_min: 2000.00, valor_max: 3500.00 },
  { cargo: 'Agente Administrativo (40h)', nivel: 'Médio', faixa: 'Vencimento + Gratificações', valor_min: 1500.00, valor_max: 2800.00 },
  { cargo: 'Auxiliar de Serviços Gerais (40h)', nivel: 'Fundamental', faixa: 'Vencimento + Gratificações', valor_min: 1300.00, valor_max: 2000.00 },
  { cargo: 'Motorista (40h)', nivel: 'Médio', faixa: 'Vencimento + Gratificações', valor_min: 1600.00, valor_max: 3000.00 },
  { cargo: 'Vigia (40h)', nivel: 'Fundamental', faixa: 'Vencimento + Gratificações', valor_min: 1300.00, valor_max: 1800.00 },
  { cargo: 'Assistente Social (40h)', nivel: 'Superior', faixa: 'Vencimento + Gratificações', valor_min: 3500.00, valor_max: 5500.00 },
  { cargo: 'Fiscal de Tributos (40h)', nivel: 'Médio', faixa: 'Vencimento + Gratificações', valor_min: 2200.00, valor_max: 4000.00 },
  { cargo: 'Cargos Comissionados', nivel: 'CC', faixa: 'Subsídio', valor_min: 1800.00, valor_max: 6000.00 },
];

function PadraoRemuneratorioTab() {
  return (
    <div className="mt-4 space-y-6">
      {/* Aviso sobre a base legal */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <FileText size={20} className="text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Base Legal</p>
            <p className="text-sm text-blue-700/80 leading-relaxed">
              Os valores abaixo são referenciais e podem sofrer atualizações conforme leis municipais
              específicas. Consulte a legislação completa para detalhes oficiais.
            </p>
          </div>
        </div>
        <Link
          href="/transparencia/legislacao"
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all"
        >
          <FileText size={16} />
          Legislação Municipal
        </Link>
      </div>

      {/* Tabela de Padrões */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-5 py-3.5 text-left text-sm font-semibold text-gray-700">Cargo / Função</th>
                <th scope="col" className="px-5 py-3.5 text-left text-sm font-semibold text-gray-700">Nível</th>
                <th scope="col" className="px-5 py-3.5 text-left text-sm font-semibold text-gray-700">Tipo de Remuneração</th>
                <th scope="col" className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">Mínimo</th>
                <th scope="col" className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">Máximo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PADROES.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{item.cargo}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {item.nivel}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{item.faixa}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-800 tabular-nums text-right font-medium">{formatBRL(item.valor_min)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-800 tabular-nums text-right font-medium">{formatBRL(item.valor_max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota explicativa */}
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-6 py-4">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong className="text-gray-700">Observação:</strong> Os valores apresentados são referenciais
          e baseados na legislação municipal vigente. Cargos comissionados (CC) podem ter variações
          conforme o grau de responsabilidade e atribuições específicas. Para informações detalhadas
          sobre cada cargo, consulte o plano de cargos, carreiras e salários (PCCS) do município,
          disponível na seção de Legislação Municipal.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Tab: Estagiários (Aba 4)
// ============================================================================
function EstagiariosTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('estagiarios')
        .select('*');

      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano));
      }
      if (filters.busca) {
        query = query.ilike('nome', `%${filters.busca}%`);
      }

      const { data: result, error } = await query.order('nome', { ascending: true });
      if (!error && result) setData(result);
      else setData([]);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [filters.ano, filters.busca, supabase]);

  const dataAtualizada = new Date().toLocaleDateString('pt-BR');
  const emptyMsg = (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-gray-700 text-sm max-w-2xl text-center leading-relaxed">
        A Prefeitura Municipal de Padre Marcos informa que não houve registro de servidores na condição de <strong>Estagiários</strong> no exercício atual (2026), bem como nos exercícios de 2025, 2024 e 2023.
      </p>
      <p className="text-xs text-gray-500 font-medium">Informação atualizada em: {dataAtualizada}</p>
    </div>
  );

  return (
    <div className="mt-6 space-y-6">
      <DataTable
        title="Relação de Estagiários"
        columns={[
          { header: 'Nome do Estudante', accessor: 'nome' },
          { header: 'Curso', accessor: 'curso' },
          { header: 'Instituição de Ensino', accessor: 'instituicao' },
          {
            header: 'Início do Estágio',
            accessor: 'data_inicio',
            render: (val: string) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
          },
          {
            header: 'Término do Estágio',
            accessor: 'data_fim',
            render: (val: string) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
          },
        ]}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage={emptyMsg}
        emptyFilteredMessage={emptyMsg}
      />
    </div>
  );
}

// ============================================================================
// Tab: Terceirizados (Aba 5)
// ============================================================================
function TerceirizadosTab({
  filters,
  filterKey,
  hasActiveFilters,
}: {
  filters: FilterValues;
  filterKey: string;
  hasActiveFilters: boolean;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      let query = supabase
        .schema('transparencia')
        .from('terceirizados')
        .select('*');

      if (filters.ano) {
        query = query.eq('ano', parseInt(filters.ano));
      }
      if (filters.busca) {
        query = query.ilike('nome', `%${filters.busca}%`);
      }

      const { data: result, error } = await query.order('nome', { ascending: true });
      if (!error && result) setData(result);
      else setData([]);
      setLoading(false);
    }

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [filters.ano, filters.busca, supabase]);

  const dataAtualizada = new Date().toLocaleDateString('pt-BR');
  const emptyMsg = (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-gray-700 text-sm max-w-2xl text-center leading-relaxed">
        A Prefeitura Municipal de Padre Marcos informa que não houve registro de servidores na condição de <strong>Terceirizados</strong> no exercício atual (2026), bem como nos exercícios de 2025, 2024 e 2023.
      </p>
      <p className="text-xs text-gray-500 font-medium">Informação atualizada em: {dataAtualizada}</p>
    </div>
  );

  return (
    <div className="mt-6 space-y-6">
      <DataTable
        title="Relação de Terceirizados"
        columns={[
          { header: 'Nome Completo', accessor: 'nome' },
          { header: 'Função / Atividade', accessor: 'funcao' },
          {
            header: 'Empresa Empregadora',
            accessor: 'empresa',
            render: (val: string) => <span className="text-sm text-gray-700">{val || '-'}</span>,
          },
          {
            header: 'CNPJ da Empresa',
            accessor: 'cnpj_empresa',
            render: (val: string) => <span className="text-sm font-mono text-gray-600">{val || '-'}</span>,
          },
          {
            header: 'Início',
            accessor: 'data_inicio',
            render: (val: string) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
          },
          {
            header: 'Término',
            accessor: 'data_fim',
            render: (val: string) => <span className="text-sm text-gray-600">{formatDate(val)}</span>,
          },
        ]}
        data={data}
        exportable={true}
        loading={loading}
        paginationResetKey={filterKey}
        hasActiveFilters={hasActiveFilters}
        emptyMessage={emptyMsg}
        emptyFilteredMessage={emptyMsg}
      />
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function RecursosHumanosPage() {
  const today = useTodayDate();
  const currentYear = new Date().getFullYear().toString();
  const [activeTab, setActiveTab] = useState<'servidores' | 'remuneracao' | 'padrao' | 'estagiarios' | 'terceirizados'>('servidores');
  const [filters, setFilters] = useState({
    ano: currentYear,
    mes: '',
    busca: '',
    status: '',
  });

  const tableForYearFilter =
    activeTab === 'remuneracao' ? 'remuneracoes' :
    activeTab === 'estagiarios' ? 'estagiarios' :
    activeTab === 'terceirizados' ? 'terceirizados' : 'remuneracoes';

  const { anos: ANOS, loading: anosLoading } = useAvailableYears(tableForYearFilter);

  const handleChange = useCallback((field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: currentYear, mes: '', busca: '', status: '' });
  }, [currentYear]);

  const filterKey = `${filters.ano}-${filters.mes}-${filters.busca}-${filters.status}`;
  const hasActiveFilters = !!(filters.ano || filters.mes || filters.busca || filters.status);

  return (
    <ContentPage
      title="Recursos Humanos e Remunerações"
      description="Consulte a relação nominal de servidores públicos, estagiários e terceirizados, detalhando cargos, lotação, carga horária e remuneração."
      breadcrumb={[
        { label: 'Portal da Transparência', href: '/' },
        { label: 'Gestão de Pessoas' },
        { label: 'Recursos Humanos' },
      ]}
      lastUpdate={today}
    >
      {activeTab !== 'padrao' && (
        <FilterPanel
          anos={ANOS}
          meses={MESES}
          values={filters as any}
          onChange={handleChange}
          onClear={handleClear}
          anosLoading={anosLoading}
          hideAno={activeTab === 'servidores'}
          hideMes={activeTab !== 'remuneracao'}
          searchPlaceholder={
            activeTab === 'servidores'
              ? 'Pesquisar por nome, cargo ou matrícula...'
              : 'Pesquisar por nome...'
          }
        >
          {activeTab === 'servidores' && (
            <div className="flex flex-col gap-1 sm:w-44">
              <label className="text-xs font-medium text-gray-600">
                Situação
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all h-[42px]"
              >
                <option value="">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="desligado">Não Ativos</option>
              </select>
            </div>
          )}
        </FilterPanel>
      )}

      {/* ═══════ ABAS ═══════ */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist" aria-label="Seções de recursos humanos">
        <button
          onClick={() => setActiveTab('servidores')}
          role="tab"
          aria-selected={activeTab === 'servidores'}
          aria-controls="panel-servidores"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'servidores'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users size={16} aria-hidden="true" />
          Servidores
        </button>
        <button
          onClick={() => setActiveTab('remuneracao')}
          role="tab"
          aria-selected={activeTab === 'remuneracao'}
          aria-controls="panel-remuneracao"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'remuneracao'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <DollarSign size={16} aria-hidden="true" />
          Folha de Pagamento
        </button>
        <button
          onClick={() => setActiveTab('padrao')}
          role="tab"
          aria-selected={activeTab === 'padrao'}
          aria-controls="panel-padrao"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'padrao'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText size={16} aria-hidden="true" />
          Padrão Remuneratório
        </button>
        <button
          onClick={() => setActiveTab('estagiarios')}
          role="tab"
          aria-selected={activeTab === 'estagiarios'}
          aria-controls="panel-estagiarios"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'estagiarios'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <GraduationCap size={16} aria-hidden="true" />
          Estagiários
        </button>
        <button
          onClick={() => setActiveTab('terceirizados')}
          role="tab"
          aria-selected={activeTab === 'terceirizados'}
          aria-controls="panel-terceirizados"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'terceirizados'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Briefcase size={16} aria-hidden="true" />
          Terceirizados
        </button>
      </div>

      {/* Aba 1: Servidores */}
      {activeTab === 'servidores' && (
        <div id="panel-servidores" role="tabpanel" aria-labelledby="tab-servidores">
          <ServidoresTab
            filters={filters}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Aba 2: Folha de Pagamento */}
      {activeTab === 'remuneracao' && (
        <div id="panel-remuneracao" role="tabpanel" aria-labelledby="tab-remuneracao">
          <RemuneracaoTab
            filters={filters}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Aba 3: Padrão Remuneratório */}
      {activeTab === 'padrao' && (
        <div id="panel-padrao" role="tabpanel" aria-labelledby="tab-padrao">
          <PadraoRemuneratorioTab />
        </div>
      )}

      {/* Aba 4: Estagiários */}
      {activeTab === 'estagiarios' && (
        <div id="panel-estagiarios" role="tabpanel" aria-labelledby="tab-estagiarios">
          <EstagiariosTab
            filters={filters}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Aba 5: Terceirizados */}
      {activeTab === 'terceirizados' && (
        <div id="panel-terceirizados" role="tabpanel" aria-labelledby="tab-terceirizados">
          <TerceirizadosTab
            filters={filters}
            filterKey={filterKey}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Legal Note (global) */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">Nota Legal</p>
        <div className="text-sm text-blue-800/80 leading-relaxed space-y-2">
          <p>
            As informações sobre a relação nominal de servidores, estagiários e trabalhadores terceirizados são publicadas de forma transparente em cumprimento às diretrizes do Programa Nacional de Transparência Pública (PNTP 2026).
          </p>
          <p>
            A remuneração apresentada engloba o salário-base, subsídios, vantagens pessoais e demais acréscimos legais, deduzidos apenas os descontos obrigatórios (como Imposto de Renda e Previdência).
          </p>
          <p>
            A Prefeitura Municipal de Padre Marcos informa, ainda, que a tabela de Padrão Remuneratório dos cargos e funções disponibilizada nesta seção é a vigente para o exercício atual (2026).
          </p>
        </div>
      </div>
    </ContentPage>
  );
}
