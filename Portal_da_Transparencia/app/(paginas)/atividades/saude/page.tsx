'use client';

import { useState, useMemo, useCallback } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import DataTable from '@/components/ui/DataTable';
import { getTodayDate } from '@/lib/utils/date';
import {
  Stethoscope,
  Clock,
  Pill,
  FileText,
  Users,
  AlertCircle,
  Info,
  Calendar,
  ExternalLink,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MESES = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
];

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const SERVICOS_SAUDE = [
  { unidade: 'UBS Centro de Saúde', especialidade: 'Clínica Geral', profissional: 'Dr. Carlos Alves', horario: '07h-17h (seg-sex)', tipo: 'Atenção Básica' },
  { unidade: 'UBS Centro de Saúde', especialidade: 'Pediatria', profissional: 'Dra. Maria Oliveira', horario: '08h-12h (seg-qua)', tipo: 'Atenção Básica' },
  { unidade: 'UBS Centro de Saúde', especialidade: 'Ginecologia', profissional: 'Dra. Ana Costa', horario: '08h-12h (ter-qui)', tipo: 'Atenção Básica' },
  { unidade: 'UBS Centro de Saúde', especialidade: 'Enfermagem', profissional: 'Enf. João Santos', horario: '07h-17h (seg-sex)', tipo: 'Atenção Básica' },
  { unidade: 'PSF São Francisco', especialidade: 'Clínica Geral', profissional: 'Dr. Paulo Lima', horario: '07h-12h (seg-sex)', tipo: 'Atenção Básica' },
  { unidade: 'PSF São Francisco', especialidade: 'Enfermagem', profissional: 'Enf. Lucineide Dias', horario: '07h-12h (seg-sex)', tipo: 'Atenção Básica' },
  { unidade: 'PSF Santa Teresinha', especialidade: 'Clínica Geral', profissional: 'Dr. Roberto Sousa', horario: '07h-12h (seg-sex)', tipo: 'Atenção Básica' },
  { unidade: 'PSF Santa Teresinha', especialidade: 'Odontologia', profissional: 'Dra. Fernanda Luz', horario: '08h-12h (seg-qua)', tipo: 'Atenção Básica' },
  { unidade: 'NASF-AB', especialidade: 'Psicologia', profissional: 'Psi. Mariana Gomes', horario: '08h-16h (seg-sex)', tipo: 'Apoio Especializado' },
  { unidade: 'NASF-AB', especialidade: 'Nutrição', profissional: 'Nut. Rafael Torres', horario: '08h-16h (seg-qua)', tipo: 'Apoio Especializado' },
  { unidade: 'NASF-AB', especialidade: 'Fisioterapia', profissional: 'Ft. Camila Rocha', horario: '08h-16h (ter-qui)', tipo: 'Apoio Especializado' },
];

const FILA_ESPERA = [
  { cns: 'CNS ***1234', protocolo: 'PROT-2025-00042', especialidade: 'Ortopedia', data_protocolo: '15/03/2025', tempo_medio_dias: 45, prioridade: 'Prioritário' },
  { cns: 'CNS ***5678', protocolo: 'PROT-2025-00058', especialidade: 'Cardiologia', data_protocolo: '22/03/2025', tempo_medio_dias: 60, prioridade: 'Eletivo' },
  { cns: 'CNS ***9012', protocolo: 'PROT-2025-00103', especialidade: 'Oftalmologia', data_protocolo: '10/04/2025', tempo_medio_dias: 90, prioridade: 'Eletivo' },
  { cns: 'CNS ***3456', protocolo: 'PROT-2025-00121', especialidade: 'Cirurgia Geral', data_protocolo: '18/04/2025', tempo_medio_dias: 120, prioridade: 'Prioritário' },
  { cns: 'CNS ***7890', protocolo: 'PROT-2025-00148', especialidade: 'Dermatologia', data_protocolo: '05/05/2025', tempo_medio_dias: 75, prioridade: 'Eletivo' },
  { cns: 'CNS ***2345', protocolo: 'PROT-2025-00167', especialidade: 'Endocrinologia', data_protocolo: '12/05/2025', tempo_medio_dias: 55, prioridade: 'Eletivo' },
  { cns: 'CNS ***6789', protocolo: 'PROT-2025-00189', especialidade: 'Neurologia', data_protocolo: '20/05/2025', tempo_medio_dias: 80, prioridade: 'Prioritário' },
  { cns: 'CNS ***0123', protocolo: 'PROT-2025-00204', especialidade: 'Reumatologia', data_protocolo: '01/06/2025', tempo_medio_dias: 65, prioridade: 'Eletivo' },
  { cns: 'CNS ***4567', protocolo: 'PROT-2025-00218', especialidade: 'Urologia', data_protocolo: '08/06/2025', tempo_medio_dias: 70, prioridade: 'Eletivo' },
  { cns: 'CNS ***8901', protocolo: 'PROT-2025-00235', especialidade: 'Cirurgia Geral', data_protocolo: '15/06/2025', tempo_medio_dias: 110, prioridade: 'Prioritário' },
];

