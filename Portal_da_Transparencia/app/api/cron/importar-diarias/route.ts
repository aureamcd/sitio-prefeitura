import { NextResponse } from "next/server";
import { executarImportacaoDiarias } from "@/scripts/automatico/importar-diarias-cron";

export const maxDuration = 300; // Vercel allows up to 300 seconds for Pro or 60 seconds for Hobby.

export async function GET(request: Request) {
  // Simple check for authorization to prevent random triggers
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") || "";
  
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
  
  const cronSecret = process.env.CRON_SECRET || "supersecretkey123";
  
  if (key !== cronSecret && token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await executarImportacaoDiarias();
    return NextResponse.json({ 
      success: true, 
      message: "Monthly diarias import triggered and completed successfully." 
    });
  } catch (error: any) {
    console.error("Vercel Cron error during diarias import:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "An error occurred during import." 
    }, { status: 500 });
  }
}
export async function POST(request: Request) {
  return GET(request);
}
