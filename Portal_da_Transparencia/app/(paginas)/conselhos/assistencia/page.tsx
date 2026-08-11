'use client';

import ContentPage from '@/components/layout/ContentPage';
import DataTable from '@/components/ui/DataTable';
import { Mail, Phone, Users, FileText, ExternalLink } from 'lucide-react';
import { getTodayDate } from '@/lib/utils/date';

export default function ConselhoAssistenciaPage() {
  return (
    <ContentPage
      title="Conselho de Assistência Social"
      description="Acompanhamento e controle social da Política Municipal de Assistência Social — Critério 19.4 do PNTP."
      breadcrumb={[
        { label: 'Início', href: '/' },
        { label: 'Conselhos Municipais', href: '/#secao-7' },
        { label: 'Conselho de Assistência Social' },
      ]}
      lastUpdate={getTodayDate()}
      responsible="Secretaria Municipal de Assistência Social"
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
              <a href="mailto:cmas.padremarcos@gmail.com" className="text-sm font-semibold text-blue-700 hover:underline">
                cmas.padremarcos@gmail.com
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Phone size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Telefone (Secretaria de Assistência)</p>
              <p className="text-sm font-semibold text-gray-800">(89) 98116-0001</p>
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
            { header: 'Titular', accessor: 'titular', render: (v: string) => <span className="font-semibold text-sm">{v}</span> },
            { header: 'Suplente', accessor: 'suplente' },
            { header: 'Representação', accessor: 'representacao' },
          ]}
          data={[
            { titular: 'Carla Lariza Ribeiro Carvalho', suplente: 'Débora Lima Barros', representacao: 'Sec. Municipal de Assistência Social' },
            { titular: 'Thales Manoel da Silva', suplente: 'Virlândia Maria de Sousa', representacao: 'Sec. Municipal de Saúde' },
            { titular: 'Eraldo Carvalho Gomes', suplente: 'Avelanjo Sebastião de Macedo', representacao: 'Sec. Municipal de Educação' },
            { titular: 'Thuanny Mikaella Conceicao Silva', suplente: 'Mychell Umbelino Ribeiro', representacao: 'Sec. Municipal de Administração' },
            { titular: 'Geneilza Ana de Oliveira Sousa', suplente: 'Francisco Everaldo dos Reis Junior', representacao: 'Sec. Municipal do Meio Ambiente' },
            { titular: 'Arthur Ribeiro Modesto', suplente: 'Linnara Emily Benedito Moura', representacao: 'Sec. Municipal de Cultura' },
            { titular: 'Maria do Perpetuo Socorro Sousa Alves', suplente: 'Clóvis Francisco de Morais', representacao: 'Trabalhadores do SUAS' },
            { titular: 'Leonardo Homero de Carvalho', suplente: 'Carlos Eduardo de Sousa Leal', representacao: 'Trabalhadores do SUAS' },
            { titular: 'Jarbas da Silva Sousa', suplente: 'Maria Laísia de Araújo', representacao: 'Trabalhadores do SUAS' },
            { titular: 'Antônia Zenaide da Silva Carvalho', suplente: 'Bernadete da Conceição', representacao: 'Usuários dos Programas Sociais' },
            { titular: 'Eva Ângela Ribeiro', suplente: 'Jéssica Michaele de Brito', representacao: 'Usuários dos Programas Sociais' },
            { titular: 'Maria Carolina de Araújo Silva', suplente: 'Marcos Antônio de Carvalho Leal', representacao: 'Usuários dos Programas Sociais' },
          ]}
          title="Membros do CMAS (Portaria 269/2025)"
          caption="Relação oficial dos conselheiros titulares e suplentes."
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
                    <td className="py-3 px-4 font-medium text-gray-800">Ata de Reunião de 21 de Janeiro e outras Reuniões Ordinárias CMAS</td>
                    <td className="py-3 px-4 text-right">
                      <a href="/documentos/assistencia/atas-cmas-2026.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors">
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
