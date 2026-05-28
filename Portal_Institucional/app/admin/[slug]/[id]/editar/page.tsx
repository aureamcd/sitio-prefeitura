import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { SLUGS_TRANSPARENCIA, SLUG_TO_TABLE } from "@/lib/admin/transparencia-tables";
import DataForm from "@/components/admin/DataForm";

type Props = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function TransparenciaEditPage({ params }: Props) {
  const { slug, id } = await params;

  if (!SLUGS_TRANSPARENCIA.includes(slug)) {
    notFound();
  }

  const supabase = createServerClient();

  const tableName = SLUG_TO_TABLE[slug];
  if (!tableName) {
    notFound();
  }

  const { data, error } = await supabase
    .schema("transparencia")
    .from(tableName)
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <DataForm slug={slug} mode="editar" initialData={data} />
    </div>
  );
}
