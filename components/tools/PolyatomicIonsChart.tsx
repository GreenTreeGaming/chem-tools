"use client";

import { useEffect, useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

type Ion = { name: string; formula: string; charge: string; aliases?: string[] };
type IonData = { polyatomicIons: Record<string, Ion[]> };

export function PolyatomicIonsChart() {
  const [data, setData] = useState<IonData | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/polyatomic_ions.json")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Failed to load ions:", err));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    const categories = Object.entries(data.polyatomicIons);

    // no search → return everything
    if (!query) return categories;

    const q = query.toLowerCase();
    // filter inside each category
    return categories
      .map(([cat, ions]) => [
        cat,
        ions.filter(
          (ion) =>
            ion.name.toLowerCase().includes(q) ||
            ion.formula.toLowerCase().includes(q) ||
            ion.charge.toLowerCase().includes(q) ||
            ion.aliases?.some((alias) => alias.toLowerCase().includes(q))
        ),
      ])
      .filter(([_, ions]) => (ions as Ion[]).length > 0);
  }, [data, query]);

  if (!data) {
    return <div className="p-6 text-gray-500 italic">Loading ion chart…</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-4 text-white rounded-t-2xl">
        <h2 className="text-xl font-bold">Polyatomic Ions Chart</h2>
        <p className="text-sm opacity-90">
          Common polyatomic ions grouped by category
        </p>
      </div>

      <div className="p-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, formula, or charge..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full mb-6 rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        />

        {/* Categories */}
        {filtered && filtered.length > 0 ? (
          <div className="space-y-8">
            {filtered.map(([category, ions]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-indigo-700 capitalize mb-3">
                  {category}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(ions as Ion[]).map((ion, i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between rounded-xl border bg-gray-50 p-4 shadow-sm hover:shadow-md transition"
                    >
                      <span className="text-sm text-gray-700">{ion.name}</span>
                      {ion.aliases && ion.aliases.length > 0 && (
                        <span className="text-xs text-gray-500">
                          aka {ion.aliases.join(", ")}
                        </span>
                      )}
                      <span className="mt-2 text-lg font-semibold text-indigo-700">
                        <InlineMath math={ion.formula} />
                      </span>
                      <span className="text-xs text-gray-600 mt-1">
                        Charge: {ion.charge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No ions match your search.</p>
        )}
      </div>
    </div>
  );
}