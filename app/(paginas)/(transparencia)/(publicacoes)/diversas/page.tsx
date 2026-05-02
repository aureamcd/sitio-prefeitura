import PublicationPage from "@/components/layout/PublicationPage";

const documentos = [
  {
    id: 1,
    titulo: "Relatório de Gestão 2025",
    data: "10/01/2026",
    arquivo: "/docs/diversas/relatorio-gestao-2025.pdf",
  },
];

export default function PublicacoesDiversasPage() {
  return (
    <PublicationPage
      title="Publicações Diversas"
      description="Outras publicações oficiais da Prefeitura que não se enquadram nas categorias específicas."
      breadcrumb={[
        { label: "Início", href: "/" },
        { label: "Publicações Oficiais" },
        { label: "Publicações Diversas" },
      ]}
      lastUpdate="2026-04-30"
      responsavel="Prefeitura Municipal"
      documentos={documentos}
    />
  );
}
