// src/lib/api.ts
import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { Coin } from "./types";

/**
 * IMPORTANT: this module is server-only.
 * Throw early during development if imported on the client to avoid confusing CORS/errors.
 */
// if (typeof window !== "undefined") {
//   throw new Error(
//     "src/lib/api.ts is server-only. Do not import it in client components/hooks."
//   );
// }

const CG = axios.create({
  baseURL: "https://api.coingecko.com/api/v3",
  timeout: 10000,
});

/* ---- Raw CoinGecko response shapes (only fields we use) ---- */
export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  market_cap_rank?: number | null;
  price_change_percentage_24h?: number | null;
  price_change_24h?: number | null;
  circulating_supply?: number | null;
}

export interface CoinGeckoTrendingItem {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank?: number | null;
  thumb?: string;
  small?: string;
  large?: string;
}
interface TrendingWrapper {
  item: CoinGeckoTrendingItem;
}
interface TrendingResponse {
  coins: TrendingWrapper[];
}

export interface CoinListItem {
  id: string;
  symbol: string;
  name: string;
}

/* ---- Categories ---- */
export interface CoinCategory {
  id: string;
  name: string;
  market_cap: number | null;
  market_cap_change_24h: number | null;
  volume_24h: number | null;
  top_3_coins?: string[];
}

/* ---------------------------
   Retry / backoff helper
   --------------------------- */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * axiosGetWithRetry
 * - path: path relative to baseURL (e.g. "/coins/markets")
 * - config: axios request config (params, headers, etc.)
 * - maxRetries: number of retries on 429 and 5xx
 *
 * Returns response.data typed as T.
 */
async function axiosGetWithRetry<T = unknown>(
  path: string,
  config: AxiosRequestConfig = {},
  maxRetries = 3
): Promise<T> {
  let attempt = 0;
  let lastErr: unknown = null;

  while (attempt <= maxRetries) {
    try {
      const resp = await CG.get<T>(path, config);
      return resp.data;
    } catch (err: unknown) {
      lastErr = err;

      // Extract useful fields safely
      let status: number | undefined = undefined;
      let headers: Record<string, unknown> | undefined = undefined;
      let data: unknown = undefined;
      let message: string | undefined = undefined;

      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError;
        status = axiosErr.response?.status;
        headers = (axiosErr.response?.headers ?? undefined) as
          | Record<string, unknown>
          | undefined;
        data = axiosErr.response?.data;
        message = axiosErr.message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      const isRetryable =
        status === 429 ||
        (typeof status === "number" && status >= 500 && status < 600);

      // If not retryable, log details and throw
      if (!isRetryable) {
        console.error(`Non-retryable Axios error GET ${path}`, {
          attempt,
          status,
          data,
          headers,
          message,
        });
        throw err;
      }

      // Retryable: compute backoff. Use Retry-After header if present.
      let wait = 500 * Math.pow(2, attempt); // 500ms, 1s, 2s, ...
      try {
        const raRaw = headers
          ? headers["retry-after"] ?? headers["Retry-After"]
          : undefined;
        const raNum = raRaw !== undefined ? Number(String(raRaw)) : NaN;
        if (!Number.isNaN(raNum) && raNum > 0) {
          wait = Math.max(wait, raNum * 1000);
        }
      } catch {
        // ignore header parse errors
      }

      console.warn(
        `Retryable error GET ${path} (status=${status}). attempt=${attempt}. waiting ${wait}ms`
      );
      await sleep(wait);
      attempt++;
    }
  }

  console.error(`Failed GET ${path} after ${maxRetries} retries`, lastErr);
  throw lastErr;
}

