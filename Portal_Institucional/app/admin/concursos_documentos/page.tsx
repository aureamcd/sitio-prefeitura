import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataList from "@/components/admin/DataList";

export default async function AdminConcursosDocsPage() {
  const slug = "concursos_documentos";

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Documentos de Concursos e Seletivos</h1>
        <p className="text-gray-500">
          Gerencie os editais, retificações, nomeações e demais anexos. 
          Use o ID do Concurso para vincular os documentos ao certame correto.
        </p>
      </div>

      <DataList slug={slug} />
    </div>
  );
}
