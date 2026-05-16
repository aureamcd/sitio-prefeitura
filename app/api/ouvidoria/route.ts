/**
 * API ROUTE: Ouvidoria — CRUD de Manifestações
 * POST / GET / PATCH
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { gerarProtocolo, calcularPrazoResposta } from "@/lib/utils/protocolo";
import { enviarEmailStatus } from "@/lib/utils/email";
import type { OuvidoriaRespostaAdmin, OuvidoriaTipo } from "@/lib/types/ouvidoria";

type OuvidoriaRequestBody = {
  tipo?: OuvidoriaTipo | FormDataEntryValue | null;
  nome?: string | FormDataEntryValue | null;
  email?: string | FormDataEntryValue | null;
  cpf?: string | FormDataEntryValue | null;
  telefone?: string | FormDataEntryValue | null;
  descricao?: string | FormDataEntryValue | null;
  orgao_destinatario?: string | FormDataEntryValue | null;
  anonimo?: boolean;
};

function asString(value: string | FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: OuvidoriaRequestBody;
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        tipo: formData.get("tipo"),
        nome: formData.get("nome"),
        email: formData.get("email"),
        cpf: formData.get("cpf"),
        telefone: formData.get("telefone"),
        descricao: formData.get("descricao"),
        orgao_destinatario: formData.get("orgao_destinatario"),
        anonimo: formData.get("anonimo") === "true" || formData.get("anonimo") === "on",
      };
      file = formData.get("anexo") as File | null;
    } else {
      body = await request.json();
    }

    const nome = asString(body.nome);
    const email = asString(body.email).toLowerCase();
    const descricao = asString(body.descricao);
    const tipo = asString(body.tipo) as OuvidoriaTipo;
    const cpf = asString(body.cpf);
    const telefone = asString(body.telefone);
    const orgaoDestinatario = asString(body.orgao_destinatario);

    if (!nome || !email || !descricao || !tipo) {
      return NextResponse.json(
        { error: "Campos obrigatórios: nome, email, descricao, tipo" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { count, error: countError } = await supabase
      .from("ouvidoria_manifestacoes")
      .select("id", { count: "exact", head: true });

    if (countError) {
      console.error("[Ouvidoria] Erro ao contar:", countError);
      return NextResponse.json({ error: "Erro interno." }, { status: 500 });
    }

    const protocolo = gerarProtocolo("OUV", count || 0);
    const prazoResposta = calcularPrazoResposta("OUV");

    let anexo_url = null;

    if (file && file.size > 0) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${protocolo}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `ouvidoria/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("[Ouvidoria] Erro no upload:", uploadError);
        const errorMessage = (uploadError as any).status === 413 
          ? "O arquivo anexado excede o limite de tamanho permitido." 
          : "Erro ao enviar anexo.";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from("attachments")
          .getPublicUrl(filePath);
        anexo_url = publicUrl;
      }
    }

    const { error: insertError } = await supabase
      .from("ouvidoria_manifestacoes")
      .insert({
        protocolo,
        tipo,
        nome: body.anonimo ? "Anônimo" : body.nome,
        email,
        cpf: cpf || null,
        telefone: telefone || null,
        descricao,
        orgao_destinatario: orgaoDestinatario || null,
        anonimo: body.anonimo || false,
        status: "recebido",
        prazo_resposta: prazoResposta,
        anexo_url,
      });

    if (insertError) {
      console.error("[Ouvidoria] Erro ao inserir:", insertError);
      return NextResponse.json({ error: "Erro ao registrar." }, { status: 500 });
    }

    return NextResponse.json(
      { protocolo, message: "Manifestação registrada com sucesso." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[Ouvidoria] Erro:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const tipo = searchParams.get("tipo");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const supabase = createServerClient();

    let query = supabase
      .from("ouvidoria_manifestacoes")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "todos") query = query.eq("status", status);
    if (tipo && tipo !== "todos") query = query.eq("tipo", tipo);
    if (search) query = query.or(`protocolo.ilike.%${search}%,nome.ilike.%${search}%`);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Ouvidoria] Erro:", error);
      return NextResponse.json({ error: "Erro ao carregar." }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error("[Ouvidoria] Erro:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: OuvidoriaRespostaAdmin & { id: string };
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      body = {
        id: String(formData.get("id") || ""),
        status: String(formData.get("status") || "") as OuvidoriaRespostaAdmin["status"],
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
      return NextResponse.json({ error: "ID é obrigatório." }, { status: 400 });
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
      const filePath = `ouvidoria/respostas/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        console.error("[Ouvidoria] Erro no upload da resposta:", uploadError);
        return NextResponse.json({ error: "Erro ao enviar anexo da resposta." }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);
      updateData.resposta_anexo_url = publicUrl;
    }

    const { data: updatedRow, error } = await supabase
      .from("ouvidoria_manifestacoes")
      .update(updateData)
      .eq("id", body.id)
      .select("email, protocolo, status")
      .single();

    if (error) {
      console.error("[Ouvidoria] Erro:", error);
      return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
    }

    /* E-mail automático removido a pedido do usuário */

    if (updatedRow?.email && updatedRow?.protocolo) {
      await enviarEmailStatus(
        updatedRow.email,
        updatedRow.protocolo,
        "Ouvidoria",
        updatedRow.status,
        `${new URL(request.url).origin}/ouvidoria/consultar`
      );
    }

    return NextResponse.json({ message: "Manifestação atualizada." });
  } catch (err) {
    console.error("[Ouvidoria] Erro:", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
