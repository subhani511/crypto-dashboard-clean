// src/app/api/market-chart/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";

// RouteContext is a globally available helper in Next for typing route contexts.
// Use the route literal that matches your route file path.
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/market-chart/[id]">
) {
  try {
    // ctx.params may be async — await it to be safe and match types
    const { id: rawId } = await ctx.params;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id parameter" },
        { status: 400 }
      );
    }

    const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
    const url = `${COINGECKO_BASE}/coins/${encodeURIComponent(
      id
    )}/market_chart?vs_currency=usd&days=1`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: "CoinGecko error", status: res.status, details: text },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/market-chart error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
