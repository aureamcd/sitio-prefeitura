import { runSync } from "@/scripts/sync-cidadesnanet-rss";

export async function GET() {
  try {
    await runSync();

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "erro" }, { status: 500 });
  }
}