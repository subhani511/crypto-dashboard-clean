// src/hooks/useCoins.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coin } from "@/lib/types";

export type UseCoinsParams = {
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  order?: string;
  vs_currency?: string;
  ids?: string;
  enabled?: boolean;
};

export type UseCoinsResult = {
  coins: Coin[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

/**
 * Local DTO matching the CoinGecko markets response fields we use.
 * Keeps types clear on the client without importing server-only types.
 */
interface MarketDto {
  id: string;
  symbol?: string;
  name?: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  market_cap_rank?: number | null;
  price_change_percentage_24h?: number | null;
  price_change_24h?: number | null;
  circulating_supply?: number | null;
}

/**
 * Local, client-safe mapper from CoinGecko market shape -> your Coin type.
 */
function mapMarketToCoin(m: MarketDto): Coin {
  return {
    id: m.id,
    rank: typeof m.market_cap_rank === "number" ? m.market_cap_rank : 0,
    symbol: m.symbol ?? "",
    name: m.name ?? "",
    image: m.image ?? "",
    price: typeof m.current_price === "number" ? m.current_price : 0,
    priceChange24h:
      typeof m.price_change_24h === "number" ? m.price_change_24h : 0,
    priceChangePct24h:
      typeof m.price_change_percentage_24h === "number"
        ? m.price_change_percentage_24h
        : 0,
    marketCap: typeof m.market_cap === "number" ? m.market_cap : 0,
    volume24h: typeof m.total_volume === "number" ? m.total_volume : 0,
    circulatingSupply:
      typeof m.circulating_supply === "number"
        ? m.circulating_supply
        : undefined,
  };
}

/**
 * Build query string for /api/markets from params
 */
function buildQuery(params: {
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  order?: string;
  vs_currency?: string;
  ids?: string;
}) {
  const qs = new URLSearchParams();
  if (params.vs_currency) qs.set("vs_currency", params.vs_currency);
  if (params.order) qs.set("order", params.order);
  if (params.per_page !== undefined)
    qs.set("per_page", String(params.per_page));
  if (params.page !== undefined) qs.set("page", String(params.page));
  if (params.sparkline !== undefined)
    qs.set("sparkline", String(params.sparkline));
  // keep same param name as CoinGecko: price_change_percentage=24h
  qs.set("price_change_percentage", "24h");
  if (params.ids) qs.set("ids", params.ids);
  return qs.toString();
}

export function useCoins(params: UseCoinsParams = {}): UseCoinsResult {
  const {
    per_page = 100,
    page = 1,
    sparkline = false,
    order = "market_cap_desc",
    vs_currency = "usd",
    ids,
    enabled = true,
  } = params;

  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // keep stable ref of params to allow refetch() to use latest values
  const paramsRef = useRef({
    per_page,
    page,
    sparkline,
    order,
    vs_currency,
    ids,
    enabled,
  });
  paramsRef.current = {
    per_page,
    page,
    sparkline,
    order,
    vs_currency,
    ids,
    enabled,
  };

  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!paramsRef.current.enabled) return;

    // abort any in-flight request for this hook
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch {
        /* ignore */
      }
    }
    const ac = new AbortController();
    controllerRef.current = ac;

    setLoading(true);
    setError(null);

    try {
      const query = buildQuery({
        per_page: paramsRef.current.per_page,
        page: paramsRef.current.page,
        sparkline: paramsRef.current.sparkline,
        order: paramsRef.current.order,
        vs_currency: paramsRef.current.vs_currency,
        ids: paramsRef.current.ids,
      });
      const url = `/api/markets${query ? `?${query}` : ""}`;

      const res = await fetch(url, {
        signal: ac.signal,
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        // surface server-proxy error message if present (safely)
        let errText = `Request failed: ${res.status}`;
        try {
          const json = (await res.json()) as unknown;
          if (json && typeof json === "object") {
            const record = json as Record<string, unknown>;
            if (typeof record.error === "string") {
              errText = record.error;
              if (typeof record.message === "string") {
                errText += `: ${record.message}`;
              }
            }
          }
        } catch {
          // ignore parse errors
        }
        throw new Error(errText);
      }

      const data = (await res.json()) as MarketDto[];
      const mapped: Coin[] = Array.isArray(data)
        ? data.map(mapMarketToCoin)
        : [];
      if (mountedRef.current) {
        setCoins(mapped);
        setError(null);
      }
    } catch (err) {
      if (!mountedRef.current) return;

      // Type guard for DOMException (AbortError)
      if (
        typeof DOMException !== "undefined" &&
        err instanceof DOMException &&
        err.name === "AbortError"
      ) {
        // request aborted — ignore
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Only auto-load if enabled
    if (enabled) {
      load();
    }

    return () => {
      mountedRef.current = false;
      // abort any in-flight fetch when unmounting
      if (controllerRef.current) {
        try {
          controllerRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
    // Intentionally not depending on `load` to avoid stale callback issues; `paramsRef` keeps latest values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, per_page, page, sparkline, order, vs_currency, ids]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  return { coins, loading, error, refetch };
}

export default useCoins;
