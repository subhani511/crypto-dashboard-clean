// app/page.tsx 
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import FiltersTabs, { TabKey } from "@/components/FiltersTabs";
import HighlightsGrid from "@/components/highlights/HighlightsGrid";
import CoinsTable from "@/components/tables/CoinsTable";
import CategoriesTable from "@/components/tables/CategoriesTable";
import { getAllHighlightsPayload } from "@/lib/api";
import type { Coin } from "@/lib/types";
import TradingVolumeCard from "@/components/cards/TradingVolumeCard";

// ✅ Safe helpers to avoid runtime errors
function safeNumberFormat(n: number | undefined | null, fallback = "—") {
  return typeof n === "number" ? n.toLocaleString() : fallback;
}

function safePercent(n: number | undefined | null, fallback = "0.00%") {
  return typeof n === "number" ? `${n.toFixed(2)}%` : fallback;
}

type HighlightsPayload = {
  trending: Coin[];
  gainers: Coin[];
  losers: Coin[];
  newCoins: Coin[];
  unlocks: (Coin & { extra: string })[];
  mostViewed: Coin[];
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return "Unknown error";
  }
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("All");

  const payloadRef = useRef<HighlightsPayload | null>(null);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [highlightsError, setHighlightsError] = useState<string | null>(null);
  const [, setVersion] = useState(0); // trigger re-render when payload loaded

  useEffect(() => {
    let cancelled = false;

    async function loadHighlights() {
      if (payloadRef.current) return; // already cached

      setHighlightsError(null);
      setLoadingHighlights(true);
      try {
        const payload = await getAllHighlightsPayload();
        if (cancelled) return;
        payloadRef.current = payload;
        setVersion((v) => v + 1);
      } catch (err) {
        if (cancelled) return;
        setHighlightsError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoadingHighlights(false);
      }
    }

    if (activeTab === "Highlights" || activeTab === "All") {
      loadHighlights();
    }

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const payload: HighlightsPayload = payloadRef.current ?? {
    trending: [],
    gainers: [],
    losers: [],
    newCoins: [],
    unlocks: [],
    mostViewed: [],
  };

  return (
    <main className="bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Top header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Cryptocurrency Prices by Market Cap
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              The global cryptocurrency market cap today is{" "}
              <span className="font-semibold">$4.1T</span>, a{" "}
              <span className="text-green-600 font-semibold">+1.2%</span> change
              in the last 24 hours.
            </p>
          </div>
        </div>

        {/* Hero row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-5 shadow-sm border">
            <div className="text-sm text-gray-500">Market Cap</div>
            <div className="mt-2 text-xl font-semibold">
              $
              {safeNumberFormat(
                payload.trending?.[0]?.marketCap,
                "4,100,825,920,482"
              )}
            </div>
            <div className="text-xs text-green-600 mt-2">+1.2% (24h)</div>
          </div>

          <TradingVolumeCard
            coinId={payload.trending?.[0]?.id}
            // pass initialVolume so the server-rendered number is consistent until client fetch finishes
            initialVolume={payload.trending?.[0]?.volume24h ?? undefined}
          />

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">🔥 Trending</div>
              <a
                className="text-xs text-gray-500 hover:underline"
                href="/highlights/trending"
              >
                View more
              </a>
            </div>

            <ul className="space-y-3">
              {payload.trending && payload.trending.length > 0 ? (
                payload.trending.slice(0, 3).map((c) => (
                  <li key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {c.image ? (
                        <Image
                          src={c.image}
                          alt={c.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          {c.symbol?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-xs text-gray-500 uppercase">
                          {c.symbol}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-sm">
                      <div className="font-medium">
                        ${safeNumberFormat(c.price, "—")}
                      </div>
                      <div
                        className={`text-xs ${
                          (c.priceChangePct24h ?? 0) >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {safePercent(c.priceChangePct24h)}
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-500">No trending data</li>
              )}
            </ul>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <FiltersTabs
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                key: "All",
                label: "All",
                content: (
                  <>
                    {/* Compact preview */}
                    <div className="mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(payloadRef.current &&
                        payload.trending?.slice(0, 3).length
                          ? payload.trending.slice(0, 3)
                          : Array.from({ length: 3 }).map(() => null)
                        ).map((c, i) =>
                          c ? (
                            <div
                              key={c.id}
                              className="bg-white rounded-lg p-3 shadow-sm border flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                {c.image ? (
                                  <Image
                                    src={c.image}
                                    alt={c.name}
                                    width={36}
                                    height={36}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gray-100" />
                                )}
                                <div>
                                  <div className="text-sm font-medium">
                                    {c.name}
                                  </div>
                                  <div className="text-xs text-gray-500 uppercase">
                                    {c.symbol}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div className="font-semibold">
                                  ${safeNumberFormat(c.price, "—")}
                                </div>
                                <div
                                  className={`text-xs ${
                                    (c.priceChangePct24h ?? 0) >= 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {safePercent(c.priceChangePct24h)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={i}
                              className="p-4 bg-gray-100 rounded animate-pulse h-20"
                            />
                          )
                        )}
                      </div>
                    </div>

                    <CoinsTable />
                  </>
                ),
              },
              {
                key: "Highlights",
                label: "Highlights",
                content: (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Highlights</h2>
                      <div className="text-sm text-gray-500">
                        {loadingHighlights ? (
                          "Loading..."
                        ) : highlightsError ? (
                          <span className="text-red-500">
                            {highlightsError}
                          </span>
                        ) : (
                          "Live"
                        )}
                      </div>
                    </div>

                    {loadingHighlights && !payloadRef.current ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="p-4 rounded bg-gray-100 animate-pulse h-28"
                          />
                        ))}
                      </div>
                    ) : (
                      <HighlightsGrid
                        trending={payload.trending}
                        gainers={payload.gainers}
                        losers={payload.losers}
                        newCoins={payload.newCoins}
                        unlocks={payload.unlocks}
                        mostViewed={payload.mostViewed}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: "Categories",
                label: "Categories",
                content: <CategoriesTable />,
              },
              {
                key: "Trending",
                label: "Trending",
                content: (
                  <CoinsTable coins={payload.trending} disablePagination />
                ),
              },
              {
                key: "Gainers",
                label: "Gainers",
                content: (
                  <CoinsTable coins={payload.gainers} disablePagination />
                ),
              },
              {
                key: "Losers",
                label: "Losers",
                content: (
                  <CoinsTable coins={payload.losers} disablePagination />
                ),
              },
            ]}
          />
        </div>
      </div>
    </main>
  );
}
