import { RawCoin, Coin } from "./types";

/**
 * Adapter: maps RawCoin (CoinGecko) -> Coin (domain model)
 * Keeps components decoupled from API shape.
 */
export function adaptCoin(raw: RawCoin): Coin {
  return {
    id: raw.id,
    rank: raw.market_cap_rank ?? 0,
    symbol: raw.symbol,
    name: raw.name,
    image: raw.image ?? "",
    price: raw.current_price ?? 0,
    priceChange24h: raw.price_change_24h ?? 0,
    priceChangePct24h: raw.price_change_percentage_24h ?? 0,
    marketCap: raw.market_cap ?? 0,
    volume24h: raw.total_volume ?? 0,
    circulatingSupply: raw.circulating_supply ?? undefined, // 🔽 normalize null -> undefined
  };
}
