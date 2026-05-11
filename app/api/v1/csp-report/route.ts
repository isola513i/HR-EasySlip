import { type NextRequest, NextResponse } from "next/server";

// Receives CSP violation reports from the browser.
// Both the enforced policy and the Report-Only Trusted Types policy post here.
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    console.error("[CSP Violation]", JSON.stringify(body));
  } catch {
    // Ignore malformed or empty report bodies
  }
  return new NextResponse(null, { status: 204 });
}
