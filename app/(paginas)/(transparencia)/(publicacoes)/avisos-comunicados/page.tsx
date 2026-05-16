import PublicationPage from "@/components/layout/PublicationPage";

const documentos = [
  {
    id: 1,
    titulo: "Aviso de Suspensão de Licitação nº 02/2026",
    data: "20/04/2026",
    arquivo: "/docs/avisos/aviso-02-2026.pdf",
  },
];

export default function AvisosPage() {
  return (
    <PublicationPage
      title="Avisos e Comunicados"
      description="Divulgação de avisos oficiais, comunicados institucionais e informações relevantes ao cidadão."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Publicações Oficiais" },
        { label: "Avisos / Comunicados" },
      ]}
      lastUpdate="2026-05-04"
      documentos={documentos}
    />
  );
}
