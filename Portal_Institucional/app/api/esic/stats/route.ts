/**
 * API: Estatísticas do Dashboard e-SIC
 * GET /api/esic/stats?de=2026-01-01&ate=2026-12-31
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const de = searchParams.get("de");
    const ate = searchParams.get("ate");

    const supabase = createServerClient();
    let query = supabase
      .from("esic_solicitacoes")
      .select("status, created_at, respondido_em, cpf");

    if (de) query = query.gte("created_at", `${de}T00:00:00.000Z`);
    if (ate) query = query.lte("created_at", `${ate}T23:59:59.999Z`);

    const { data, error } = await query;

    if (error) {
      console.error("[e-SIC Stats] Erro:", error);
      return NextResponse.json({ error: "Erro ao carregar estatísticas." }, { status: 500 });
    }

    const registros = data || [];

    const contagem = {
      recebidos: 0, em_analise: 0, respondidos: 0, indeferidos: 0, prorrogados: 0,
      pf: 0, pj: 0,
    };

    let somaMs = 0;
    let qtdRespondidos = 0;

    registros.forEach((r) => {
      switch (r.status) {
        case "recebido": contagem.recebidos++; break;
        case "em_analise": contagem.em_analise++; break;
        case "respondido": contagem.respondidos++; break;
        case "indeferido": contagem.indeferidos++; break;
        case "prorrogado": contagem.prorrogados++; break;
      }

      if (r.respondido_em && r.created_at) {
        const diff = new Date(r.respondido_em).getTime() - new Date(r.created_at).getTime();
        if (diff > 0) { somaMs += diff; qtdRespondidos++; }
      }

      if (r.cpf) {
        const numbersOnly = r.cpf.replace(/\D/g, "");
        if (numbersOnly.length > 11) contagem.pj++;
        else contagem.pf++;
      } else {
        contagem.pf++;
      }
    });

    return NextResponse.json({
      total: registros.length,
      ...contagem,
      tempo_medio_resposta_dias: qtdRespondidos > 0
        ? Math.max(1, Math.ceil(somaMs / qtdRespondidos / (1000 * 60 * 60 * 24)))
        : 0,
    });
  } catch (err) {
    console.error("[e-SIC Stats] Erro:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

