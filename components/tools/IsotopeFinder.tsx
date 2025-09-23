"use client";

import { useEffect, useMemo, useState } from "react";
import { elements as elementList } from "@/utils/elementsData";
import { CATEGORY_META, normalizeCat } from "@/utils/categoryMeta";

type IsoModule = typeof import("all-isotopes");

// name/symbol helpers
const NAME_TO_SYMBOL = new Map(elementList.map((e) => [e.name.toLowerCase(), e.symbol]));
const SYMBOL_SET = new Set(elementList.map((e) => e.symbol));
// symbol → category (normalized)
const SYMBOL_TO_CATEGORY = new Map(
  elementList.map((e) => [e.symbol, normalizeCat(e.category)])
);

function normalize(q: string) {
  return q.replace(/\s+/g, " ").trim();
}

// Parse queries like: "C-14", "14C", "Carbon-14", "O 18", "U-235", "14"
function parseQuery(raw: string): { symbol?: string; mass?: number } {
  const q = normalize(raw);
  if (!q) return {};

  let m = q.match(/^([A-Za-z]+)\s*[- ]\s*(\d{1,3})$/);
  if (m) {
    const left = m[1];
    const n = Number(m[2]);
    const sym = SYMBOL_SET.has(left) ? left : NAME_TO_SYMBOL.get(left.toLowerCase());
    return { symbol: sym, mass: Number.isFinite(n) ? n : undefined };
  }

  m = q.match(/^(\d{1,3})\s*([A-Za-z]{1,2})$/);
  if (m) {
    const n = Number(m[1]);
    const sym = m[2];
    return { symbol: SYMBOL_SET.has(sym) ? sym : undefined, mass: n };
  }

  if (/^\d{1,3}$/.test(q)) return { mass: Number(q) };

  if (/^[A-Za-z]+$/.test(q)) {
    const sym = SYMBOL_SET.has(q) ? q : NAME_TO_SYMBOL.get(q.toLowerCase());
    return { symbol: sym };
  }

  m = q.match(/([A-Za-z]{1,2})\s*[- ]\s*(\d{1,3})/);
  if (m) {
    const sym = SYMBOL_SET.has(m[1]) ? m[1] : NAME_TO_SYMBOL.get(m[1].toLowerCase());
    const n = Number(m[2]);
    return { symbol: sym, mass: Number.isFinite(n) ? n : undefined };
  }

  return {};
}

function pct(x?: number | null) {
  if (x === null || x === undefined) return "—";
  return (x * 100).toFixed(4) + "%";
}

function abundanceWidth(x?: number | null) {
  if (x === null || x === undefined) return 0;
  const w = Math.max(0, Math.min(100, x * 100));
  return w;
}

// small reusable UI bits
function CategoryPill({ symbol }: { symbol?: string }) {
  if (!symbol) return null;
  const catKey = SYMBOL_TO_CATEGORY.get(symbol) as keyof typeof CATEGORY_META | undefined;
  const meta = (catKey && CATEGORY_META[catKey]) || { bg: "bg-gray-100", text: "text-gray-900" };
  const label = (catKey && CATEGORY_META[catKey]?.label) || "Unknown";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.bg} ${meta.text}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function StableBadge({ stable }: { stable: boolean }) {
  return stable ? (
    <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[11px] font-medium">
      Stable
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[11px] font-medium">
      Unstable
    </span>
  );
}

