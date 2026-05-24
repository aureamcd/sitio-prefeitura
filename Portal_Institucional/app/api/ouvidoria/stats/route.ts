/**
 * API: Estatísticas do Dashboard Ouvidoria
 * GET /api/ouvidoria/stats?de=2026-01-01&ate=2026-12-31
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { OuvidoriaTipo } from "@/lib/types/ouvidoria";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const de = searchParams.get("de");
    const ate = searchParams.get("ate");

    const supabase = createServerClient();
    let query = supabase
      .from("ouvidoria_manifestacoes")
      .select("status, tipo, created_at, respondido_em");

    if (de) query = query.gte("created_at", `${de}T00:00:00.000Z`);
    if (ate) query = query.lte("created_at", `${ate}T23:59:59.999Z`);

    const { data, error } = await query;

    if (error) {
      console.error("[Ouvidoria Stats] Erro:", error);
      return NextResponse.json({ error: "Erro ao carregar." }, { status: 500 });
    }

    const registros = data || [];
    const contagem = { recebidos: 0, em_analise: 0, respondidos: 0, indeferidos: 0, prorrogados: 0 };
    const porTipo: Record<OuvidoriaTipo, number> = {
      denuncia: 0, reclamacao: 0, solicitacao: 0, sugestao: 0, elogio: 0,
    };

    let somaMs = 0;
    let qtd = 0;

    registros.forEach((r) => {
      switch (r.status) {
        case "recebido": contagem.recebidos++; break;
        case "em_analise": contagem.em_analise++; break;
        case "respondido": contagem.respondidos++; break;
        case "indeferido": contagem.indeferidos++; break;
        case "prorrogado": contagem.prorrogados++; break;
      }
      if (r.tipo in porTipo) porTipo[r.tipo as OuvidoriaTipo]++;
      if (r.respondido_em && r.created_at) {
        const diff = new Date(r.respondido_em).getTime() - new Date(r.created_at).getTime();
        if (diff > 0) { somaMs += diff; qtd++; }
      }
    });

    return NextResponse.json({
      total: registros.length,
      ...contagem,
      tempo_medio_resposta_dias: qtd > 0 ? Math.max(1, Math.ceil(somaMs / qtd / (1000 * 60 * 60 * 24))) : 0,
      por_tipo: porTipo,
    });
  } catch (err) {
    console.error("[Ouvidoria Stats] Erro:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
