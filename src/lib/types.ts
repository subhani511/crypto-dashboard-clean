// src/lib/types.ts
export type RawCoin = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  market_cap_rank?: number | null;
  price_change_24h?: number | null;
  price_change_percentage_24h?: number | null;
  circulating_supply?: number;
};

export type Coin = {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  image: string; // internal shape keeps image as string, mapper should supply fallback
  price: number;
  priceChange24h: number;
  priceChangePct24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply?: number;
};
