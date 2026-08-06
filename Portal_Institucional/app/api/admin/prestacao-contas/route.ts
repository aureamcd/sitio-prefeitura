import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .schema("transparencia").from("planejamento_documentos")
        .select("id, titulo, descricao, exercicio, tipo, data_publicacao, arquivo_url, arquivo_nome, created_at")
        .order("exercicio", { ascending: false })
        .order("titulo", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedData = data?.map(d => ({
        ...d,
        ano: d.exercicio?.toString(),
        arquivo_r2_url: d.arquivo_url
    })) || [];

    return NextResponse.json(mappedData);
}
