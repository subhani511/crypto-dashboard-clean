"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoinsMarkets, getTrending } from "@/lib/api";
import { adaptCoin } from "@/lib/coinAdapter";
import { Coin, RawCoin } from "@/lib/types"; // add CoinGeckoMarket
import HighlightsGrid from "./HighlightsGrid";

type TrendingItem = {
  id: string;
  symbol: string;
  name: string;
  thumb?: string;
  small?: string;
  image?: string;
  current_price?: number;
};

export default function HighlightsSection() {
  const marketsQ = useQuery({
    queryKey: ["highlights", "markets"],
    queryFn: () => getCoinsMarkets({ per_page: 100, vs_currency: "usd" }),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const trendingQ = useQuery({
    queryKey: ["highlights", "trending"],
    queryFn: getTrending,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const markets: Coin[] = (marketsQ.data ?? []).map(adaptCoin);

  const trending: Coin[] = (trendingQ.data ?? []).map((c: TrendingItem) =>
    adaptCoin({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.thumb || c.image || c.small || "",
      current_price: c.current_price ?? 0,
      market_cap: 0,
      total_volume: 0,
      market_cap_rank: 0,
      price_change_24h: 0,
      price_change_percentage_24h: 0,
    } as RawCoin)
  );

  const gainers = useMemo(
    () =>
      [...markets]
        .sort((a, b) => b.priceChangePct24h - a.priceChangePct24h)
        .slice(0, 8),
    [markets]
  );

  const losers = useMemo(
    () =>
      [...markets]
        .sort((a, b) => a.priceChangePct24h - b.priceChangePct24h)
        .slice(0, 8),
    [markets]
  );

  const newCoins = useMemo(() => markets.slice(-8).reverse(), [markets]);

  const mostViewed = useMemo(
    () => (trending.length ? trending.slice(0, 8) : markets.slice(0, 8)),
    [markets, trending]
  );

  const unlocks: (Coin & { extra: string })[] = [
    {
      id: "unlock-1",
      rank: 0,
      name: "BlueMove",
      symbol: "BM",
      image: "",
      price: 0,
      priceChange24h: 0,
      priceChangePct24h: 0,
      marketCap: 0,
      volume24h: 0,
      extra: "0D 1h 53m",
    },
    {
      id: "unlock-2",
      rank: 0,
      name: "Gods Unchained",
      symbol: "GODS",
      image: "",
      price: 0,
      priceChange24h: 0,
      priceChangePct24h: 0,
      marketCap: 0,
      volume24h: 0,
      extra: "0D 11h 53m",
    },
    {
      id: "unlock-3",
      rank: 0,
      name: "World Mobile Token",
      symbol: "WMT",
      image: "",
      price: 0,
      priceChange24h: 0,
      priceChangePct24h: 0,
      marketCap: 0,
      volume24h: 0,
      extra: "1D 5h",
    },
    {
      id: "unlock-4",
      rank: 0,
      name: "Cheelee",
      symbol: "CHE",
      image: "",
      price: 0,
      priceChange24h: 0,
      priceChangePct24h: 0,
      marketCap: 0,
      volume24h: 0,
      extra: "2D 12h",
    },
  ];

  // ✅ Early returns now safe (no hooks after them)
  if (marketsQ.isLoading || trendingQ.isLoading) {
    return <p className="text-gray-500">Loading highlights...</p>;
  }
  if (marketsQ.isError || trendingQ.isError) {
    return <p className="text-red-600">Error loading highlights</p>;
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Crypto Highlights
      </h2>
      <HighlightsGrid
        trending={trending}
        gainers={gainers}
        losers={losers}
        newCoins={newCoins}
        unlocks={unlocks}
        mostViewed={mostViewed}
      />
    </section>
  );
}