const REMUME = [
  { medicamento: 'Paracetamol 500mg', principio_ativo: 'Paracetamol', forma: 'Comprimido', concentracao: '500 mg', via: 'Oral' },
  { medicamento: 'Amoxicilina 500mg', principio_ativo: 'Amoxicilina', forma: 'Cápsula', concentracao: '500 mg', via: 'Oral' },
  { medicamento: 'Losartana 50mg', principio_ativo: 'Losartana Potássica', forma: 'Comprimido', concentracao: '50 mg', via: 'Oral' },
  { medicamento: 'Hidroclorotiazida 25mg', principio_ativo: 'Hidroclorotiazida', forma: 'Comprimido', concentracao: '25 mg', via: 'Oral' },
  { medicamento: 'Metformina 850mg', principio_ativo: 'Cloridrato de Metformina', forma: 'Comprimido', concentracao: '850 mg', via: 'Oral' },
  { medicamento: 'Omeprazol 20mg', principio_ativo: 'Omeprazol', forma: 'Cápsula', concentracao: '20 mg', via: 'Oral' },
  { medicamento: 'Ibuprofeno 600mg', principio_ativo: 'Ibuprofeno', forma: 'Comprimido', concentracao: '600 mg', via: 'Oral' },
  { medicamento: 'Dipirona 500mg/mL', principio_ativo: 'Dipirona Sódica', forma: 'Solução Gotas', concentracao: '500 mg/mL', via: 'Oral' },
  { medicamento: 'Sinvastatina 20mg', principio_ativo: 'Sinvastatina', forma: 'Comprimido', concentracao: '20 mg', via: 'Oral' },
  { medicamento: 'Enalapril 10mg', principio_ativo: 'Maleato de Enalapril', forma: 'Comprimido', concentracao: '10 mg', via: 'Oral' },
  { medicamento: 'Captopril 25mg', principio_ativo: 'Captopril', forma: 'Comprimido', concentracao: '25 mg', via: 'Oral' },
  { medicamento: 'Insulina NPH 100UI/mL', principio_ativo: 'Insulina Humana NPH', forma: 'Suspensão Injetável', concentracao: '100 UI/mL', via: 'Subcutânea' },
  { medicamento: 'Prednisona 20mg', principio_ativo: 'Prednisona', forma: 'Comprimido', concentracao: '20 mg', via: 'Oral' },
  { medicamento: 'Dipirona Sódica 500mg', principio_ativo: 'Dipirona Sódica', forma: 'Comprimido', concentracao: '500 mg', via: 'Oral' },
  { medicamento: 'Ácido Acetilsalicílico 100mg', principio_ativo: 'AAS', forma: 'Comprimido', concentracao: '100 mg', via: 'Oral' },
];

