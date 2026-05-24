/**
 * ========================================================
 * API ROUTE: e-SIC — CRUD Completo
 * ========================================================
 *
 * POST  → Criar solicitação (cidadão)
 * GET   → Listar (admin, com filtros e paginação)
 * PATCH → Atualizar status/resposta (admin)
 *
 * DECISÃO: Usa createServerClient (service_role) para
 * bypassar RLS — seguro pois está server-side.
 *
 * @module app/api/esic/route
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { gerarProtocolo, calcularPrazoResposta } from "@/lib/utils/protocolo";
import { enviarEmailStatus } from "@/lib/utils/email";
import type { EsicFormData, EsicRespostaAdmin } from "@/lib/types/esic";

/* ── POST: Criar solicitação ── */
export async function POST(request: NextRequest) {
  try {
    const body: EsicFormData = await request.json();

    if (!body.nome || !body.email || !body.descricao) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, email, descricao" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    /* Conta existentes para protocolo sequencial */
    const { count, error: countError } = await supabase
      .from("esic_solicitacoes")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("[e-SIC] Erro ao contar:", countError);
      return NextResponse.json(
        { error: "Erro interno ao gerar protocolo." },
        { status: 500 }
      );
    }

    const protocolo = gerarProtocolo("ESIC", count || 0);
    const prazoResposta = calcularPrazoResposta("ESIC");

    const { error: insertError } = await supabase
      .from("esic_solicitacoes")
      .insert({
        protocolo,
        nome: body.nome,
        email: body.email.toLowerCase().trim(),
        cpf: body.cpf || null,
        telefone: body.telefone || null,
        descricao: body.descricao,
        orgao_destinatario: body.orgao_destinatario || null,
        status: "recebido",
        prazo_resposta: prazoResposta,
      });

    if (insertError) {
      console.error("[e-SIC] Erro ao inserir:", insertError);
      return NextResponse.json(
        { error: "Erro ao registrar solicitação." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { protocolo, message: "Solicitação registrada com sucesso." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[e-SIC] Erro:", err);
    return NextResponse.json(
      { error: "Erro inesperado no servidor." },
      { status: 500 }
    );
  }
}

/* ── GET: Listar solicitações (admin) ── */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    let query = supabase
      .from("esic_solicitacoes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "todos") query = query.eq("status", status);
    if (search) query = query.or(`protocolo.ilike.%${search}%,nome.ilike.%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      console.error("[e-SIC] Erro ao listar:", error);
      return NextResponse.json(
        { error: "Erro ao carregar solicitações." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error("[e-SIC] Erro:", err);
    return NextResponse.json(
      { error: "Erro inesperado." },
      { status: 500 }
    );
  }
}

/* ── PATCH: Atualizar (admin) ── */
export async function PATCH(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: EsicRespostaAdmin & { id: string };
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        id: String(formData.get("id") || ""),
        status: String(formData.get("status") || "") as EsicRespostaAdmin["status"],
        resposta: String(formData.get("resposta") || ""),
        justificativa_indeferimento: String(formData.get("justificativa_indeferimento") || ""),
        data_prorrogacao: String(formData.get("data_prorrogacao") || ""),
        motivo_prorrogacao: String(formData.get("motivo_prorrogacao") || ""),
      };
      file = formData.get("resposta_anexo") as File | null;
    } else {
      body = await request.json();
    }

    if (!body.id) {
      return NextResponse.json(
        { error: "ID da solicitação é obrigatório." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const updateData: Record<string, unknown> = { status: body.status };
    if (body.resposta) updateData.resposta = body.resposta;
    if (body.justificativa_indeferimento) updateData.justificativa_indeferimento = body.justificativa_indeferimento;
    if (body.data_prorrogacao) {
      updateData.data_prorrogacao = body.data_prorrogacao;
      if (body.status === "prorrogado") {
        updateData.prazo_resposta = new Date(body.data_prorrogacao).toISOString();
      }
    }
    if (body.motivo_prorrogacao) updateData.motivo_prorrogacao = body.motivo_prorrogacao;
    if (body.status === "respondido" || body.status === "indeferido") {
      updateData.respondido_em = new Date().toISOString();
    }

    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop() || "pdf";
      const fileName = `${body.id}-${Date.now()}.${fileExt}`;
      const filePath = `esic/respostas/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("[e-SIC] Erro no upload da resposta:", uploadError);
        const uploadStatus = (uploadError as unknown as Record<string, unknown>).status;
        const errorMessage = uploadStatus === 413
          ? "O arquivo excede o limite de tamanho do servidor (Supabase Storage)."
          : "Erro ao enviar anexo da resposta.";
        return NextResponse.json(
          { error: errorMessage },
          { status: 500 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);
      updateData.resposta_anexo_url = publicUrl;
    }

    const { data: updatedRow, error } = await supabase
      .from("esic_solicitacoes")
      .update(updateData)
      .eq("id", body.id)
      .select("email, protocolo, status")
      .single();

    if (error) {
      console.error("[e-SIC] Erro ao atualizar:", error);
      return NextResponse.json(
        { error: "Erro ao atualizar solicitação." },
        { status: 500 }
      );
    }

    if (updatedRow?.email && updatedRow?.protocolo) {
      await enviarEmailStatus(
        updatedRow.email,
        updatedRow.protocolo,
        "e-SIC",
        updatedRow.status,
        `${new URL(request.url).origin}/esic/consultar`
      );
    }

    return NextResponse.json({ message: "Solicitação atualizada com sucesso." });
  } catch (err) {
    console.error("[e-SIC] Erro:", err);
    return NextResponse.json(
      { error: "Erro inesperado." },
      { status: 500 }
    );
  }
}
