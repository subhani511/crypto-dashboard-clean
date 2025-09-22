// app/api/market-chart/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = `${COINGECKO_BASE}/coins/${params.id}/market_chart?vs_currency=usd&days=1`;
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
