import ContentPage from "@/components/layout/ContentPage";
import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { getTodayDate } from '@/lib/utils/date';

export const metadata: Metadata = {
  title: "Estrutura Organizacional",
  description: "Conheça a estrutura organizacional e os responsáveis pelas secretarias e órgãos da Prefeitura.",
};

export default function EstruturaOrganizacionalPage() {
  // Dados mockados para simular a tabela do banco de dados (PNTP 2026 exige identificação nominal e organograma)
  const orgaos = [
    {
      nome: "Gabinete do Prefeito",
      responsavel: "João da Silva",
      cargo: "Prefeito Municipal",
      telefone: "(89) 3456-1234",
      horario: "08:00 às 13:00",
    },
    {
      nome: "Secretaria de Finanças",
      responsavel: "Maria de Oliveira",
      cargo: "Secretária de Finanças",
      telefone: "(89) 3456-1235",
      horario: "08:00 às 13:00",
    },
    {
      nome: "Secretaria de Saúde",
      responsavel: "José de Souza",
      cargo: "Secretário de Saúde",
      telefone: "(89) 3456-1236",
      horario: "08:00 às 13:00",
    },
    {
      nome: "Secretaria de Educação",
      responsavel: "Ana Rita",
      cargo: "Secretária de Educação",
      telefone: "(89) 3456-1237",
      horario: "08:00 às 13:00",
    },
  ];

  return (
    <ContentPage
      title="Estrutura Organizacional"
      description="Relação hierárquica entre as unidades administrativas e identificação nominal dos responsáveis pela gestão."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Informações Institucionais" },
        { label: "Estrutura Organizacional" },
      ]}
      lastUpdate={getTodayDate()}
    >
      <div className="space-y-8 mt-6">
        {/* Organograma Simulado */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
            Unidades Administrativas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgaos.map((orgao, i) => (
              <div
                key={i}
                className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{orgao.nome}</h3>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong className="text-gray-800">Responsável:</strong> {orgao.responsavel}
                  </p>
                  <p>
                    <strong className="text-gray-800">Cargo:</strong> {orgao.cargo}
                  </p>
                  <p>
                    <strong className="text-gray-800">Telefone:</strong> {orgao.telefone}
                  </p>
                  <p>
                    <strong className="text-gray-800">Atendimento:</strong> {orgao.horario}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ContentPage>
  );
}
