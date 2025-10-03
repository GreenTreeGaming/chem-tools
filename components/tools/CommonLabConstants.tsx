"use client";

import { useEffect, useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

type Constant = {
  name: string;
  symbol: string;
  value: number;
  unit: string;
  category: string;
};

type ConstantsData = { labConstants: Constant[] };

export function CommonLabConstants() {
  const [data, setData] = useState<ConstantsData | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/lab_constants.json")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Failed to load constants:", err));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (!query) return data;

    const q = query.toLowerCase();
    return {
      labConstants: data.labConstants.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      ),
    };
  }, [data, query]);

  if (!data) {
    return <div className="p-6 text-gray-500 italic">Loading constants…</div>;
  }

  // group by category
  const grouped: Record<string, Constant[]> = (filtered?.labConstants ?? []).reduce(
    (acc, c) => {
      if (!acc[c.category]) acc[c.category] = [];
      acc[c.category].push(c);
      return acc;
    },
    {} as Record<string, Constant[]>
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-yellow-500 px-6 py-4 text-white rounded-t-2xl">
        <h2 className="text-xl font-bold">Common Lab Constants</h2>
        <p className="text-sm opacity-90">Chemistry, physics, and fundamental constants</p>
      </div>

      <div className="p-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name, symbol, or category..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full mb-6 rounded-xl border border-gray-300 px-3 py-2 shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200"
        />

        {/* Collapsible groups */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, constants]) => (
            <details
              key={category}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              open
            >
              <summary className="cursor-pointer font-semibold text-lg text-amber-700">
                {category}
              </summary>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {constants.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    {/* Value prominent */}
                    <div className="text-2xl font-extrabold text-amber-700">
                      {c.value}
                    </div>
                    {/* Unit next to value */}
                    <div className="text-sm text-gray-600 mb-2">{c.unit}</div>
                    {/* Symbol in math */}
                    <div className="text-base font-semibold text-gray-800">
                      <InlineMath math={c.symbol} />
                    </div>
                    {/* Name subtle */}
                    <div className="text-sm text-gray-500">{c.name}</div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}