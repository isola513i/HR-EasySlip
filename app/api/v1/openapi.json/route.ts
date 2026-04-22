import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/api/openapi";

export async function GET() {
  const spec = buildOpenApiDocument();
  return NextResponse.json(spec, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
