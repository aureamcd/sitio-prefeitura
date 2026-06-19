import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataList from "@/components/admin/DataList";

type Props = {
  params: Promise<{ slug: string }>;
};

import ImportarPlanilha from "@/components/admin/ImportarPlanilha";

export default async function TransparenciaListPage({ params }: Props) {
  const { slug } = await params;

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {slug === "contratos" && (
        <ImportarPlanilha endpoint="/api/admin/contratos/importar" />
      )}
      <DataList slug={slug} />
    </div>
  );
}
