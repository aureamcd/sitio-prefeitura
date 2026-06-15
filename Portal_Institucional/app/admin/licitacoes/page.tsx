import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataList from "@/components/admin/DataList";
import ImportarPlanilha from "@/components/admin/ImportarPlanilha";

export default async function AdminLicitacoesPage() {
  const slug = "licitacoes";

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ImportarPlanilha />
      </div>
      <DataList slug={slug} />
    </div>
  );
}
