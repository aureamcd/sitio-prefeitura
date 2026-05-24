/**
 * API: Consulta pública de protocolo Ouvidoria
 * GET /api/ouvidoria/consultar?protocolo=OUV-2026-00001&email=xxx
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { limparCPF } from "@/lib/utils/protocolo";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const protocolo = searchParams.get("protocolo")?.toUpperCase().trim();
    const email = searchParams.get("email")?.toLowerCase().trim();
    const cpf = searchParams.get("cpf") ? limparCPF(searchParams.get("cpf")!) : null;

    if (!protocolo) {
      return NextResponse.json({ error: "Protocolo é obrigatório." }, { status: 400 });
    }
    if (!email && !cpf) {
      return NextResponse.json({ error: "Informe e-mail ou CPF." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("ouvidoria_manifestacoes")
      .select("*")
      .eq("protocolo", protocolo)
      .maybeSingle();

    if (error) {
      console.error("[Ouvidoria Consulta] DB error:", error);
      return NextResponse.json({ error: "Erro ao consultar banco de dados." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Protocolo não encontrado." }, { status: 404 });
    }

    const emailMatch = email && data.email?.toLowerCase() === email;
    const cpfMatch = cpf && data.cpf && limparCPF(data.cpf) === cpf;

    if (!emailMatch && !cpfMatch) {
      return NextResponse.json({ error: "Dados não correspondem." }, { status: 403 });
    }

    return NextResponse.json({
      protocolo: data.protocolo,
      tipo: data.tipo,
      status: data.status,
      descricao: data.descricao,
      resposta: data.resposta,
      resposta_anexo_url: data.resposta_anexo_url,
      justificativa_indeferimento: data.justificativa_indeferimento,
      created_at: data.created_at,
      updated_at: data.updated_at,
      respondido_em: data.respondido_em,
      prazo_resposta: data.prazo_resposta,
      data_prorrogacao: data.data_prorrogacao,
      motivo_prorrogacao: data.motivo_prorrogacao,
    });
  } catch (err) {
    console.error("[Ouvidoria Consulta] Erro:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
