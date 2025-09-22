// src/components/tables/CoinsTable.tsx
"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import useCoins from "@/hooks/useCoins";
import { Coin } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";
import SkeletonRow from "@/components/ui/SkeletonRow";
import CoinDetailModal from "@/components/modals/CoinDetailModal";

type SortKey =
  | "price"
  | "priceChangePct24h"
  | "marketCap"
  | "volume24h"
  | "none";

// ✅ Safe helpers
function safeNumberFormat(n: number | undefined | null, fallback = "—") {
  return typeof n === "number" ? n.toLocaleString() : fallback;
}

function safePercent(n: number | undefined | null, fallback = "0.00%") {
  return typeof n === "number" ? `${n.toFixed(2)}%` : fallback;
}

export default function CoinsTable({
  coins: providedCoins,
  disablePagination = false,
}: {
  coins?: Coin[];
  disablePagination?: boolean;
}) {
  const perPageDefault = 20;
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("none");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // useCoins returns { coins, loading, error, refetch }
  const {
    coins: fetchedCoins,
    loading,
    error,
    refetch,
  } = useCoins({
    per_page: perPageDefault,
    page,
    enabled: !providedCoins, // don’t fetch if data passed in
  });

  const [selected, setSelected] = useState<Coin | null>(null);

  // helper to get numeric value for sorting keys
  const getSortValue = (c: Coin, key: Exclude<SortKey, "none">) => {
    switch (key) {
      case "price":
        return c.price ?? 0;
      case "priceChangePct24h":
        return c.priceChangePct24h ?? 0;
      case "marketCap":
        return c.marketCap ?? 0;
      case "volume24h":
        return c.volume24h ?? 0;
      default:
        return 0;
    }
  };

  // local filtered + sorted list
  const flatCoins = useMemo(() => {
    // move the logical expression inside the memo so deps are stable
    const coinsLocal = providedCoins ?? fetchedCoins ?? [];

    const filtered = search
      ? coinsLocal.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.symbol.toLowerCase().includes(search.toLowerCase())
        )
      : coinsLocal;

    if (sortBy !== "none") {
      const key = sortBy as Exclude<SortKey, "none">;
      return filtered.slice().sort((a: Coin, b: Coin) => {
        const av = getSortValue(a, key);
        const bv = getSortValue(b, key);
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }

    return filtered;
  }, [providedCoins, fetchedCoins, search, sortBy, sortDir]); // depend on raw sources, not a logical expression

  const loadMore = () => {
    if (!disablePagination) setPage((p) => p + 1);
  };

  const resetFilters = () => {
    setSearch("");
    setSortBy("none");
    setSortDir("desc");
    setPage(1);
    refetch();
  };

  return (
    <div className="card p-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coin name or symbol..."
            className="px-3 py-2 rounded-md bg-white border border-gray-300 placeholder-gray-400 text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            onClick={resetFilters}
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort:</span>
          {[
            { key: "price", label: "Price" },
            { key: "priceChangePct24h", label: "24h" },
            { key: "marketCap", label: "Market Cap" },
            { key: "volume24h", label: "Volume" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => {
                setSortBy(btn.key as SortKey);
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
              }}
              className="px-2 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm text-sm"
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={() => {
              setSortBy("none");
              setSortDir("desc");
            }}
            className="px-2 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 text-sm rounded-lg shadow-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="px-4 py-2 border-b border-gray-200 text-left w-12">
                #
              </th>
              <th className="px-4 py-2 border-b border-gray-200 text-left">
                Coin
              </th>
              <th className="px-4 py-2 border-b border-gray-200 text-right">
                Price
              </th>
              <th className="px-4 py-2 border-b border-gray-200 text-right">
                24h
              </th>
              <th className="px-4 py-2 border-b border-gray-200 text-right">
                Market Cap
              </th>
              <th className="px-4 py-2 border-b border-gray-200 text-right">
                24h Volume
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white text-gray-900">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}

            {!loading && flatCoins.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No coins found. Try a different search or reset filters.
                </td>
              </tr>
            )}

            {!loading &&
              flatCoins.map((coin) => (
                <tr
                  key={coin.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setSelected(coin)}
                >
                  <td className="px-4 py-2">{coin.rank}</td>
                  <td className="px-4 py-2 flex items-center gap-3">
                    <div className="w-6 h-6 relative">
                      {coin.image ? (
                        <Image
                          src={coin.image}
                          alt={coin.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{coin.name}</div>
                      <div className="text-xs text-gray-500 uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${safeNumberFormat(coin.price)}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      (coin.priceChangePct24h ?? 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    <div>{safePercent(coin.priceChangePct24h)}</div>
                    <div className="text-xs text-gray-500">
                      ${safeNumberFormat(coin.priceChange24h)}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${safeNumberFormat(coin.marketCap)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    ${safeNumberFormat(coin.volume24h)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Load more / loader / error */}
      {!disablePagination && (
        <div className="mt-4 flex items-center gap-3">
          {loading && <Spinner />}

          {error && (
            <div className="flex items-center gap-2">
              <div className="text-red-600">Failed to load data.</div>
              <button
                onClick={() => refetch()}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="flex items-center gap-2">
              <button
                onClick={loadMore}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Load more
              </button>
              <div className="text-sm text-gray-500">Page: {page}</div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <CoinDetailModal coin={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
