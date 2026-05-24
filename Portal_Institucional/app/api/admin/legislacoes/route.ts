import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("legislacoes")
        .select("id, titulo, tipo, numero, ano, orgao, data_publicacao, publicado, slug, arquivo_r2_url, arquivo_nome, arquivo_tamanho, arquivo_extensao")
        .order("ano", { ascending: false })
        .order("id", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
