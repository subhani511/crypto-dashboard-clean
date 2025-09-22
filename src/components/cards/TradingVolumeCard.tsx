// src/components/cards/TradingVolumeCard.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type Point = {
  time: string;
  volume: number;
};

export default function TradingVolumeCard({
  coinId,
  initialVolume,
  title = "24h Trading Volume",
}: {
  coinId: string | null | undefined;
  initialVolume?: number | string;
  title?: string;
}) {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    controllerRef.current = new AbortController();
    async function load() {
      if (!coinId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/market-chart/${encodeURIComponent(coinId)}`,
          {
            signal: controllerRef.current?.signal,
            headers: { Accept: "application/json" },
          }
        );

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`Chart load failed: ${res.status} ${text}`);
        }

        const json = await res.json();

        const volumes: unknown = json?.total_volumes ?? [];
        if (!Array.isArray(volumes)) {
          throw new Error("Unexpected chart data");
        }

        const points = (volumes as [number, number][]).map(([ts, v]) => ({
          time: new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          volume: typeof v === "number" && isFinite(v) ? v : 0,
        }));

        if (mountedRef.current) {
          setData(points);
          setError(null);
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        if (
          typeof DOMException !== "undefined" &&
          err instanceof DOMException &&
          err.name === "AbortError"
        ) {
          return;
        }
        setError(err instanceof Error ? err.message : String(err));
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
  }, [coinId]);

  const displayVolume =
    initialVolume !== undefined && initialVolume !== null
      ? typeof initialVolume === "number"
        ? initialVolume
        : Number(String(initialVolume).replace(/[^0-9.-]/g, ""))
      : data.length > 0
      ? data[data.length - 1].volume
      : undefined;

  function safeNumberFormat(n: number | undefined | null, fallback = "—") {
    return typeof n === "number" && isFinite(n) ? n.toLocaleString() : fallback;
  }

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border">
      <div className="text-sm text-gray-500">{title}</div>

      <div className="mt-2 text-xl font-semibold">
        $
        {typeof displayVolume === "number"
          ? safeNumberFormat(displayVolume, "—")
          : typeof initialVolume === "string"
          ? initialVolume
          : "—"}
      </div>

      <div className="text-xs text-gray-500 mt-2">Last 24h</div>

      <div className="h-32 mt-3">
        {/* Skeleton while loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="w-full h-full rounded-md bg-gray-100 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {!loading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-xs text-red-600"
            >
              Chart unavailable
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart (fade/slide in) */}
        <AnimatePresence>
          {!loading && !error && data.length > 0 && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Tooltip
                    formatter={(val: number | string | (number | string)[]) =>
                      typeof val === "number"
                        ? val.toLocaleString()
                        : Array.isArray(val)
                        ? val.join(", ")
                        : val
                    }
                    labelFormatter={(label: string) => `${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#10b981"
                    fill="url(#volGrad)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No data */}
        <AnimatePresence>
          {!loading && !error && data.length === 0 && (
            <motion.div
              key="nodata"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-gray-400"
            >
              No chart data
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
