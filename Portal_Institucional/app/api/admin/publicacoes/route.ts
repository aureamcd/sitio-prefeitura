import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("publicacoes")
        .select("id, titulo, descricao, numero, ano, tipo, data_publicacao, arquivo_url, arquivo_r2_url, arquivo_drive_id, created_at")
        .order("ano", { ascending: false })
        .order("numero", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
