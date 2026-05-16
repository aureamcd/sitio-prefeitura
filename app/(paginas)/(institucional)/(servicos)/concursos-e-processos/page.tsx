"use client";

import PublicationPage from "@/components/layout/PublicationPage";

const documentos = [
  {
    id: 1,
    titulo: "Edital de Concurso Público nº 01/2024 - Resultado Final",
    tipo: "Concurso Público",
    data: "10/01/2024",
    arquivo: "#", // Link fictício ou real se soubermos
  },
  {
    id: 2,
    titulo: "Processo Seletivo Simplificado nº 02/2024 - Secretaria de Saúde",
    tipo: "Processo Seletivo",
    data: "05/03/2024",
    arquivo: "#",
  },
];

export default function ConcursosPage() {
  return (
    <PublicationPage
      title="Concursos e Processos Seletivos"
      description="Acompanhe os editais, convocações e resultados de concursos públicos e seleções simplificadas do município."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Serviços", href: "/servicos/todos" },
        { label: "Concursos e Seletivos" },
      ]}
      lastUpdate="2026-05-04"
      documentos={documentos}
      showTipoFiltro
      tipos={["Concurso Público", "Processo Seletivo"]}
    />
  );
}
