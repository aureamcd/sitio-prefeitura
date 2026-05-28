import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataList from "@/components/admin/DataList";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TransparenciaListPage({ params }: Props) {
  const { slug } = await params;

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DataList slug={slug} />
    </div>
  );
}
