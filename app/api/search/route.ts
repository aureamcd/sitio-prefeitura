import { NextResponse } from "next/server";

import { searchPortal } from "@/lib/search";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const results = searchPortal(query);

  return NextResponse.json({
    query,
    count: results.length,
    results,
  });
}
