import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    status: "ok",
    mode: "demo",
    externalServices: false,
    timestamp: new Date().toISOString(),
  });
}
