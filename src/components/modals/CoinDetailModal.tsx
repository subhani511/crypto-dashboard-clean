// src/components/modals/CoinDetailModal.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Coin } from "@/lib/types";

type Props = {
  coin: Coin | null;
  onClose: () => void;
};

export default function CoinDetailModal({ coin, onClose }: Props) {
  if (!coin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-gray-900 text-white p-6 rounded-lg w-full max-w-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Image
              src={coin.image}
              alt={coin.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="text-xl font-bold">{coin.name}</h3>
              <p className="text-sm text-gray-400">{coin.symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close details"
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400">Price</div>
            <div className="font-medium">${coin.price.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">24h</div>
            <div
              className={`font-medium ${
                coin.priceChangePct24h >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {coin.priceChangePct24h.toFixed(2)}% ($
              {coin.priceChange24h.toFixed(2)})
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400">Market Cap</div>
            <div className="font-medium">
              ${coin.marketCap.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-400">24h Volume</div>
            <div className="font-medium">
              ${coin.volume24h.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
