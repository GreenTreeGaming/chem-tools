"use client";

import { useEffect, useMemo, useState } from "react";
import { elements as elementList } from "@/utils/elementsData"; // for name → symbol mapping

type IsoModule = typeof import("all-isotopes");

// quick maps for name ↔ symbol
const NAME_TO_SYMBOL = new Map(
  elementList.map((e) => [e.name.toLowerCase(), e.symbol])
);
const SYMBOL_SET = new Set(elementList.map((e) => e.symbol));

function normalize(q: string) {
  return q.replace(/\s+/g, " ").trim();
}

// Parse queries like: "C-14", "14C", "Carbon-14", "O 18", "U-235", "14"
function parseQuery(raw: string): { symbol?: string; mass?: number } {
  const q = normalize(raw);
  if (!q) return {};

  // Try forms: Symbol-Mass or Name-Mass (e.g., C-14, Carbon-14)
  let m = q.match(/^([A-Za-z]+)\s*[- ]\s*(\d{1,3})$/);
  if (m) {
    const left = m[1];
    const n = Number(m[2]);
    const sym =
      SYMBOL_SET.has(left) ? left :
      NAME_TO_SYMBOL.get(left.toLowerCase());
    return { symbol: sym, mass: Number.isFinite(n) ? n : undefined };
  }

  // Try mass followed by symbol: 14C, 235 U
  m = q.match(/^(\d{1,3})\s*([A-Za-z]{1,2})$/);
  if (m) {
    const n = Number(m[1]);
    const sym = m[2];
    return { symbol: SYMBOL_SET.has(sym) ? sym : undefined, mass: n };
  }

  // Single number → mass-only search across all
  if (/^\d{1,3}$/.test(q)) return { mass: Number(q) };

  // Single token (name or symbol)
  if (/^[A-Za-z]+$/.test(q)) {
    const sym =
      SYMBOL_SET.has(q) ? q :
      NAME_TO_SYMBOL.get(q.toLowerCase());
    return { symbol: sym };
  }

  // Nuclide “X-###” anywhere inside
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

export function IsotopeFinder() {
  const [query, setQuery] = useState("");
  const [iso, setIso] = useState<IsoModule | null>(null);
  const [error, setError] = useState<string | null>(null);

  // lazy-load the big dataset once
  useEffect(() => {
    let alive = true;
    import("all-isotopes")
      .then((m) => alive && setIso(m))
      .catch((e) => alive && setError("Failed to load isotopes dataset."));
    return () => { alive = false; };
  }, []);

  const { symbol, mass } = useMemo(() => parseQuery(query), [query]);

  // compute results
  const results = useMemo(() => {
    if (!iso) return null;

    // if both symbol and mass → exact nuclide(s)
    if (symbol && typeof mass === "number") {
      const info =
        (iso.elements as Record<string, any>)[symbol] ??
        iso.getInfoByElement?.(symbol);
      if (!info) return { type: "exact", items: [] as any[] };

      const items = (info.isotopes || []).filter((i: any) => i.mass_number === mass);
      return { type: "exact", items };
    }

    // symbol only → show categorized stable/unstable
    if (symbol) {
      const cat =
        iso.categorizeByElement?.(symbol) ??
        iso.getInfoByElement?.(symbol); // fallback
      if (!cat) return { type: "byElement", stable: [], unstable: [] as any[] };

      // when using getInfoByElement fallback, fabricate groups (abundance>0 as stable)
      if (!("stable" in cat) || !("unstable" in cat)) {
        const isoList = cat.isotopes || [];
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

    // mass only → search every element for that mass number
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

    // nothing valid yet
    return { type: "none" };
  }, [iso, symbol, mass]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Isotope Finder</h2>
      <p className="text-sm text-gray-500">
        Search isotopes by element name/symbol or mass number. Examples: <code>C-14</code>, <code>14C</code>, <code>Carbon-14</code>, <code>O-18</code>, <code>14</code>.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., C-14 or Carbon-14 or 14"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        />
        <button
          type="button"
          onClick={() => setQuery("")}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
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
                <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 overflow-hidden">
                  {results.items.map((i: any) => (
                    <li key={i.nuclide} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{i.nuclide}</div>
                        <div className="text-xs text-gray-500">
                          Mass: {i.mass ?? "—"} • Abundance: {pct(i.abundance)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No exact nuclide found for that element + mass.</div>
              )}
            </>
          )}

          {results.type === "byElement" && (
            <>
              <h3 className="text-base font-semibold">Isotopes of {symbol}</h3>

              <section className="mt-2">
                <h4 className="text-sm font-semibold text-green-700">Stable</h4>
                {results.stable.length ? (
                  <ul className="mt-1 grid gap-2 sm:grid-cols-2">
                    {results.stable
                      .slice()
                      .sort((a: any, b: any) => a.mass_number - b.mass_number)
                      .map((i: any) => (
                        <li key={i.nuclide} className="rounded-lg border border-gray-200 p-3">
                          <div className="font-medium">{i.nuclide}</div>
                          <div className="text-xs text-gray-500">
                            Mass: {i.mass ?? "—"} • Abundance: {pct(i.abundance)}
                          </div>
                        </li>
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
                        <li key={i.nuclide} className="rounded-lg border border-gray-200 p-3">
                          <div className="font-medium">{i.nuclide}</div>
                          <div className="text-xs text-gray-500">
                            Mass: {i.mass ?? "—"} • Abundance: {pct(i.abundance)}
                          </div>
                        </li>
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
                    .sort((a: any, b: any) => a.element.localeCompare(b.element))
                    .map((i: any) => (
                      <li key={i.nuclide} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{i.nuclide}</div>
                          <div className="text-xs text-gray-500">
                            Element: {i.element} • Mass: {i.mass ?? "—"} • Abundance: {pct(i.abundance)}
                          </div>
                        </div>
                      </li>
                    ))}
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
  );
}
