import { notFound } from "next/navigation";
import { SLUGS_TRANSPARENCIA } from "@/lib/admin/transparencia-tables";
import DataForm from "@/components/admin/DataForm";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TransparenciaNewPage({ params }: Props) {
  const { slug } = await params;

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DataForm slug={slug} mode="nova" />
    </div>
  );
}
