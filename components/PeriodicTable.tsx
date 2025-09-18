// components/PeriodicTable.tsx
"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { ElementCard } from "./ElementCard";
import { ElementFilter } from "./ElementFilter";
import { useElementData } from "../hooks/useElementData";
import type { Element } from "@/types/element";
import { CATEGORY_META, normalizeCat } from "@/utils/categoryMeta";

const normalize = (v: string) => v.toLowerCase().trim();

const ColorLegend = ({ cats }: { cats: string[] }) => (
  <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5" role="region" aria-label="Category color legend">
    <div className="flex flex-wrap gap-3">
      {cats.map((k) => {
        const meta = (CATEGORY_META as any)[k] ?? { label: k, bg: "bg-gray-100", text: "text-gray-900", ring: "ring-gray-200" };
        return (
          <div key={k} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${meta.bg} ${meta.text}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-current opacity-70" />
            <span className="text-sm font-medium">{meta.label ?? k}</span>
          </div>
        );
      })}
    </div>
  </div>
);

export const PeriodicTable = () => {
  const data = useElementData();

  // normalize categories on the fly
  const elements = useMemo(() => {
    return data.map((e) => ({
      ...e,
      _normCategory: normalizeCat(e.category || ""), // add a normalized field
    }));
  }, [data]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");

  // categories from *normalized* data
  const categories = useMemo(() => {
    const set = new Set<string>();
    elements.forEach((e) => {
      const k = String(e._normCategory || "");
      if (k) set.add(k);
    });
    return ["all", ...Array.from(set).sort()];
  }, [elements]);

  const deferredQuery = useDeferredValue(searchInput);
  const query = String(normalizeCat(deferredQuery));
  const isAll = String(normalizeCat(selectedCategory)) === "all";

  const visible = useMemo(() => {
    return new Set(
      elements
        .filter((el) => {
          const cat = String(el._normCategory || "");
          const matchesCategory = isAll || cat === String(normalizeCat(selectedCategory));
          if (!matchesCategory) return false;
          if (!query) return true;
          const inNumber = String(el.atomicNumber).includes(query);
          const inName = (el.name || "").toLowerCase().includes(query);
          const inSymbol = (el.symbol || "").toLowerCase().includes(query);
          return inNumber || inName || inSymbol;
        })
        .map((el) => el.symbol)
    );
  }, [elements, selectedCategory, query, isAll]);

  // helpers for layout
  const GRID_COLS = 18;
  const GRID_ROWS = 10;
  const colLabels = Array.from({ length: GRID_COLS }, (_, i) => i + 1);
  const rowLabels = [1, 2, 3, 4, 5, 6, 7, "La–Lu", "Ac–Lr"];

  const byPosition = useMemo(() => {
    const map = new Map<string, Element>();
    elements.forEach((el) => {
      const x = (el as any).xpos ?? (el as any).group ?? null;
      const y = (el as any).ypos ?? (el as any).period ?? null;
      if (!x || !y) return;
      map.set(`${x},${y}`, el);
    });
    return map;
  }, [elements]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Interactive Periodic Table</h1>
          <p className="text-sm text-gray-500">Search / filter; laid out with real period & group positions.</p>
        </div>
        <div className="text-sm text-gray-500">{visible.size} / {elements.length} elements</div>
      </div>

      <div className="grid gap-4">
        <ColorLegend cats={categories.filter((c) => c !== "all")} />

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search elements</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search: 26 or iron or Fe"
              aria-label="Search elements by atomic number, name, or symbol"
              className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M12.9 14.32a7 7 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
            </svg>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </label>

          {/* Category Filter */}
          <ElementFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />
        </div>

        {/* Column labels */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="mb-1 grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
              {colLabels.map((c) => (
                <div key={c} className="text-[10px] text-gray-500 text-center">{c}</div>
              ))}
            </div>

            {/* Main grid */}
            <div
              className="relative grid gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, minmax(48px, 1fr))`,
              }}
            >
              {/* Row labels on the left (visually via absolute sticky column, simpler: overlay) */}
              {/* Render each positioned element */}
              {Array.from(byPosition.entries()).map(([key, el]) => {
                const [x, y] = key.split(",").map(Number);
                const shown = visible.has(el.symbol);
                if (!x || !y) return null;

                return (
                  <div
                    key={el.symbol}
                    style={{ gridColumnStart: x, gridRowStart: y }}
                    className="relative"
                    title={`${el.name} (${el.symbol})`}
                  >
                    {shown ? (
                      <div className="aspect-square">
                        <ElementCard
                          atomicNumber={el.atomicNumber}
                          symbol={el.symbol}
                          name={el.name}
                          category={el.category}   // ⬅️ pass the raw dataset category
                        />
                      </div>
                    ) : (
                      // empty cell placeholder (keeps grid tidy)
                      <div className="aspect-square rounded-xl border border-transparent" />
                    )}
                  </div>
                );
              })}

              {/* Optional: tiny labels for rows (periods + f-block captions) */}
              {rowLabels.map((r, idx) => (
                <div
                  key={`rowlabel-${idx}`}
                  style={{ gridColumn: `1 / span ${GRID_COLS}`, gridRowStart: idx + 1 }}
                  aria-hidden
                  className="pointer-events-none select-none"
                >
                  <div className="absolute -left-8 mt-1 text-[10px] text-gray-500">
                    {typeof r === "number" ? `Period ${r}` : r}
                  </div>
                </div>
              ))}
            </div>

            {/* Tiny caption for f-block */}
            <div className="mt-1 text-[10px] text-gray-400">
              * Lanthanides and Actinides shown as detached rows.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};