/* ---- Core fetching helpers (now using axiosGetWithRetry) ---- */
export async function getCategories(): Promise<CoinCategory[]> {
  try {
    const data = await axiosGetWithRetry<CoinCategory[]>("/coins/categories");
    return (data as CoinCategory[]) ?? [];
  } catch (err: unknown) {
    // Safe logging without any casts
    let status: number | undefined = undefined;
    let respData: unknown = undefined;
    let message: string | undefined = undefined;
    if (axios.isAxiosError(err)) {
      status = err.response?.status;
      respData = err.response?.data;
      message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    console.error("Failed to fetch categories (detailed):", {
      message,
      status,
      data: respData,
    });
    throw err;
  }
}

export async function getCoinsMarkets(params: {
  per_page?: number;
  page?: number;
  sparkline?: boolean;
  order?: string;
  vs_currency?: string;
  ids?: string;
}): Promise<CoinGeckoMarket[]> {
  const {
    per_page = 100,
    page = 1,
    sparkline = false,
    order = "market_cap_desc",
    vs_currency = "usd",
    ids,
  } = params;
  try {
    const data = await axiosGetWithRetry<CoinGeckoMarket[]>("/coins/markets", {
      params: {
        vs_currency,
        order,
        per_page,
        page,
        sparkline,
        price_change_percentage: "24h",
        ids,
      },
    });
    return (data as CoinGeckoMarket[]) ?? [];
  } catch (err: unknown) {
    let status: number | undefined = undefined;
    let respData: unknown = undefined;
    let message: string | undefined = undefined;
    if (axios.isAxiosError(err)) {
      status = err.response?.status;
      respData = err.response?.data;
      message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    console.error("Failed to fetch markets (detailed):", {
      message,
      status,
      data: respData,
    });
    throw err;
  }
}

export async function getTrending(): Promise<CoinGeckoTrendingItem[]> {
  try {
    const data = await axiosGetWithRetry<TrendingResponse>("/search/trending");
    const coins = (data?.coins ?? []) as TrendingWrapper[];
    return coins.map((c) => c.item);
  } catch (err: unknown) {
    let status: number | undefined = undefined;
    let respData: unknown = undefined;
    let message: string | undefined = undefined;
    if (axios.isAxiosError(err)) {
      status = err.response?.status;
      respData = err.response?.data;
      message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    console.error("Failed to fetch trending (detailed):", {
      message,
      status,
      data: respData,
    });
    throw err;
  }
}

export async function getCoinsList(): Promise<CoinListItem[]> {
  try {
    const data = await axiosGetWithRetry<CoinListItem[]>("/coins/list");
    return (data as CoinListItem[]) ?? [];
  } catch (err: unknown) {
    let status: number | undefined = undefined;
    let respData: unknown = undefined;
    let message: string | undefined = undefined;
    if (axios.isAxiosError(err)) {
      status = err.response?.status;
      respData = err.response?.data;
      message = err.message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    console.error("Failed to fetch coins list (detailed):", {
      message,
      status,
      data: respData,
    });
    throw err;
  }
}

/* ---- Mapping to your internal `Coin` shape (safe fallbacks) ---- */
export function mapMarketToCoin(m: CoinGeckoMarket): Coin {
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

/* ---- High-level helpers used by Highlights ---- */
export async function getTrendingCoins(): Promise<Coin[]> {
  const trending = await getTrending();
  const ids = trending
    .map((t) => t.id)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];
  const markets = await getCoinsMarkets({ ids, per_page: 250 });
  return markets.map(mapMarketToCoin);
}

export async function getGainers(per_page = 100): Promise<Coin[]> {
  const markets = await getCoinsMarkets({ per_page, page: 1 });
  const sorted = [...markets].sort(
    (a, b) =>
      (b.price_change_percentage_24h ?? 0) -
      (a.price_change_percentage_24h ?? 0)
  );
  return sorted.map(mapMarketToCoin);
}

export async function getLosers(per_page = 100): Promise<Coin[]> {
  const markets = await getCoinsMarkets({ per_page, page: 1 });
  const sorted = [...markets].sort(
    (a, b) =>
      (a.price_change_percentage_24h ?? 0) -
      (b.price_change_percentage_24h ?? 0)
  );
  return sorted.map(mapMarketToCoin);
}

export async function getNewCoins(count = 6): Promise<Coin[]> {
  const list = await getCoinsList();
  if (!list || list.length === 0) return [];
  const candidates = list
    .slice(-Math.max(20, count * 4))
    .map((c) => c.id)
    .filter(Boolean)
    .join(",");
  if (!candidates) return [];
  const markets = await getCoinsMarkets({ ids: candidates, per_page: 250 });
  return markets.map(mapMarketToCoin).slice(0, count);
}

export async function getInvalidTokens(
  per_page = 250,
  count = 6
): Promise<Coin[]> {
  const markets = await getCoinsMarkets({ per_page, page: 1 });
  const invalid = markets.filter((m) => {
    const noImage = !m.image || m.image.trim() === "";
    const badPrice =
      typeof m.current_price !== "number" ||
      !isFinite(m.current_price) ||
      m.current_price <= 0;
    return noImage || badPrice;
  });
  return invalid.slice(0, count).map(mapMarketToCoin);
}

export async function getMostViewed(count = 6): Promise<Coin[]> {
  // CoinGecko free API doesn't give view counts; use trending as a proxy
  const trending = await getTrending();
  const ids = trending
    .map((t) => t.id)
    .filter(Boolean)
    .join(",");
  if (!ids) return [];
  const markets = await getCoinsMarkets({ ids, per_page: 250 });
  return markets.map(mapMarketToCoin).slice(0, count);
}

export async function getUnlocks(
  per_page = 250,
  count = 6
): Promise<(Coin & { extra: string })[]> {
  const invalid = await getInvalidTokens(per_page, count);
  return invalid.slice(0, count).map((c) => {
    const reasons: string[] = [];
    if (!c.image) reasons.push("missing image");
    if (!(c.price > 0)) reasons.push("invalid price");
    return { ...c, extra: reasons.length ? reasons.join(", ") : "data issue" };
  });
}

/**
 * Fetch all highlights payload in parallel and return an object matching your HighlightsGrid props.
 */
export async function getAllHighlightsPayload(): Promise<{
  trending: Coin[];
  gainers: Coin[];
  losers: Coin[];
  newCoins: Coin[];
  unlocks: (Coin & { extra: string })[];
  mostViewed: Coin[];
}> {
  const [trending, gainers, losers, newCoins, unlocks, mostViewed] =
    await Promise.all([
      getTrendingCoins().catch(() => []),
      getGainers(12).catch(() => []),
      getLosers(12).catch(() => []),
      getNewCoins(6).catch(() => []),
      getUnlocks(250, 6).catch(() => []),
      getMostViewed(6).catch(() => []),
    ]);

  return { trending, gainers, losers, newCoins, unlocks, mostViewed };
}
