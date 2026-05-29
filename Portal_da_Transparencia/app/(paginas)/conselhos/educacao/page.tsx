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
        { label: 'Conselhos Municipais' },
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
            { header: 'Nome do Conselheiro', accessor: 'nome', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
            { header: 'Entidade / Segmento Representado', accessor: 'entidade' },
          ]}
          data={[
            { nome: 'Exemplo: Prof. João Batista', entidade: 'Representante dos Professores' },
            { nome: 'Exemplo: Maria de Lourdes', entidade: 'Representante de Pais de Alunos' },
          ]}
          title="Membros do Conselho"
          caption="Lista nominal dos membros titulares e suplentes do CACS-FUNDEB e suas respectivas representações."
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
                    <td className="py-3 px-4 font-medium text-gray-800">Ata da 1ª Reunião Ordinária - 2026</td>
                    <td className="py-3 px-4 text-right">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Baixar
                      </button>
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
                    <td className="py-3 px-4 font-medium text-gray-800">Parecer sobre as Contas do FUNDEB 2025</td>
                    <td className="py-3 px-4 text-right">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Baixar
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-800">Resolução nº 001/2026</td>
                    <td className="py-3 px-4 text-right">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
                        <ExternalLink size={14} /> Baixar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </ContentPage>
  );
}