function NuclideCard({
  item,
  symbol,
}: {
  item: any;
  symbol?: string;
}) {
  const catKey = (symbol && SYMBOL_TO_CATEGORY.get(symbol)) as keyof typeof CATEGORY_META | undefined;
  const meta = (catKey && CATEGORY_META[catKey]) || { bg: "bg-gray-50", text: "text-gray-900" };
  const stable = Boolean(item.abundance && item.abundance > 0); // heuristic when stability flag not present
  const w = abundanceWidth(item.abundance);

  return (
    <li
      key={item.nuclide}
      className={`rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition bg-white`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className={`rounded-md px-2 py-1 text-sm font-semibold ${meta.bg} ${meta.text}`}>
              {item.nuclide}
            </div>
            <StableBadge stable={stable} />
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Mass: {item.mass ?? "—"} • Abundance: {pct(item.abundance)}
          </div>
          {symbol && (
            <div className="mt-1">
              <CategoryPill symbol={symbol} />
            </div>
          )}
        </div>
      </div>

      {/* tiny abundance bar */}
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${w}%` }}
          aria-hidden
        />
      </div>
    </li>
  );
}

export function IsotopeFinder() {
  const [query, setQuery] = useState("");
  const [iso, setIso] = useState<IsoModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import("all-isotopes")
      .then((m) => alive && setIso(m))
      .catch(() => alive && setError("Failed to load isotopes dataset."));
    return () => { alive = false; };
  }, []);

  const { symbol, mass } = useMemo(() => parseQuery(query), [query]);

  const results = useMemo(() => {
    if (!iso) return null;

    if (symbol && typeof mass === "number") {
      const info =
        (iso.elements as Record<string, any>)[symbol] ??
        iso.getInfoByElement?.(symbol);
      if (!info) return { type: "exact", items: [] as any[] };

      const items = (info.isotopes || []).filter((i: any) => i.mass_number === mass);
      return { type: "exact", items };
    }

    if (symbol) {
      const cat =
        iso.categorizeByElement?.(symbol) ??
        iso.getInfoByElement?.(symbol);
      if (!cat) return { type: "byElement", stable: [], unstable: [] as any[] };

      if (!("stable" in cat) || !("unstable" in cat)) {
        const isoList = (cat as any).isotopes || [];
        return {
          type: "byElement",
          stable: isoList.filter((i: any) => (i.abundance ?? 0) > 0),
          unstable: isoList.filter((i: any) => (i.abundance ?? 0) === 0),
        };
      }
      return {
        type: "byElement",
        stable: (cat as any).stable || [],
        unstable: (cat as any).unstable || [],
      };
    }

    if (typeof mass === "number") {
      const hits: any[] = [];
      for (const entry of iso.isotopes as any[]) {
        const sym = entry.element;
        const arr = entry.isotopes || [];
        for (const i of arr) {
          if (i.mass_number === mass) {
            hits.push({ ...i, element: sym, atomic_number: entry.atomic_number });
          }
        }
      }
      return { type: "byMass", items: hits };
    }

    return { type: "none" };
  }, [iso, symbol, mass]);

  // derive element category meta for header tint when symbol is known
  const catKey = symbol ? (SYMBOL_TO_CATEGORY.get(symbol) as keyof typeof CATEGORY_META | undefined) : undefined;
  const headerMeta = (catKey && CATEGORY_META[catKey]) || { bg: "bg-white", text: "text-gray-900" };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-2xl">
        <h2 className="text-2xl font-bold">Isotope Finder</h2>
        <p className="text-base opacity-90">
          Search isotopes by element name/symbol or mass number.  
          Examples: <code>C-14</code>, <code>14C</code>, <code>Carbon-14</code>, <code>O-18</code>, <code>14</code>.
        </p>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., C-14 or Carbon-14 or 14"
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-base text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
        {!iso && !error && (
          <div className="mt-4 text-sm text-gray-500">Loading isotopes dataset…</div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Results */}
        {iso && results && (
          <div className="mt-4 text-sm text-gray-800">
            {results.type === "exact" && (
              <>
                <h3 className="text-base font-semibold mb-2">Match</h3>
                {results.items.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {results.items.map((i: any) => (
                      <NuclideCard key={i.nuclide} item={i} symbol={symbol} />
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-500">No exact nuclide found for that element + mass.</div>
                )}
              </>
            )}

            {results.type === "byElement" && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">Isotopes of {symbol}</h3>
                  <CategoryPill symbol={symbol} />
                </div>

                <section className="mt-2">
                  <h4 className="text-sm font-semibold text-green-700">Stable</h4>
                  {results.stable.length ? (
                    <ul className="mt-1 grid gap-2 sm:grid-cols-2">
                      {results.stable
                        .slice()
                        .sort((a: any, b: any) => a.mass_number - b.mass_number)
                        .map((i: any) => (
                          <NuclideCard key={i.nuclide} item={i} symbol={symbol} />
                        ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No stable isotopes.</p>
                  )}
                </section>

                <section className="mt-4">
                  <h4 className="text-sm font-semibold text-amber-700">Unstable</h4>
                  {results.unstable.length ? (
                    <ul className="mt-1 grid gap-2 sm:grid-cols-2">
                      {results.unstable
                        .slice()
                        .sort((a: any, b: any) => a.mass_number - b.mass_number)
                        .map((i: any) => (
                          <NuclideCard key={i.nuclide} item={i} symbol={symbol} />
                        ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">No unstable isotopes listed.</p>
                  )}
                </section>
              </>
            )}

            {results.type === "byMass" && (
              <>
                <h3 className="text-base font-semibold">Nuclides with mass number {mass}</h3>
                {results.items.length ? (
                  <ul className="mt-2 divide-y divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
                    {results.items
                      .slice()
                      .sort((a: any, b: any) => String(a.element).localeCompare(String(b.element)))
                      .map((i: any) => {
                        const sym = i.element as string | undefined;
                        const catKey = sym ? (SYMBOL_TO_CATEGORY.get(sym) as keyof typeof CATEGORY_META | undefined) : undefined;
                        const meta = (catKey && CATEGORY_META[catKey]) || { bg: "bg-gray-50", text: "text-gray-900" };
                        const w = abundanceWidth(i.abundance);
                        return (
                          <li key={i.nuclide} className="p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className={`rounded-md px-2 py-1 text-sm font-semibold ${meta.bg} ${meta.text}`}>
                                    {i.nuclide}
                                  </div>
                                  <StableBadge stable={Boolean(i.abundance && i.abundance > 0)} />
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  Element: {i.element} • Mass: {i.mass ?? "—"} • Abundance: {pct(i.abundance)}
                                </div>
                              </div>
                              <CategoryPill symbol={sym} />
                            </div>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${w}%` }} />
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                ) : (
                  <div className="text-gray-500">No nuclides found with that mass number.</div>
                )}
              </>
            )}

            {results.type === "none" && (
              <div className="text-gray-500">Start typing to search isotopes (symbol, name, or mass number).</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}