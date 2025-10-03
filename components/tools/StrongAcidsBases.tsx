"use client";

import { useEffect, useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";

type AcidBaseData = {
  acids: { name: string; formula: string }[];
  bases: { name: string; formula: string }[];
};

export function StrongAcidsBases() {
  const [data, setData] = useState<AcidBaseData | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/strong_acids_bases.json")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Failed to load acids/bases:", err));
  }, []);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (!query) return data;

    const q = query.toLowerCase();
    return {
      acids: data.acids.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.formula.toLowerCase().includes(q)
      ),
      bases: data.bases.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.formula.toLowerCase().includes(q)
      ),
    };
  }, [data, query]);

  if (!data) {
    return (
      <div className="p-6 text-gray-500 italic">Loading acids & bases…</div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-red-500 px-6 py-4 text-white rounded-t-2xl">
        <h2 className="text-xl font-bold">Strong Acids & Bases</h2>
        <p className="text-sm opacity-90">
          Reference list of common strong acids and strong bases.
        </p>
      </div>

      {/* Search */}
      <div className="p-6">
        <input
          type="text"
          placeholder="Search by name or formula (e.g. HCl, hydroxide)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full mb-6 rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-200"
        />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Acids */}
          <div>
            <h3 className="text-lg font-semibold text-rose-700 mb-3">Strong Acids</h3>
            {filtered?.acids.length ? (
              <ul className="space-y-2">
                {filtered.acids.map((a, i) => (
                  <li
                    key={i}
                    className="flex justify-between rounded-lg border p-3 bg-rose-50"
                  >
                    <span>{a.name}</span>
                    <span className="font-semibold">
                      <InlineMath math={a.formula} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No acids match your search.</p>
            )}
          </div>

          {/* Bases */}
          <div>
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Strong Bases</h3>
            {filtered?.bases.length ? (
              <ul className="space-y-2">
                {filtered.bases.map((b, i) => (
                  <li
                    key={i}
                    className="flex justify-between rounded-lg border p-3 bg-blue-50"
                  >
                    <span>{b.name}</span>
                    <span className="font-semibold">
                      <InlineMath math={b.formula} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No bases match your search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}