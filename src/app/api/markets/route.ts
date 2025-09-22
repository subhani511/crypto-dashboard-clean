// app/api/markets/route.ts
import { NextResponse } from "next/server";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

// simple in-memory cache (per server instance)
let cache: { key: string; data: unknown; timestamp: number } | null = null;
const CACHE_TTL = 30_000; // 30 seconds

export async function GET(request: Request) {
  const now = Date.now();
  const incoming = new URL(request.url);
  const search = incoming.search || "";

  const cacheKey = search;

  // Serve from cache if available and fresh
  if (cache && cache.key === cacheKey && now - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const url = `${COINGECKO_BASE}/coins/markets${search}`;
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

    // Save to cache
    cache = { key: cacheKey, data, timestamp: now };

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("GET /api/markets error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: String(err) },
      { status: 500 }
    );
  }
}
