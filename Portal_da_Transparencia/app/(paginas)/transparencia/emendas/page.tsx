import ContentPage from "@/components/layout/ContentPage";

export default function EmendasPage() {
  return (
    <ContentPage
      title="Emendas Parlamentares"
      description="Acompanhamento da execução orçamentária e financeira de emendas parlamentares."
      breadcrumb={[{ label: "Início", href: "/" }, { label: "Emendas Parlamentares" }]}
    >
      <div className="p-8 text-center text-gray-500">
        <p>Módulo de Emendas em implementação conforme as novas diretrizes do PNTP 2026.</p>
      </div>
    </ContentPage>
  );
}
