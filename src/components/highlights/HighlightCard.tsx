// src/components/highlights/HighlightCard.tsx
"use client";

import React from "react";
import Image from "next/image";
import type { Coin } from "@/lib/types";

type Props = {
  title: string;
  items: (Coin | null | undefined)[];
  color?: "green" | "red" | "neutral";
  moreHref?: string;
  maxItems?: number;
};

function safeNumberFormat(n: number | undefined | null, fallback = "—") {
  return typeof n === "number" ? n.toLocaleString() : fallback;
}
function safePercent(n: number | undefined | null, fallback = "0.00%") {
  return typeof n === "number" ? `${n.toFixed(2)}%` : fallback;
}

export default function HighlightCard({
  title,
  items,
  color = "neutral",
  moreHref,
  maxItems = 6,
}: Props) {
  const textColor =
    color === "green"
      ? "text-green-600"
      : color === "red"
      ? "text-red-600"
      : "text-gray-700";
  const borderColor =
    color === "green"
      ? "border-green-100"
      : color === "red"
      ? "border-red-100"
      : "border-gray-100";

  const list = (items ?? []).filter(Boolean).slice(0, maxItems) as Coin[];

  return (
    <div className={`bg-white rounded-lg p-4 shadow-sm border ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {moreHref ? (
          <a href={moreHref} className="text-xs text-gray-500 hover:underline">
            View
          </a>
        ) : null}
      </div>

      {list.length === 0 ? (
        <div className="text-xs text-gray-500">No items</div>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3"
              title={`${c.name} (${c.symbol})`}
            >
              <div className="flex items-center gap-3">
                {c.image ? (
                  <div className="w-8 h-8 relative rounded-full overflow-hidden bg-gray-100">
                    <Image
                      src={c.image}
                      alt={c.name}
                      width={32}
                      height={32}
                      className="object-cover"
                      style={{ height: "auto" }}
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    {c.symbol?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{c.name}</div>
                  <div className="text-xs text-gray-500 uppercase">
                    {c.symbol}
                  </div>
                </div>
              </div>

              <div className="text-right min-w-[88px]">
                <div className={`text-sm font-medium ${textColor}`}>
                  ${safeNumberFormat(c.price)}
                </div>
                <div className="text-xs text-gray-500">
                  {safePercent(c.priceChangePct24h)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
