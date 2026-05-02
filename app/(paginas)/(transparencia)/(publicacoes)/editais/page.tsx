import PublicationPage from "@/components/layout/PublicationPage";

const documentos = [
  {
    id: 1,
    titulo: "Edital de Licitação nº 01/2026",
    tipo: "Licitação",
    data: "10/04/2026",
    arquivo: "/docs/editais/licitacao-01-2026.pdf",
  },
  {
    id: 2,
    titulo: "Edital de Concurso Público nº 01/2026",
    tipo: "Concurso",
    data: "05/02/2026",
    arquivo: "/docs/editais/concurso-01-2026.pdf",
  },
];

export default function EditaisPage() {
  return (
    <PublicationPage
      title="Editais"
      description="Publicação de editais de licitações, concursos públicos e processos seletivos."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Publicações Oficiais" },
        { label: "Editais" },
      ]}
      lastUpdate="2026-04-30"
      responsavel="Comissão Permanente de Licitação"
      documentos={documentos}
      showTipoFiltro
      tipos={["Licitação", ]}
    />
  );
}
