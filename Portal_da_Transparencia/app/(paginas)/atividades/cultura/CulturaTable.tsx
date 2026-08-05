"use client";

import { Download, FileText } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

interface CulturaTableProps {
  data: any[];
}

export default function CulturaTable({ data }: CulturaTableProps) {
  return (
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
      data={data}
      title="Lista de Editais Publicados"
      caption="Editais de chamamento público e premiações culturais dos últimos anos."
    />
  );
}
