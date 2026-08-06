import { createServerClient } from "@/lib/supabase/server";
import DocumentoForm from "../../../_components/DocumentoForm";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function EditarPrestacaoContasPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createServerClient();
  const id = params.id;

  const { data: row, error } = await supabase
    .schema("transparencia")
    .from("planejamento_documentos")
    .select("*")
    .eq("id", Number(id))
    .single();

  if (error || !row) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-700">
        <AlertTriangle size={40} className="text-amber-400" />
        <p className="text-lg font-bold text-gray-800">Prestação de Contas não encontrada</p>
        <p className="text-sm">ID {id} não existe no banco de dados.</p>
        <p className="text-xs text-red-600 max-w-lg text-center mt-2">{error?.message}</p>
        <Link
          href="/admin/prestacao-contas"
          className="mt-2 px-5 py-2.5 bg-[#0B3D91] text-white rounded-xl text-sm font-bold hover:bg-[#0a3280] transition"
        >
          Voltar à listagem
        </Link>
      </div>
    );
  }

  const data = {
    id:              row.id,
    titulo:          row.titulo          ?? "",
    tipo:            row.tipo            ?? row.categoria ?? "RGF",
    numero:          row.numero          ?? "",
    ano:             row.exercicio       ? Number(row.exercicio) : new Date().getFullYear(),
    descricao:       row.descricao       ?? "",
    orgao:           row.orgao           ?? "",
    data_publicacao: row.data_publicacao ?? "",
    publicado:       row.publicado       ?? false,
    arquivo_r2_url:  row.arquivo_url     ?? "",
    arquivo_nome:    row.arquivo_nome    ?? "",
  };

  return <DocumentoForm mode="editar" initialData={data} categoriaInicial="prestacao-contas" />;
}
