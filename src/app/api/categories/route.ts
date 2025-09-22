// app/api/categories/route.ts
import { NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

let cache: { data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30s

export async function GET() {
  // ✅ removed request
  const now = Date.now();

  if (cache && now - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const url = `${COINGECKO_BASE}/coins/categories`;
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
    cache = { data, timestamp: now };

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
