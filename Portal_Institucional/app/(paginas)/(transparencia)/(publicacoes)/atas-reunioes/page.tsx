import PublicationPage from "@/components/layout/PublicationPage";

const documentos = [
  {
    id: 1,
    titulo: "Ata da Sessão Ordinária nº 01/2026",
    data: "15/03/2026",
    arquivo: "/docs/atas/ata-01-2026.pdf",
  },
];

export default function AtasPage() {
  return (
    <PublicationPage
      title="Atas de Reuniões"
      description="Publicação das atas de reuniões e sessões administrativas da Prefeitura Municipal."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Publicações Oficiais" },
        { label: "Atas de Reuniões" },
      ]}
      lastUpdate="2026-05-04"
      documentos={documentos}
    />
  );
}
