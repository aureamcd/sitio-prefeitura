import { Metadata } from 'next';
import { Download, FileText, Info } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';

export const metadata: Metadata = {
  title: 'Cultura - Portal da Transparência',
  description: 'Ações, programas e editais culturais do município de Padre Marcos - PI.',
};

const EDITAIS_CULTURA = [
  { 
    titulo: 'Edital de Chamamento Público 001/2026', 
    ano: '2026', 
    tipo: 'Premiação Cultural', 
    beneficiario: 'Agentes Culturais (Em fase de seleção)',
    valor: 'R$ 30.400,00',
    lei: 'Lei 14.399/2022 (PNAB)',
    arquivo: '/documentos/cultura/editais/DM_5536_440_Padre_Marcos_Edital_Chamamento_Publico_001-26_pag_307.pdf' 
  },
  { 
    titulo: 'Edital de Chamamento Público 002/2026 (Pontos de Cultura)', 
    ano: '2026', 
    tipo: 'Aldir Blanc', 
    beneficiario: 'Pontos e Pontões de Cultura',
    valor: 'R$ 5.400,00',
    lei: 'Lei 14.399/2022 (PNAB)',
    arquivo: '/documentos/cultura/editais/DM_5558_469_Padre_Marcos_Edital_Chamamento_Publico_002-26_PNAB_pag_67.pdf' 
  },
  { 
    titulo: 'Edital de Mapeamento Cultural 001/2024', 
    ano: '2024', 
    tipo: 'Mapeamento', 
    beneficiario: 'Fazedores de Cultura do Município',
    valor: 'R$ 0,00 (Sem repasse direto)',
    lei: 'Políticas Municipais de Cultura',
    arquivo: '/documentos/cultura/editais/DM_5063_512_Padre_Marcos_Edital_de_Mapeamento_Cultural_001-24_pag_250.pdf' 
  },
  { 
    titulo: 'Edital de Chamamento Público 001/2023 (Demais Áreas Culturais)', 
    ano: '2023', 
    tipo: 'Premiação Cultural', 
    beneficiario: 'Agentes Culturais',
    valor: 'R$ 21.300,00',
    lei: 'Lei Complementar 195/2022',
    arquivo: '/documentos/cultura/editais/DM_4916_241_Padre_Marcos_Edital_Chamamento_Publico_001-23_SEMCULT_pag_188.pdf' 
  },
  { 
    titulo: 'Edital de Chamamento Público 002/2023 (Audiovisual)', 
    ano: '2023', 
    tipo: 'Premiação Cultural', 
    beneficiario: 'Agentes Culturais e Cineastas',
    valor: 'R$ 21.300,00',
    lei: 'Lei Complementar 195/2022',
    arquivo: '/documentos/cultura/editais/DM_4915_278_Padre_Marcos_Edital_Chamamento_Publico_002-23_SEMCULT_pag_73.pdf' 
  },
];

export default function CulturaPage() {
  return (
    <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-8 md:py-12 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#173572] tracking-tight">Cultura e Fomento</h1>
        <p className="mt-2 text-gray-600 max-w-3xl leading-relaxed">
          Nesta página você encontra os editais de chamamento público, premiações culturais e repasses de fomento à cultura (Critério 16 do PNTP), incluindo a execução da Lei Aldir Blanc, Lei Paulo Gustavo e editais próprios da Secretaria Municipal de Cultura.
        </p>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="mb-6 flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <Info size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Editais de Premiações Culturais</h3>
            <p className="text-sm text-blue-800/80 mt-1">
              Acesse abaixo a íntegra dos editais de Mapeamento, Premiação Cultural e fomento do município com seus respectivos valores e beneficiários.
            </p>
          </div>
        </div>

        <DataTable
          columns={[
            { 
              header: 'Título do Edital', 
              accessor: 'titulo', 
              render: (v: string) => (
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-gray-400" />
                  <span className="font-medium text-gray-900">{v}</span>
                </div>
              )
            },
            { header: 'Lei / Fundamento', accessor: 'lei', render: (v: string) => <span className="text-sm text-gray-600">{v}</span> },
            { header: 'Beneficiário', accessor: 'beneficiario', render: (v: string) => <span className="text-sm">{v}</span> },
            { header: 'Valor (R$)', accessor: 'valor', render: (v: string) => <span className="text-sm font-semibold">{v}</span> },
            { header: 'Ano', accessor: 'ano', render: (v: string) => <span className="font-mono text-sm">{v}</span> },
            { 
              header: 'Categoria', 
              accessor: 'tipo', 
              render: (v: string) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {v}
                </span>
              )
            },
            {
              header: 'Documento',
              accessor: 'arquivo',
              render: (v: string) => (
                <a 
                  href={v} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Download size={14} />
                  <span>Baixar PDF</span>
                </a>
              )
            }
          ]}
          data={EDITAIS_CULTURA}
          title="Lista de Editais Publicados"
          caption="Editais de chamamento público e premiações culturais dos últimos anos."
        />
      </div>
    </main>
  );
}
