import { NextResponse } from "next/server";
import { sincronizarDespesasAno } from "@/scripts/automatico/importar-despesas-cron";

export const maxDuration = 300; // Vercel pro tier / timeout até 300 segundos

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";
  const anoParam = searchParams.get("ano");
  const anoAlvo = anoParam ? parseInt(anoParam, 10) : new Date().getFullYear();
  
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
  
  const cronSecret = process.env.CRON_SECRET || "supersecretkey123";
  
  if (key !== cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resultado = await sincronizarDespesasAno(anoAlvo);
    return NextResponse.json({ 
      success: true, 
      message: `Sincronização delta de despesas do exercício ${anoAlvo} concluída com sucesso.`,
      data: resultado
    });
  } catch (error: any) {
    console.error("Vercel Cron error (Despesas):", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An error occurred during despesas delta import." 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
