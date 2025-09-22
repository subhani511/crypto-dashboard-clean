"use client";

import React, { KeyboardEvent, useCallback, useRef } from "react";

export type TabKey =
  | "All"
  | "Highlights"
  | "Categories"
  | "Trending"
  | "Gainers"
  | "Losers";

type TabDef = {
  key: TabKey;
  label: string;
  content: React.ReactNode;
};

type Props = {
  tabs: TabDef[];
  active: TabKey;
  onChange: (tab: TabKey) => void;
  className?: string;
};

export default function FiltersTabs({
  tabs,
  active,
  onChange,
  className = "",
}: Props) {
  // typed as an array of nullable HTMLButtonElement
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusByIndex = useCallback((i: number) => {
    const btn = buttonRefs.current[i];
    if (btn) btn.focus();
  }, []);

  const handleKey = (
    e: KeyboardEvent<HTMLButtonElement>,
    idx: number,
    tab: TabKey
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(tab);
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (idx + 1) % tabs.length;
      focusByIndex(next);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (idx - 1 + tabs.length) % tabs.length;
      focusByIndex(prev);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusByIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusByIndex(tabs.length - 1);
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label="Dashboard tabs"
        aria-orientation="horizontal"
        className="flex gap-3 flex-wrap"
      >
        {tabs.map((t, idx) => {
          const id = `tab-${t.key}`;
          const panelId = `panel-${t.key}`;
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              id={id}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(t.key)}
              onKeyDown={(e) => handleKey(e, idx, t.key)}
              className={[
                "appearance-none",
                "rounded-full",
                "px-3",
                "py-1.5",
                "text-sm",
                "font-semibold",
                "focus:outline-none",
                "focus:ring-2",
                "focus:ring-offset-1",
                isActive
                  ? "bg-green-50 border border-green-100 text-green-700 shadow-sm"
                  : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => {
        const id = `tab-${t.key}`;
        const panelId = `panel-${t.key}`;
        const isActive = t.key === active;
        return (
          <div
            key={t.key}
            id={panelId}
            role="tabpanel"
            aria-labelledby={id}
            hidden={!isActive}
            tabIndex={0}
            className="mt-4"
          >
            {isActive && t.content}
          </div>
        );
      })}
    </div>
  );
}
