"use client";

import { useEffect, useState, useMemo } from "react";

type Rule = {
  rule: string;
  exceptions: string[];
};

export function SolubilityRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [query, setQuery] = useState("");

  // Load rules on mount
  useEffect(() => {
    fetch("/data/solubility_rules.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("Loaded solubility rules:", data);
        setRules(data);
      })
      .catch((err) => {
        console.error("Failed to load solubility rules:", err);
      });
  }, []);

  // Filter rules live as you type
  const filtered = useMemo(() => {
    if (!query) return rules;

    // Tokenize chemical formula: e.g. "AgCl" → ["Ag", "Cl"], "NaNO3" → ["Na", "N", "O"]
    const tokens = query.match(/[A-Z][a-z]?/g) || [];
    const parts = tokens.map((t) => t.toLowerCase());

    return rules.filter((r) =>
      parts.every(
        (p) =>
          r.rule.toLowerCase().includes(p) ||
          r.exceptions.some((ex) => ex.toLowerCase().includes(p))
      )
    );
  }, [rules, query]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-4 text-white rounded-t-2xl">
        <h2 className="text-xl font-bold">Solubility Rules</h2>
        <p className="text-sm opacity-90">
          Reference guide for predicting solubility in aqueous solutions.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by compound or ion (e.g. Ag⁺, Na⁺, Cl⁻)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        />

        {/* Rules list */}
        {filtered.length === 0 ? (
          <div className="text-gray-500 italic">No matching rules found.</div>
        ) : (
          <ol className="space-y-4 list-decimal pl-6">
            {filtered.map((r, i) => (
              <li key={i} className="text-gray-800">
                <p className="font-medium">{r.rule}</p>
                {r.exceptions.length > 0 && (
                  <ul className="mt-1 ml-4 list-disc text-sm text-gray-600">
                    <li>
                      <span className="font-semibold">Exceptions:</span>{" "}
                      {r.exceptions.join(", ")}
                    </li>
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}