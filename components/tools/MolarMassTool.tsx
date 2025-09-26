"use client";

import { useMemo, useState } from "react";
import { elements } from "@/utils/elementsData";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

// simple parser: symbols + integer counts
function parseFormula(formula: string): { [symbol: string]: number } | null {
  const map: Record<string, number> = {};
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let m: RegExpExecArray | null;
  let matched = false;
  while ((m = regex.exec(formula)) !== null) {
    matched = true;
    const sym = m[1];
    const count = m[2] ? parseInt(m[2], 10) : 1;
    map[sym] = (map[sym] || 0) + count;
  }
  return matched ? map : null;
}

// strong palette by element type
const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  "alkali metal": { bg: "bg-yellow-400", text: "text-white", ring: "ring-yellow-600" },
  "alkaline earth metal": { bg: "bg-green-500", text: "text-white", ring: "ring-green-700" },
  "transition metal": { bg: "bg-blue-500", text: "text-white", ring: "ring-blue-700" },
  "post-transition metal": { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-700" },
  metalloid: { bg: "bg-purple-500", text: "text-white", ring: "ring-purple-700" },
  nonmetal: { bg: "bg-pink-500", text: "text-white", ring: "ring-pink-700" },
  halogen: { bg: "bg-red-500", text: "text-white", ring: "ring-red-700" },
  "noble gas": { bg: "bg-indigo-500", text: "text-white", ring: "ring-indigo-700" },
  lanthanide: { bg: "bg-teal-500", text: "text-white", ring: "ring-teal-700" },
  actinide: { bg: "bg-cyan-500", text: "text-white", ring: "ring-cyan-700" },
};

// fallback if category not found
const DEFAULT_COLOR = { bg: "bg-gray-400", text: "text-white", ring: "ring-gray-600" };

export function MolarMassTool() {
  const [formula, setFormula] = useState("H2O");

  const { mass, breakdown } = useMemo(() => {
    const parsed = parseFormula(formula.trim());
    if (!parsed)
      return { mass: null as number | null, breakdown: [] as { sym: string; count: number; aw: number; cat: string }[] };

    let total = 0;
    const lines: { sym: string; count: number; aw: number; cat: string }[] = [];
    for (const [sym, count] of Object.entries(parsed)) {
      const el = elements.find((e) => e.symbol === sym);
      const aw = el?.atomicWeight ?? 0;
      const cat = el?.category?.toLowerCase?.() ?? "unknown";
      total += aw * count;
      lines.push({ sym, count, aw, cat });
    }
    return { mass: total || null, breakdown: lines };
  }, [formula]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Molar Mass Calculator</h2>
        <p className="text-base opacity-90">
          Enter a chemical formula (e.g., H₂O, C₆H₁₂O₆, NaCl)
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Input */}
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g., NaCl"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-lg shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
        />

        {/* Result */}
        <div className="mt-2 text-lg">
          <span className="font-medium text-gray-700">Molar mass:</span>{" "}
          <b className="text-indigo-700">
            {mass ? `${mass.toFixed(3)} g/mol` : "—"}
          </b>
        </div>

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-800">
          <h4 className="font-bold mb-2">Formula</h4>
          <BlockMath math="M = \sum ( \text{atomic weight} \times \text{number of atoms} )" />
        </div>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {breakdown.map((b, i) => {
              const color = CATEGORY_COLORS[b.cat] || DEFAULT_COLOR;
              return (
                <li
                  key={i}
                  className={`rounded-lg border p-4 shadow-sm ${color.bg} ${color.text} ${color.ring}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {b.sym}
                      <sub className="ml-0.5 text-sm opacity-80">{b.count}</sub>
                    </span>
                    <span className="text-sm opacity-90">
                      {b.aw.toFixed(3)} × {b.count}
                    </span>
                  </div>
                  <div className="mt-1 text-sm opacity-90">
                    Contribution: <b>{(b.aw * b.count).toFixed(3)}</b>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Show Work */}
        {mass && breakdown.length > 0 && (
          <details className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">Show Work</summary>
            <div className="mt-4 space-y-6">
              {breakdown.map((b, i) => (
                <div key={i}>
                  <div className="font-medium text-gray-800">
                    Step {i + 1} — Contribution from {b.sym}
                  </div>
                  <p className="text-sm text-gray-600">
                    Multiply atomic weight of {b.sym} by the number of atoms:
                  </p>
                  <BlockMath
                    math={`${b.sym}_{${b.count}}: ${b.aw.toFixed(3)} \\times ${b.count} \\Rightarrow ${(b.aw * b.count).toFixed(3)}`}
                  />
                </div>
              ))}

              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="font-medium text-gray-800">Final Step — Total Molar Mass</div>
                <p className="text-sm text-gray-600">Sum all contributions:</p>
                <BlockMath
                  math={`M = ${breakdown
                    .map((b) => `${(b.aw * b.count).toFixed(3)}`)
                    .join(" + ")} \\Rightarrow \\mathbf{${mass.toFixed(3)}\\ \\text{g/mol}}`}
                />
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}