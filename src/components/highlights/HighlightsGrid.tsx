// src/components/highlights/HighlightsGrid.tsx
"use client";

import React from "react";
import type { Coin } from "@/lib/types";
import HighlightCard from "./HighlightCard";

type HighlightsGridProps = {
  trending: Coin[];
  gainers: Coin[];
  losers: Coin[];
  newCoins: Coin[];
  unlocks: (Coin & { extra: string })[];
  mostViewed: Coin[];
  className?: string;
};

export default function HighlightsGrid({
  trending,
  gainers,
  losers,
  newCoins,
  unlocks,
  mostViewed,
  className = "",
}: HighlightsGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      <HighlightCard
        title="🔥 Trending Coins"
        items={trending}
        moreHref="/highlights/trending"
      />
      <HighlightCard
        title="🚀 Top Gainers"
        items={gainers}
        color="green"
        moreHref="/highlights/gainers"
      />
      <HighlightCard
        title="📉 Top Losers"
        items={losers}
        color="red"
        moreHref="/highlights/losers"
      />
      <HighlightCard
        title="✨ New Coins"
        items={newCoins}
        moreHref="/highlights/new"
      />
      <HighlightCard
        title="🔓 Incoming Token Unlocks"
        items={unlocks}
        moreHref="/highlights/unlocks"
      />
      <HighlightCard
        title="👁️ Most Viewed"
        items={mostViewed}
        moreHref="/highlights/most-viewed"
      />
    </div>
  );
}
