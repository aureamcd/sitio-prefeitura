import { NextResponse } from "next/server";
import { executarSincronizacaoSemanalReceitas } from "@/scripts/automatico/importar-receitas-cron";

export const maxDuration = 300; // Vercel permite até 300 segundos

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";
  
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
  
  const cronSecret = process.env.CRON_SECRET || "supersecretkey123";
  
  if (key !== cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultado = await executarSincronizacaoSemanalReceitas();
    return NextResponse.json({ 
      success: true, 
      message: "Sincronização semanal de receitas e dívida ativa concluída com sucesso.",
      data: resultado
    });
  } catch (error: any) {
    console.error("Vercel Cron error (Receitas):", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An error occurred during revenue import." 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
