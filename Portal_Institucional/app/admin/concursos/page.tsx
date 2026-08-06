import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataList from "@/components/admin/DataList";

export default async function AdminConcursosPage() {
  const slug = "concursos";

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Concursos e Seletivos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Gerencie os editais de concursos públicos e testes seletivos (Dimensão de RH).
        </p>
      </div>
      <DataList slug={slug} />
    </div>
  );
}