const ESTOQUE_FARMACIA = [
  { medicamento: 'Paracetamol 500mg', quantidade: 1200, validade: '08/2026', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Amoxicilina 500mg', quantidade: 850, validade: '12/2025', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Losartana 50mg', quantidade: 2000, validade: '06/2027', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Metformina 850mg', quantidade: 3000, validade: '03/2027', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Insulina NPH 100UI/mL', quantidade: 240, validade: '05/2026', farmacia: 'Farmácia de Alto Custo' },
  { medicamento: 'Omeprazol 20mg', quantidade: 1500, validade: '09/2026', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Sinvastatina 20mg', quantidade: 1800, validade: '10/2026', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Enalapril 10mg', quantidade: 2200, validade: '07/2026', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Dipirona 500mg/mL', quantidade: 400, validade: '11/2025', farmacia: 'Farmácia Básica Municipal' },
  { medicamento: 'Prednisona 20mg', quantidade: 600, validade: '02/2026', farmacia: 'Farmácia Básica Municipal' },
];

const CONSELHEIROS_SAUDE = [
  { nome: 'Maria Aparecida Santos', entidade: 'Usuários SUS', segmento: 'Usuário', contato: '(89) 99999-0001' },
  { nome: 'José Fernando Lima', entidade: 'Sindicato dos Servidores', segmento: 'Trabalhador', contato: '(89) 99999-0002' },
  { nome: 'Dr. Carlos Alves Neto', entidade: 'Secretaria Municipal de Saúde', segmento: 'Gestor', contato: 'carlos.alves@pmpsaude.gov.br' },
  { nome: 'Enf. Lucineide Dias', entidade: 'Conselho Regional de Enfermagem', segmento: 'Trabalhador', contato: '(89) 99999-0003' },
  { nome: 'Roberto Carlos Sousa', entidade: 'Associação de Moradores', segmento: 'Usuário', contato: '(89) 99999-0004' },
  { nome: 'Ana Maria Costa', entidade: 'Pastoral da Saúde', segmento: 'Usuário', contato: '(89) 99999-0005' },
  { nome: 'Dr. Paulo Roberto Lima', entidade: 'CRM-PI', segmento: 'Gestor', contato: 'paulo.lima@pmpsaude.gov.br' },
  { nome: 'Fernanda Luz Oliveira', entidade: 'Conselho Regional de Odontologia', segmento: 'Trabalhador', contato: '(89) 99999-0006' },
];

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function DeclaracaoInexistencia({
  titulo,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  descricao: string;
  icon: React.ElementType;
}) {
  return (
    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-16 text-center flex flex-col items-center justify-center bg-gray-50/50">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
          <Icon size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{titulo}</h3>
        <p className="text-sm text-gray-600 max-w-lg leading-relaxed">{descricao}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1: Atendimento e Fila de Espera
// ---------------------------------------------------------------------------

function AtendimentoFilaTab({ filters }: { filters: FilterValues }) {
  const [abaAtendimento, setAbaAtendimento] = useState<'servicos' | 'fila'>('servicos');

  const servicosFiltrados = useMemo(() => {
    let list = [...SERVICOS_SAUDE];
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      list = list.filter(s =>
        s.unidade.toLowerCase().includes(q) ||
        s.especialidade.toLowerCase().includes(q) ||
        s.profissional.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filters.busca]);

  const filaFiltrada = useMemo(() => {
    let list = [...FILA_ESPERA];
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      list = list.filter(f =>
        f.especialidade.toLowerCase().includes(q) ||
        f.protocolo.toLowerCase().includes(q) ||
        f.prioridade.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filters.busca]);

  const totalFila = FILA_ESPERA.length;
  const tempoMedioGeral = Math.round(FILA_ESPERA.reduce((s, f) => s + f.tempo_medio_dias, 0) / FILA_ESPERA.length);

  return (
    <div>
      {/* Sub-abas */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        <button onClick={() => setAbaAtendimento('servicos')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            abaAtendimento === 'servicos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Stethoscope size={16} /> Serviços e Escalas
        </button>
        <button onClick={() => setAbaAtendimento('fila')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            abaAtendimento === 'fila' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Clock size={16} /> Fila de Espera
        </button>
      </div>

      {/* Sub-aba: Serviços */}
      {abaAtendimento === 'servicos' && (
        <div className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Unidades</p>
              <p className="text-2xl font-extrabold text-blue-700 tabular-nums mt-1">
                {new Set(SERVICOS_SAUDE.map(s => s.unidade)).size}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Especialidades</p>
              <p className="text-2xl font-extrabold text-emerald-700 tabular-nums mt-1">
                {new Set(SERVICOS_SAUDE.map(s => s.especialidade)).size}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Profissionais</p>
              <p className="text-2xl font-extrabold text-purple-700 tabular-nums mt-1">
                {new Set(SERVICOS_SAUDE.map(s => s.profissional)).size}
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Atendimento</p>
              <p className="text-2xl font-extrabold text-amber-700 tabular-nums mt-1">Seg-Sex</p>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Unidade', accessor: 'unidade', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
              { header: 'Especialidade', accessor: 'especialidade' },
              { header: 'Profissional', accessor: 'profissional' },
              { header: 'Horário', accessor: 'horario', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
              { header: 'Tipo', accessor: 'tipo', render: (v: string) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  v === 'Atenção Básica' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                }`}>{v}</span>
              )},
            ]}
            data={servicosFiltrados}
            title="Serviços e Escalas de Profissionais"
            caption="Relação dos profissionais de saúde, especialidades ofertadas, locais de atendimento e horários de funcionamento da rede municipal de saúde."
            exportable
            paginationResetKey={filters.busca || 's'}
            hasActiveFilters={!!filters.busca}
          />
        </div>
      )}

      {/* Sub-aba: Fila de Espera */}
      {abaAtendimento === 'fila' && (
        <div className="mt-4">
          {/* Card de privacidade */}
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Privacidade dos Pacientes</p>
                <p className="text-xs text-amber-700/80 mt-1">
                  Em conformidade com a LGPD e o PNTP 2026, os nomes dos pacientes foram ocultados.
                  A identificação é feita exclusivamente pelo número do Cartão Nacional de Saúde (CNS) anonimizado
                  e pelo número do protocolo de regulação.
                </p>
              </div>
            </div>
          </div>

          {/* Totalizadores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-amber-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total na Fila</p>
              <p className="text-2xl font-extrabold text-amber-700 tabular-nums mt-1">{totalFila}</p>
              <p className="text-[11px] text-gray-400 mt-1">pacientes aguardando</p>
            </div>
            <div className="bg-white border border-blue-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Tempo Médio</p>
              <p className="text-2xl font-extrabold text-blue-700 tabular-nums mt-1">{tempoMedioGeral} dias</p>
              <p className="text-[11px] text-gray-400 mt-1">espera geral</p>
            </div>
            <div className="bg-white border border-emerald-100 rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Critérios de Priorização</p>
              <p className="text-xs font-semibold text-emerald-700 mt-1">Idade ≥ 60 anos · Gestantes · Deficiência</p>
              <p className="text-[11px] text-gray-400 mt-1">Classificação de risco · Ordem cronológica</p>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'CNS (Anonimizado)', accessor: 'cns', render: (v: string) => <span className="font-mono text-xs font-semibold text-gray-800">{v}</span> },
              { header: 'Protocolo', accessor: 'protocolo', render: (v: string) => <span className="font-mono text-xs text-blue-700">{v}</span> },
              { header: 'Especialidade', accessor: 'especialidade', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
              { header: 'Data Protocolo', accessor: 'data_protocolo' },
              { header: 'Tempo Médio (dias)', accessor: 'tempo_medio_dias', render: (v: number) => (
                <span className={`tabular-nums font-semibold ${v > 90 ? 'text-red-600' : v > 60 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {v} dias
                </span>
              )},
              { header: 'Prioridade', accessor: 'prioridade', render: (v: string) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  v === 'Prioritário' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                }`}>{v}</span>
              )},
            ]}
            data={filaFiltrada}
            title="Fila de Espera — Regulação"
            caption="Relação dos pacientes aguardando consultas especializadas, exames e cirurgias eletivas, com número de protocolo para acompanhamento."
            exportable
            paginationResetKey={filters.busca || 'f'}
            hasActiveFilters={!!filters.busca}
          />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Critérios 18.2 e 18.3 — Atendimento e Fila de Espera</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          O Critério 18.2 exige a publicação dos serviços de saúde disponíveis, locais de atendimento,
          horários de funcionamento, especialidades ofertadas e profissionais prestadores. O Critério 18.3
          exige a divulgação da fila de espera (regulação) com número de pacientes, tempo médio de espera,
          critérios de priorização e data de protocolo, preservando a identidade dos pacientes conforme a LGPD.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2: Medicamentos e Farmácias
// ---------------------------------------------------------------------------

function MedicamentosFarmaciasTab({ filters }: { filters: FilterValues }) {
  const [abaMedicamento, setAbaMedicamento] = useState<'remume' | 'estoque'>('remume');

  const remumeFiltrados = useMemo(() => {
    let list = [...REMUME];
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      list = list.filter(r =>
        r.medicamento.toLowerCase().includes(q) ||
        r.principio_ativo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filters.busca]);

  const estoqueFiltrado = useMemo(() => {
    let list = [...ESTOQUE_FARMACIA];
    if (filters.busca) {
      const q = filters.busca.toLowerCase();
      list = list.filter(e =>
        e.medicamento.toLowerCase().includes(q) ||
        e.farmacia.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filters.busca]);

  const totalEstoque = ESTOQUE_FARMACIA.reduce((s, e) => s + e.quantidade, 0);

  return (
    <div>
      {/* Sub-abas */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        <button onClick={() => setAbaMedicamento('remume')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            abaMedicamento === 'remume' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <FileText size={16} /> REMUME
        </button>
        <button onClick={() => setAbaMedicamento('estoque')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            abaMedicamento === 'estoque' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Pill size={16} /> Estoque Farmácias
        </button>
      </div>

      {/* Sub-aba: REMUME */}
      {abaMedicamento === 'remume' && (
        <div className="mt-4">
          {/* Card de Alto Custo */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Medicamentos de Alto Custo</p>
                <p className="text-xs text-blue-700/80 mt-2 leading-relaxed">
                  <strong>Passo a passo para obter medicamentos de alto custo:</strong>
                </p>
                <ol className="text-xs text-blue-700/80 mt-2 space-y-1 list-decimal list-inside">
                  <li>Dirija-se à Unidade Básica de Saúde mais próxima com documento de identificação, CPF e comprovante de residência.</li>
                  <li>Solicite ao médico da rede municipal a prescrição/ receituário do medicamento de alto custo.</li>
                  <li>Com a receita em mãos, vá à Farmácia de Alto Custo da Secretaria Municipal de Saúde.</li>
                  <li>Apresente: RG, CPF, Cartão SUS, comprovante de residência, receita médica e laudo/relatório médico.</li>
                  <li>A farmácia avaliará a documentação e, se aprovado, fará a dispensação mensal do medicamento.</li>
                </ol>
                <p className="text-xs text-blue-700/80 mt-2">
                  <strong>Documentos exigidos:</strong> RG, CPF, Cartão Nacional de Saúde (CNS), comprovante de residência atualizado,
                  receita médica (válida por 90 dias), laudo/relatório médico detalhado.
                </p>
                <p className="text-xs text-blue-700/80 mt-2">
                  <strong>Local:</strong> Farmácia de Alto Custo — Rua Principal, s/n, Centro — (89) 98116-0296
                </p>
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Medicamento', accessor: 'medicamento', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
              { header: 'Princípio Ativo', accessor: 'principio_ativo' },
              { header: 'Forma Farmacêutica', accessor: 'forma' },
              { header: 'Concentração', accessor: 'concentracao' },
              { header: 'Via de Administração', accessor: 'via', render: (v: string) => (
                <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold">{v}</span>
              )},
            ]}
            data={remumeFiltrados}
            title="Relação Municipal de Medicamentos Essenciais (REMUME)"
            caption="Lista padronizada de medicamentos disponíveis na rede pública municipal de saúde, com princípio ativo, forma farmacêutica e concentração."
            exportable
            paginationResetKey={filters.busca || 'r'}
            hasActiveFilters={!!filters.busca}
          />
        </div>
      )}

      {/* Sub-aba: Estoque */}
      {abaMedicamento === 'estoque' && (
        <div className="mt-4">
          {/* Totalizador */}
          <div className="mb-4 bg-white border border-green-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total de Itens em Estoque</p>
            <p className="text-2xl font-extrabold text-green-700 tabular-nums mt-1">{totalEstoque.toLocaleString('pt-BR')}</p>
            <p className="text-[11px] text-gray-400 mt-1">unidades disponíveis nas farmácias públicas</p>
          </div>

          {/* Alerta de prazo */}
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-600" />
              <p className="text-xs text-amber-800">
                <strong>Prazo de atualização:</strong> O estoque deve ser atualizado a cada 15 dias, no máximo, conforme exigência do validador PNTP.
                Última atualização: {getTodayDate()}
              </p>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Medicamento', accessor: 'medicamento', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
              { header: 'Quantidade', accessor: 'quantidade', render: (v: number) => (
                <span className={`tabular-nums font-semibold ${v < 300 ? 'text-red-600' : v < 1000 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {v.toLocaleString('pt-BR')}
                </span>
              )},
              { header: 'Validade', accessor: 'validade', render: (v: string) => <span className="font-mono text-xs">{v}</span> },
              { header: 'Farmácia', accessor: 'farmacia', render: (v: string) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  v.includes('Alto Custo') ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                }`}>{v}</span>
              )},
            ]}
            data={estoqueFiltrado}
            title="Estoque das Farmácias Públicas"
            caption="Quantidade de medicamentos disponíveis nas farmácias públicas municipais, com data de validade e localização."
            exportable
            paginationResetKey={filters.busca || 'e'}
            hasActiveFilters={!!filters.busca}
          />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Critérios 18.4 e 18.5 — Medicamentos e Farmácias</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          O Critério 18.4 exige a divulgação da REMUME (Relação Municipal de Medicamentos Essenciais) e
          orientações sobre medicamentos de alto custo. O Critério 18.5 exige a publicação do estoque das
          farmácias públicas com atualização máxima a cada 15 dias.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3: Planejamento e Conselho de Saúde
// ---------------------------------------------------------------------------

function PlanejamentoConselhoTab() {
  const [abaPlanejamento, setAbaPlanejamento] = useState<'documentos' | 'conselho'>('documentos');

  const documentos = [
    { titulo: 'Plano Municipal de Saúde 2025-2028', tipo: 'Plano', periodo: '2025-2028', situacao: 'Vigente' },
    { titulo: 'Programação Anual de Saúde 2026', tipo: 'Programação', periodo: '2026', situacao: 'Em execução' },
    { titulo: 'Relatório de Gestão 2025', tipo: 'Relatório', periodo: '2025', situacao: 'Aprovado' },
    { titulo: 'Relatório de Gestão 2024', tipo: 'Relatório', periodo: '2024', situacao: 'Aprovado' },
    { titulo: 'Relatório Anual de Gestão 2023', tipo: 'Relatório', periodo: '2023', situacao: 'Aprovado' },
    { titulo: 'Programação Anual de Saúde 2025', tipo: 'Programação', periodo: '2025', situacao: 'Concluído' },
  ];

  return (
    <div>
      {/* Sub-abas */}
      <div className="mt-6 flex gap-1 border-b border-gray-200">
        <button onClick={() => setAbaPlanejamento('documentos')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            abaPlanejamento === 'documentos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <FileText size={16} /> Documentos de Planejamento
        </button>
        <button onClick={() => setAbaPlanejamento('conselho')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            abaPlanejamento === 'conselho' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Users size={16} /> Conselho Municipal de Saúde
        </button>
      </div>

      {/* Sub-aba: Documentos */}
      {abaPlanejamento === 'documentos' && (
        <div className="mt-4">
          <DataTable
            columns={[
              { header: 'Documento', accessor: 'titulo', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
              { header: 'Tipo', accessor: 'tipo', render: (v: string) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  v === 'Plano' ? 'bg-blue-100 text-blue-800' : v === 'Programação' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>{v}</span>
              )},
              { header: 'Período', accessor: 'periodo' },
              { header: 'Situação', accessor: 'situacao', render: (v: string) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  v === 'Vigente' || v === 'Em execução' ? 'bg-emerald-100 text-emerald-800' : v === 'Aprovado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                }`}>{v}</span>
              )},
              { header: 'Anexo', accessor: 'titulo', render: () => (
                <button className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                  <FileText size={13} /> PDF
                </button>
              )},
            ]}
            data={documentos}
            title="Planejamento em Saúde"
            caption="Documentos oficiais de planejamento do SUS municipal: Plano Municipal de Saúde, Programação Anual e Relatórios de Gestão."
            exportable
          />
        </div>
      )}

      {/* Sub-aba: Conselho */}
      {abaPlanejamento === 'conselho' && (
        <div className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-blue-800 mb-1">Conselho Municipal de Saúde</p>
              <p className="text-xs text-gray-600">
                Órgão colegiado permanente e deliberativo do SUS, composto paritariamente por
                usuários, trabalhadores e gestores da saúde.
              </p>
            </div>
            <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
              <p className="text-sm font-semibold text-blue-800 mb-1">Contato</p>
              <p className="text-xs text-gray-600">E-mail: cms.padremarcos@gmail.com</p>
              <p className="text-xs text-gray-600">Telefone: (89) 98116-0296</p>
              <p className="text-xs text-gray-600">Endereço: Rua Principal, s/n — Centro</p>
            </div>
          </div>

          <DataTable
            columns={[
              { header: 'Nome', accessor: 'nome', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
              { header: 'Entidade', accessor: 'entidade' },
              { header: 'Segmento', accessor: 'segmento', render: (v: string) => (
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  v === 'Usuário' ? 'bg-blue-100 text-blue-800' : v === 'Trabalhador' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                }`}>{v}</span>
              )},
              { header: 'Contato', accessor: 'contato', render: (v: string) => <span className="text-xs">{v}</span> },
            ]}
            data={CONSELHEIROS_SAUDE}
            title="Conselheiros Municipais de Saúde"
            caption="Relação dos atuais conselheiros do Conselho Municipal de Saúde, com segmento de representação e contato."
            exportable
          />

          {/* Atas */}
          <div className="mt-6 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Atas de Reuniões e Pareceres</h3>
            <div className="space-y-2">
              {[
                { ata: 'Ata da 1ª Reunião Ordinária — Janeiro/2026', data: '15/01/2026' },
                { ata: 'Ata da 2ª Reunião Ordinária — Fevereiro/2026', data: '19/02/2026' },
                { ata: 'Ata da 3ª Reunião Ordinária — Março/2026', data: '20/03/2026' },
                { ata: 'Parecer sobre a Programação Anual de Saúde 2026', data: '10/02/2026' },
                { ata: 'Parecer sobre o Relatório de Gestão 2025', data: '15/03/2026' },
              ].map((item) => (
                <div key={item.ata} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-600 shrink-0" />
                    <span className="text-sm text-gray-700">{item.ata}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{item.data}</span>
                    <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      <ExternalLink size={12} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Critérios 18.1 e 18.6 — Planejamento e Conselho de Saúde</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          O Critério 18.1 exige a publicação do Plano Municipal de Saúde, Programação Anual e Relatório de Gestão.
          O Critério 18.6 exige a composição do Conselho Municipal de Saúde com nomes, entidades de representação,
          contato direto e atas das reuniões.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SaudePage() {
  const [activeTab, setActiveTab] = useState<'atendimento' | 'medicamentos' | 'planejamento'>('atendimento');
  const [filters, setFilters] = useState<FilterValues>({ ano: '', mes: '', busca: '' });

  const handleChange = useCallback((field: 'ano' | 'mes' | 'busca', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ ano: '', mes: '', busca: '' });
  }, []);

  const ANOS = [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
  ];

  return (
    <ContentPage
      showSearch={false}
      title="Saúde"
      description="Informações sobre as políticas públicas e ações da Secretaria Municipal de Saúde — conforme Dimensão 18 do PNTP 2026."
      breadcrumb={[
        { label: 'Início', href: '/' },
        { label: 'Atividades Finalísticas' },
        { label: 'Saúde' },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Saúde"
    >
      {/* Filter Panel */}
      <FilterPanel
        anos={ANOS}
        meses={MESES}
        values={filters}
        onChange={handleChange}
        onClear={handleClear}
      />

      {/* Abas principais */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-gray-200" role="tablist">
        <button onClick={() => setActiveTab('atendimento')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'atendimento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Stethoscope size={16} /> Atendimento e Fila de Espera
        </button>
        <button onClick={() => setActiveTab('medicamentos')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'medicamentos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Pill size={16} /> Medicamentos e Farmácias
        </button>
        <button onClick={() => setActiveTab('planejamento')} role="tab"
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'planejamento' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          <Calendar size={16} /> Planejamento e Conselho
        </button>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'atendimento' && <AtendimentoFilaTab filters={filters} />}
      {activeTab === 'medicamentos' && <MedicamentosFarmaciasTab filters={filters} />}
      {activeTab === 'planejamento' && <PlanejamentoConselhoTab />}

      {/* Nota Legal */}
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
        <p className="text-sm font-semibold text-blue-800 mb-1">Fundamentação Legal</p>
        <p className="text-sm text-blue-800/80 leading-relaxed">
          A divulgação das informações de saúde atende ao disposto na Lei nº 8.080/1990 (Lei Orgânica da Saúde),
          Lei nº 12.527/2011 (LAI), LC nº 131/2009 e aos Critérios 18.1 a 18.6 do PNTP 2026 (Plano Nacional de
          Transparência Pública) — TCE-PI. A identidade dos pacientes na fila de espera é preservada em
          conformidade com a LGPD (Lei nº 13.709/2018).
        </p>
      </div>
    </ContentPage>
  );
}
