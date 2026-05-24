import ContentPage from "@/components/layout/ContentPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competências e Atribuições",
  description: "Competências legais do município e atribuições de cada secretaria e órgão.",
};

export default function CompetenciasAtribuicoesPage() {
  const competencias = [
    {
      orgao: "Gabinete do Prefeito",
      atribuicao: "Assessorar o Prefeito nas suas funções políticas e administrativas, coordenar a comunicação institucional e as relações com os demais poderes e a sociedade civil.",
      lei: "Lei Municipal Nº 1.001/2000, Art. 10",
    },
    {
      orgao: "Secretaria de Finanças",
      atribuicao: "Formular e executar a política financeira e tributária do município, gerenciar a arrecadação e controlar a execução orçamentária e as contas públicas.",
      lei: "Lei Municipal Nº 1.001/2000, Art. 12",
    },
    {
      orgao: "Secretaria de Saúde",
      atribuicao: "Planejar, coordenar e executar as ações e serviços de saúde pública no município, gerenciando a rede do SUS municipal, campanhas de vacinação e vigilância sanitária.",
      lei: "Lei Municipal Nº 1.001/2000, Art. 15",
    },
    {
      orgao: "Secretaria de Educação",
      atribuicao: "Promover a educação básica municipal, administrar a rede pública de ensino, transporte escolar, merenda e formular o Plano Municipal de Educação.",
      lei: "Lei Municipal Nº 1.001/2000, Art. 16",
    },
  ];

  return (
    <ContentPage
      title="Competências e Atribuições"
      description="Conheça as competências legais do município e as atribuições específicas de cada secretaria ou órgão público."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Informações Institucionais" },
        { label: "Competências e Atribuições" },
      ]}
      lastUpdate="24/05/2026"
    >
      <div className="mt-8 space-y-6">
        {competencias.map((item, idx) => (
          <div key={idx} className="bg-white p-5 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.orgao}</h3>
            <p className="text-gray-700 leading-relaxed mb-3">{item.atribuicao}</p>
            <div className="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-md border border-gray-200">
              <span className="font-semibold">Fundamento Legal:</span> {item.lei}
            </div>
          </div>
        ))}
      </div>
    </ContentPage>
  );
}
