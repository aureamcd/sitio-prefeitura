'use client';

import ContentPage from '@/components/layout/ContentPage';
import DataTable from '@/components/ui/DataTable';
import { Mail, Phone, Users, FileText, ExternalLink } from 'lucide-react';
import { getTodayDate } from '@/lib/utils/date';

export default function ConselhoEducacaoPage() {
  return (
    <ContentPage
      title="Conselho do FUNDEB / Educação"
      description="Acompanhamento e controle social da aplicação dos recursos da Educação Básica — Critério 19.3 do PNTP."
      breadcrumb={[
        { label: 'Início', href: '/' },
        { label: 'Conselhos Municipais', href: '/#secao-7' },
        { label: 'Conselho do FUNDEB' },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Educação"
    >
      {/* 1. Canal de Contato */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone size={20} className="text-blue-700" /> Canais de Contato
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">E-mail Oficial</p>
              <a href="mailto:cacs.fundeb.pmpm@gmail.com" className="text-sm font-semibold text-blue-700 hover:underline">
                cacs.fundeb.pmpm@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Phone size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Telefone (Secretaria de Educação)</p>
              <p className="text-sm font-semibold text-gray-800">(89) 98116-0000</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Composição do Conselho */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-700" /> Composição do Conselho
        </h2>
        <DataTable
          columns={[
            { header: 'Nome', accessor: 'nome', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
            { header: 'Função/Cargo', accessor: 'cargo' },
          ]}
          data={[
            { nome: 'Edson Macedo Carvalho', cargo: 'Presidente' },
            { nome: 'Francisco Mizael de Carvalho', cargo: 'Vice-Presidente' },
            { nome: 'Aucilene Modesto Carvalho', cargo: '1º Secretário' },
            { nome: 'Alanny Carvalho Macedo', cargo: '2ª Secretária' },
          ]}
          title="Membros do CACS/FUNDEB"
          caption="Relação oficial dos membros titulares da diretoria do conselho."
        />
      </div>

      {/* 3. Documentos e Reuniões */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-blue-700" /> Documentos e Reuniões
        </h2>
        
        <div className="space-y-6">
          {/* Categoria 1: Atas */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-800">Atas das reuniões realizadas</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                    <th className="py-2.5 px-4 font-semibold text-xs">Documento</th>
                    <th className="py-2.5 px-4 font-semibold text-xs w-24 text-right">Arquivo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">Ata de Eleição e Renovação do Conselho do FUNDEB</td>
                    <td className="py-3 px-4 text-right">
                      <a href="/documentos/conselhos/educacao/ata-eleicao-renovacao-fundeb.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Baixar
                      </a>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">Ata de Posse dos Conselheiros do FUNDEB</td>
                    <td className="py-3 px-4 text-right">
                      <a href="/documentos/conselhos/educacao/ata-posse-fundeb.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Baixar
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Categoria 2: Relatórios e Pareceres */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-800">Relatórios e Pareceres emitidos</h3>
            </div>
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm font-medium">Nenhum relatório ou parecer publicado no período atual.</p>
            </div>
          </div>
        </div>
      </div>

    </ContentPage>
  );
}
