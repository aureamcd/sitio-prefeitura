'use client';

import { useState } from 'react';
import ContentPage from '@/components/layout/ContentPage';
import FilterPanel, { FilterValues } from '@/components/ui/FilterPanel';
import { useTodayDate } from '@/lib/hooks/useTodayDate';
import {
  Users, FileText, Calendar, ClipboardList,
  Download, Phone, Mail, MapPin, Clock,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
type ConselhoKey = 'cms' | 'cmas' | 'cme';
type AbaKey = 'composicao' | 'atas' | 'resolucoes' | 'calendario';

interface Membro {
  nome: string;
  cargo: string;
  representacao: string;
  mandato: string;
}

interface Documento {
  data: string;
  titulo: string;
  descricao: string;
  arquivo?: string;
}

interface Reuniao {
  dia: string;
  horario: string;
  local: string;
  periodicidade: string;
}

interface ConselhoData {
  nome: string;
  sigla: string;
  leiCriacao: string;
  contatos: { email: string; telefone: string; endereco: string };
  membros: Membro[];
  atas: Documento[];
  resolucoes: Documento[];
  calendario: Reuniao[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dados estáticos (mock)
// ─────────────────────────────────────────────────────────────────────────────
const CONSELHOS: Record<ConselhoKey, ConselhoData> = {
  cms: {
    nome: 'Conselho Municipal de Saúde',
    sigla: 'CMS',
    leiCriacao: 'Lei Municipal nº 456/2017',
    contatos: {
      email: 'cms@padremarcos.pi.gov.br',
      telefone: '(89) 9XXXX-XXXX',
      endereco: 'Rua da Saúde, s/n - Centro, Padre Marcos - PI',
    },
    membros: [
      { nome: 'Maria da Silva Santos', cargo: 'Presidente', representacao: 'Gestão', mandato: '2025-2027' },
      { nome: 'João Batista Reis', cargo: 'Vice-Presidente', representacao: 'Usuários', mandato: '2025-2027' },
      { nome: 'Ana Paula Oliveira', cargo: 'Secretária Executiva', representacao: 'Gestão', mandato: '2025-2027' },
      { nome: 'Carlos Pereira Lima', cargo: 'Conselheiro Titular', representacao: 'Trabalhadores', mandato: '2025-2027' },
      { nome: 'Lucia Maria Barbosa', cargo: 'Conselheira Titular', representacao: 'Usuários', mandato: '2025-2027' },
      { nome: 'Pedro Henrique Alves', cargo: 'Conselheiro Suplente', representacao: 'Gestão', mandato: '2025-2027' },
    ],
    atas: [
      { data: '15/01/2026', titulo: '1ª Reunião Ordinária', descricao: 'Aprovação do calendário anual e prestação de contas do 4º trimestre/2025.', arquivo: 'ata-cms-2026-01.pdf' },
      { data: '19/02/2026', titulo: '2ª Reunião Ordinária', descricao: 'Discussão do Plano Municipal de Saúde 2026-2029.', arquivo: 'ata-cms-2026-02.pdf' },
      { data: '19/03/2026', titulo: '3ª Reunião Ordinária', descricao: 'Avaliação dos indicadores de saúde do 1º trimestre.', arquivo: 'ata-cms-2026-03.pdf' },
      { data: '10/04/2026', titulo: 'Reunião Extraordinária', descricao: 'Análise emergencial do estoque de medicamentos.', arquivo: 'ata-cms-2026-04-extra.pdf' },
    ],
    resolucoes: [
      { data: '20/01/2026', titulo: 'Resolução CMS nº 001/2026', descricao: 'Aprova o Calendário de Reuniões Ordinárias do exercício de 2026.', arquivo: 'resolucao-cms-001-2026.pdf' },
      { data: '20/02/2026', titulo: 'Resolução CMS nº 002/2026', descricao: 'Homologa o Plano Municipal de Saúde 2026-2029.', arquivo: 'resolucao-cms-002-2026.pdf' },
    ],
    calendario: [
      { dia: 'Toda 3ª terça-feira do mês', horario: '09:00 às 12:00', local: 'Sala do CMS - Secretaria de Saúde', periodicidade: 'Mensal' },
      { dia: 'Conforme convocação', horario: '09:00 às 12:00', local: 'Sala do CMS - Secretaria de Saúde', periodicidade: 'Extraordinária' },
    ],
  },
  cmas: {
    nome: 'Conselho Municipal de Assistência Social',
    sigla: 'CMAS',
    leiCriacao: 'Lei Municipal nº 378/2013',
    contatos: {
      email: 'cmas@padremarcos.pi.gov.br',
      telefone: '(89) 9XXXX-XXXX',
      endereco: 'Centro de Referência da Assistência Social - CRAS, Centro, Padre Marcos - PI',
    },
    membros: [
      { nome: 'Rosa Maria Costa', cargo: 'Presidente', representacao: 'Sociedade Civil', mandato: '2025-2027' },
      { nome: 'Francisco de Assis Neto', cargo: 'Vice-Presidente', representacao: 'Governo', mandato: '2025-2027' },
      { nome: 'Mariana Souza Lima', cargo: 'Secretária', representacao: 'Sociedade Civil', mandato: '2025-2027' },
      { nome: 'José Antônio Martins', cargo: 'Conselheiro Titular', representacao: 'Trabalhadores SUAS', mandato: '2025-2027' },
      { nome: 'Cláudia Regina Alves', cargo: 'Conselheira Titular', representacao: 'Usuários', mandato: '2025-2027' },
      { nome: 'Tiago Oliveira Sousa', cargo: 'Conselheiro Suplente', representacao: 'Governo', mandato: '2025-2027' },
    ],
    atas: [
      { data: '10/02/2026', titulo: '1ª Reunião Ordinária', descricao: 'Eleição da mesa diretora e definição do calendário 2026.', arquivo: 'ata-cmas-2026-01.pdf' },
      { data: '10/03/2026', titulo: '2ª Reunião Ordinária', descricao: 'Aprovação da prestação de contas do exercício anterior.', arquivo: 'ata-cmas-2026-02.pdf' },
      { data: '14/04/2026', titulo: '3ª Reunião Ordinária', descricao: 'Análise do Plano de Ação da Assistência Social 2026.', arquivo: 'ata-cmas-2026-03.pdf' },
    ],
    resolucoes: [
      { data: '12/02/2026', titulo: 'Resolução CMAS nº 001/2026', descricao: 'Dispõe sobre a composição da mesa diretora para o biênio 2025-2027.', arquivo: 'resolucao-cmas-001-2026.pdf' },
      { data: '12/03/2026', titulo: 'Resolução CMAS nº 002/2026', descricao: 'Aprova o Plano de Ação da Assistência Social para 2026.', arquivo: 'resolucao-cmas-002-2026.pdf' },
    ],
    calendario: [
      { dia: 'Toda 2ª terça-feira do mês', horario: '09:00 às 12:00', local: 'Sala do CMAS - CRAS', periodicidade: 'Mensal' },
    ],
  },
  cme: {
    nome: 'Conselho Municipal de Educação / FUNDEB',
    sigla: 'CME / FUNDEB',
    leiCriacao: 'Lei Municipal nº 412/2015',
    contatos: {
      email: 'cme@padremarcos.pi.gov.br',
      telefone: '(89) 9XXXX-XXXX',
      endereco: 'Secretaria Municipal de Educação, Centro, Padre Marcos - PI',
    },
    membros: [
      { nome: 'Domingos Sávio Filho', cargo: 'Presidente CME', representacao: 'Gestão', mandato: '2025-2027' },
      { nome: 'Helena Maria Rodrigues', cargo: 'Presidente FUNDEB', representacao: 'Sociedade Civil', mandato: '2025-2027' },
      { nome: 'Raimundo Nonato Pereira', cargo: 'Conselheiro Titular CME', representacao: 'Profissionais Educação', mandato: '2025-2027' },
      { nome: 'Maria Aparecida Gomes', cargo: 'Conselheira Titular FUNDEB', representacao: 'Pais de Alunos', mandato: '2025-2027' },
      { nome: 'Luciana Fernandes Dias', cargo: 'Conselheira Suplente CME', representacao: 'Gestão', mandato: '2025-2027' },
      { nome: 'Paulo Sérgio Araújo', cargo: 'Conselheiro Suplente FUNDEB', representacao: 'Trabalhadores Educação', mandato: '2025-2027' },
    ],
    atas: [
      { data: '05/02/2026', titulo: 'Reunião Conjunta CME/FUNDEB', descricao: 'Alinhamento do calendário escolar e aplicação dos recursos do FUNDEB.', arquivo: 'ata-cme-fundeb-2026-01.pdf' },
      { data: '05/03/2026', titulo: 'Reunião Ordinária CME', descricao: 'Discussão da proposta curricular da rede municipal.', arquivo: 'ata-cme-2026-02.pdf' },
      { data: '02/04/2026', titulo: 'Reunião Ordinária FUNDEB', descricao: 'Prestação de contas dos recursos do FUNDEB - 1º quadrimestre.', arquivo: 'ata-fundeb-2026-03.pdf' },
    ],
    resolucoes: [
      { data: '10/02/2026', titulo: 'Resolução CME nº 001/2026', descricao: 'Aprova o Calendário Escolar da Rede Municipal de Ensino para 2026.', arquivo: 'resolucao-cme-001-2026.pdf' },
      { data: '12/03/2026', titulo: 'Resolução CME nº 002/2026', descricao: 'Estabelece diretrizes operacionais para o ano letivo de 2026.', arquivo: 'resolucao-cme-002-2026.pdf' },
    ],
    calendario: [
      { dia: 'Toda 1ª quinta-feira do mês', horario: '09:00 às 11:00', local: 'Sala do CME - Secretaria de Educação', periodicidade: 'Mensal (CME)' },
      { dia: 'Conforme cronograma', horario: '09:00 às 12:00', local: 'Sala do FUNDEB - Secretaria de Educação', periodicidade: 'Quadrimestral (FUNDEB)' },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponentes
// ─────────────────────────────────────────────────────────────────────────────
function TabButton({
  active, label, icon: Icon, onClick,
}: { active: boolean; label: string; icon: typeof Users; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
        ${active
          ? 'bg-[#173572] text-white shadow-md'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-[#173572]/30 hover:text-[#173572] hover:bg-blue-50/50'
        }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function SubAbaButton({
  active, label, icon: Icon, onClick, count,
}: { active: boolean; label: string; icon: typeof FileText; onClick: () => void; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
        ${active
          ? 'bg-[#173572]/10 text-[#173572] font-semibold border border-[#173572]/20'
          : 'text-gray-500 hover:text-[#173572] hover:bg-gray-50 border border-transparent'
        }`}
    >
      <Icon size={14} />
      {label}
      <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{count}</span>
    </button>
  );
}

function MembroRow({ membro }: { membro: Membro }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
      <td className="py-2.5 px-3 text-sm font-medium text-gray-800">{membro.nome}</td>
      <td className="py-2.5 px-3 text-sm text-gray-600">{membro.cargo}</td>
      <td className="py-2.5 px-3 text-sm text-gray-600">{membro.representacao}</td>
      <td className="py-2.5 px-3 text-sm text-gray-500">{membro.mandato}</td>
    </tr>
  );
}

function DocumentoRow({ doc }: { doc: Documento }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 px-4 border-b border-gray-100 hover:bg-blue-50/20 transition-colors rounded-lg">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs text-gray-500 font-mono shrink-0">{doc.data}</span>
          <span className="text-sm font-semibold text-gray-800 truncate">{doc.titulo}</span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-2">{doc.descricao}</p>
      </div>
      {doc.arquivo && (
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); alert(`Download: ${doc.arquivo}`); }}
          className="shrink-0 flex items-center gap-1 text-xs text-[#173572] font-medium hover:underline py-1"
        >
          <Download size={12} />
          PDF
        </a>
      )}
    </div>
  );
}

function ReuniaoCard({ reuniao }: { reuniao: Reuniao }) {
  return (
    <div className="flex items-start gap-3 p-4 border border-gray-100 rounded-xl bg-white hover:border-[#173572]/20 hover:shadow-sm transition-all">
      <div className="p-2.5 rounded-lg bg-[#173572]/5 text-[#173572]">
        <Calendar size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{reuniao.dia}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
          <span className="flex items-center gap-1"><Clock size={12} /> {reuniao.horario}</span>
          <span className="flex items-center gap-1"><MapPin size={12} /> {reuniao.local}</span>
        </div>
        <span className="inline-block mt-1.5 text-[10px] font-medium text-[#173572] bg-[#173572]/5 px-2 py-0.5 rounded-full">
          {reuniao.periodicidade}
        </span>
      </div>
    </div>
  );
}

function ContatoCard({ contatos }: { contatos: ConselhoData['contatos'] }) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
      <div className="flex items-center gap-2">
        <Mail size={14} className="text-amber-700" />
        <a href={`mailto:${contatos.email}`} className="text-amber-900 hover:underline font-medium">{contatos.email}</a>
      </div>
      <div className="flex items-center gap-2">
        <Phone size={14} className="text-amber-700" />
        <span className="text-amber-900">{contatos.telefone}</span>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={14} className="text-amber-700" />
        <span className="text-amber-900">{contatos.endereco}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ConselhosMunicipaisPage() {
  const today = useTodayDate();

  const [conselhoAtivo, setConselhoAtivo] = useState<ConselhoKey>('cms');
  const [abaAtiva, setAbaAtiva] = useState<AbaKey>('composicao');

  const conselho = CONSELHOS[conselhoAtivo];

  const [filters, setFilters] = useState<FilterValues>({ ano: '2026', mes: '', busca: '' });

  const subAbas: { key: AbaKey; label: string; icon: typeof FileText; count: number }[] = [
    { key: 'composicao', label: 'Composição', icon: Users, count: conselho.membros.length },
    { key: 'atas', label: 'Atas', icon: FileText, count: conselho.atas.length },
    { key: 'resolucoes', label: 'Resoluções', icon: ClipboardList, count: conselho.resolucoes.length },
    { key: 'calendario', label: 'Calendário', icon: Calendar, count: conselho.calendario.length },
  ];

  return (
    <>
      <ContentPage
        title="Conselhos Municipais"
        description="Composição, atas, resoluções e calendário de reuniões dos Conselhos Municipais de Saúde (CMS), Assistência Social (CMAS) e Educação/FUNDEB, em atendimento ao critério 1.7 do PNTP 2026."
        breadcrumb={[
          { label: 'Portal da Transparência', href: '/' },
          { label: 'Conselhos Municipais' },
        ]}
        lastUpdate={today}
        responsible="Controle Interno / Gabinete do Prefeito"
      >
        <div>
          {/* ── FILTRO POR ANO ── */}
          <FilterPanel
            anos={['2026', '2025']}
            meses={[
              { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
              { value: '03', label: 'Março' },   { value: '04', label: 'Abril' },
              { value: '05', label: 'Maio' },    { value: '06', label: 'Junho' },
              { value: '07', label: 'Julho' },   { value: '08', label: 'Agosto' },
              { value: '09', label: 'Setembro' },{ value: '10', label: 'Outubro' },
              { value: '11', label: 'Novembro' },{ value: '12', label: 'Dezembro' },
            ]}
            values={filters}
            onChange={(_field, _value) => {}}
            onClear={() => setFilters({ ano: '2026', mes: '', busca: '' })}
          />

          {/* ── SELEÇÃO DE CONSELHO ── */}
          <div className="flex flex-wrap gap-2 mb-6">
            <TabButton
              active={conselhoAtivo === 'cms'}
              label="Conselho de Saúde (CMS)"
              icon={Users}
              onClick={() => { setConselhoAtivo('cms'); setAbaAtiva('composicao'); }}
            />
            <TabButton
              active={conselhoAtivo === 'cmas'}
              label="Conselho de Assistência Social (CMAS)"
              icon={Users}
              onClick={() => { setConselhoAtivo('cmas'); setAbaAtiva('composicao'); }}
            />
            <TabButton
              active={conselhoAtivo === 'cme'}
              label="CME / FUNDEB"
              icon={Users}
              onClick={() => { setConselhoAtivo('cme'); setAbaAtiva('composicao'); }}
            />
          </div>

          {/* ── CABEÇALHO DO CONSELHO ATIVO ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{conselho.nome}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Instituído pela {conselho.leiCriacao}
                  <span className="mx-2">•</span>
                  <a href={`mailto:${conselho.contatos.email}`} className="text-[#173572] hover:underline">
                    {conselho.contatos.email}
                  </a>
                </p>
              </div>
            </div>
            <ContatoCard contatos={conselho.contatos} />
          </div>

          {/* ── SUB-ABAS: Composição / Atas / Resoluções / Calendário ── */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {subAbas.map((s) => (
              <SubAbaButton
                key={s.key}
                active={abaAtiva === s.key}
                label={s.label}
                icon={s.icon}
                count={s.count}
                onClick={() => setAbaAtiva(s.key)}
              />
            ))}
          </div>

          {/* ── CONTEÚDO DA ABA ATIVA ── */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {abaAtiva === 'composicao' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Representação</th>
                      <th className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">Mandato</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conselho.membros.map((m, i) => (
                      <MembroRow key={i} membro={m} />
                    ))}
                  </tbody>
                </table>
                {conselho.membros.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhum membro cadastrado.</p>
                )}
              </div>
            )}

            {abaAtiva === 'atas' && (
              <div>
                {conselho.atas.length > 0 ? (
                  conselho.atas.map((d, i) => <DocumentoRow key={i} doc={d} />)
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhuma ata cadastrada.</p>
                )}
              </div>
            )}

            {abaAtiva === 'resolucoes' && (
              <div>
                {conselho.resolucoes.length > 0 ? (
                  conselho.resolucoes.map((d, i) => <DocumentoRow key={i} doc={d} />)
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhuma resolução cadastrada.</p>
                )}
              </div>
            )}

            {abaAtiva === 'calendario' && (
              <div className="p-4 grid gap-3 sm:grid-cols-2">
                {conselho.calendario.length > 0 ? (
                  conselho.calendario.map((r, i) => <ReuniaoCard key={i} reuniao={r} />)
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8 col-span-2">Nenhuma reunião cadastrada.</p>
                )}
              </div>
            )}
          </div>

          {/* ── LEGAL NOTE ── */}
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-6 py-4">
            <p className="text-sm font-semibold text-blue-800 mb-1">Critério 1.7 — Conselhos Municipais</p>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Esta página atende ao Critério 1.7 do PNTP 2026, que exige a divulgação da composição
              (membros titulares e suplentes), atas de reuniões, resoluções aprovadas e calendário
              de reuniões dos Conselhos Municipais. Os dados são atualizados periodicamente pelo
              Controle Interno do município. Em caso de divergência, solicite a retificação pelo e-SIC.
            </p>
          </div>
        </div>
      </ContentPage>
    </>
  );
}
