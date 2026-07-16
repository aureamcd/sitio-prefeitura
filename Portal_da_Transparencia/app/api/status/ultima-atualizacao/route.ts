import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const queries = [
      supabase.from("noticias").select("data").eq("status", "publicado").order("data", { ascending: false }).limit(1),
      supabase.schema("transparencia").from("planejamento_documentos").select("updated_at, created_at").order("updated_at", { ascending: false }).limit(1),
      supabase.schema("transparencia").from("despesas").select("created_at").order("created_at", { ascending: false }).limit(1),
      supabase.schema("transparencia").from("receitas").select("created_at").order("created_at", { ascending: false }).limit(1),
      supabase.schema("transparencia").from("licitacoes").select("created_at").order("created_at", { ascending: false }).limit(1),
      supabase.schema("transparencia").from("contratos").select("created_at").order("created_at", { ascending: false }).limit(1),
    ];

    const results = await Promise.all(queries);
    const dates: number[] = [];

    for (const res of results) {
      if (res.data && res.data.length > 0) {
        const item = res.data[0] as any;
        const dateStr = item.data || item.updated_at || item.created_at;
        if (dateStr) {
          const time = new Date(dateStr).getTime();
          if (!isNaN(time)) dates.push(time);
        }
      }
    }

    const maxTime = dates.length > 0 ? Math.max(...dates) : Date.now();
    const dateObj = new Date(maxTime);
    const formattedDate = dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });

    return NextResponse.json(
      {
        timestamp: dateObj.toISOString(),
        date: formattedDate
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "s-maxage=60, stale-while-revalidate=300"
        }
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao consultar última atualização do banco",
        date: new Date().toLocaleDateString("pt-BR")
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
}
