// src/components/tables/CategoriesTable.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Spinner from "@/components/ui/Spinner";

interface CoinCategory {
  id: string;
  name: string;
  market_cap: number | null;
  market_cap_change_24h: number | null;
  volume_24h: number | null;
  top_3_coins?: string[];
}

function extractErrorMessageFromJson(json: unknown, fallback: string) {
  if (!json || typeof json !== "object") return fallback;
  const rec = json as Record<string, unknown>;
  let message = fallback;
  if (typeof rec.error === "string") {
    message = rec.error;
    if (typeof rec.message === "string") {
      message += `: ${rec.message}`;
    }
    return message;
  }
  if (typeof rec.message === "string") {
    return rec.message;
  }
  return fallback;
}

export default function CategoriesTable() {
  const [categories, setCategories] = useState<CoinCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    controllerRef.current = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/categories", {
          signal: controllerRef.current?.signal,
          headers: { Accept: "application/json" },
        });

        if (!res.ok) {
          let message = `Failed to fetch categories: ${res.status}`;
          try {
            const json = await res.json().catch(() => null);
            message = extractErrorMessageFromJson(json, message);
          } catch {
            // ignore parse errors
          }
          throw new Error(message);
        }

        const data = (await res.json()) as CoinCategory[] | unknown;
        if (mountedRef.current) {
          setCategories(Array.isArray(data) ? (data as CoinCategory[]) : []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        // Type guard for AbortError
        if (
          typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    load();

    return () => {
      mountedRef.current = false;
      try {
        controllerRef.current?.abort();
      } catch {}
    };
  }, []);

  // retry helper used by Retry button
  const retryFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories", {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        let message = `Failed to fetch categories: ${res.status}`;
        const json = await res.json().catch(() => null);
        message = extractErrorMessageFromJson(json, message);
        throw new Error(message);
      }
      const d = (await res.json()) as CoinCategory[] | unknown;
      setCategories(Array.isArray(d) ? (d as CoinCategory[]) : []);
      setError(null);
    } catch (e: unknown) {
      if (
        typeof DOMException !== "undefined" &&
        e instanceof DOMException &&
        e.name === "AbortError"
      ) {
        return;
      }
      if (e instanceof Error) setError(e.message);
      else setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Categories</h3>
        {loading && <Spinner />}
      </div>

      {error && (
        <div className="text-red-600 mb-2">
          {error}
          <div>
            <button
              onClick={() => retryFetch()}
              className="ml-2 px-2 py-1 bg-white border border-gray-300 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && categories.length === 0 && !error && (
        <div className="text-gray-500">No categories available.</div>
      )}

      {!loading && categories.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-gray-700 bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Market Cap</th>
                <th className="px-4 py-2 text-right">24h Change</th>
                <th className="px-4 py-2 text-right">24h Volume</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{c.name}</td>
                  <td className="px-4 py-3 text-right">
                    {typeof c.market_cap === "number"
                      ? c.market_cap.toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {typeof c.market_cap_change_24h === "number"
                      ? `${c.market_cap_change_24h.toFixed(2)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {typeof c.volume_24h === "number"
                      ? c.volume_24h.toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
