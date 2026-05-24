import ContentPage from "@/components/layout/ContentPage";

export default function DiariasPage() {
  return (
    <ContentPage
      title="Diárias e Passagens"
      description="Consulte as concessões de diárias e passagens para servidores e autoridades municipais."
      breadcrumb={[{ label: "Início", href: "/" }, { label: "Diárias" }]}
    >
      <div className="p-8 text-center text-gray-500">
        <p>Módulo de Diárias em implementação para adequação ao layout PNTP.</p>
      </div>
    </ContentPage>
  );
}
