import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataList from "@/components/admin/DataList";

export default async function AdminObrasPage() {
  const slug = "obras";

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Obras</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie as obras e serviços de engenharia (Critério 10 do PNTP).
        </p>
      </div>
      <DataList slug={slug} />
    </div>
  );
}
