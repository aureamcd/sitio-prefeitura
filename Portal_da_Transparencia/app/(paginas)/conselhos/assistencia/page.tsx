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
        { label: 'Conselhos Municipais' },
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
        <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-6 text-center shadow-sm">
          <Users size={40} className="mx-auto text-blue-500 mb-3" />
          <h3 className="text-lg font-bold mb-1">Membros do Conselho</h3>
          <p className="text-sm opacity-90 max-w-md mx-auto">
            A lista nominal dos membros titulares e suplentes do Conselho Municipal de Assistência Social (CMAS) encontra-se em atualização e será publicada em breve.
          </p>
        </div>
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
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm font-medium">Nenhuma ata publicada no período atual.</p>
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
