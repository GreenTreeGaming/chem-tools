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

export function MolarMassTool() {
  const [formula, setFormula] = useState("H2O");

  const { mass, breakdown } = useMemo(() => {
    const parsed = parseFormula(formula.trim());
    if (!parsed)
      return { mass: null as number | null, breakdown: [] as { sym: string; count: number; aw: number }[] };

    let total = 0;
    const lines: { sym: string; count: number; aw: number }[] = [];
    for (const [sym, count] of Object.entries(parsed)) {
      const el = elements.find((e) => e.symbol === sym);
      const aw = el?.atomicWeight ?? 0;
      total += aw * count;
      lines.push({ sym, count, aw });
    }
    return { mass: total || null, breakdown: lines };
  }, [formula]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-amber-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Molar Mass Calculator</h2>
        <p className="text-base opacity-90">
          Enter a chemical formula (e.g., H₂O, C₆H₁₂O₆, NaCl)
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Input */}
        <label className="block text-base font-medium text-gray-700">
          Chemical Formula
          <input
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="e.g., NaCl"
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-lg shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-200"
          />
        </label>

        {/* Result */}
        {mass && (
          <div className="rounded-xl bg-amber-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Result:</div>
            <div className="font-semibold text-amber-800">
              Molar Mass = {mass.toFixed(3)} g/mol
            </div>
          </div>
        )}

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-800">
          <h4 className="font-bold mb-2">Formula</h4>
          <BlockMath math="M = \sum (\text{atomic weight} \times \text{number of atoms})" />
        </div>

        {/* Show Work */}
        {mass && breakdown.length > 0 && (
          <details className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work (with your inputs)
            </summary>
            <div className="mt-4 space-y-5">
              {breakdown.map((b, i) => (
                <div key={i} className="pl-2 border-l-4 border-amber-400">
                  <div className="font-medium text-gray-800">
                    Step {i + 1} — Contribution from {b.sym}
                  </div>
                  <div className="text-sm text-gray-600">
                    Multiply atomic weight of {b.sym} by number of atoms:
                  </div>
                  <BlockMath
                    math={`${b.aw.toFixed(3)} \\times ${b.count} = ${(b.aw * b.count).toFixed(3)}`}
                  />
                </div>
              ))}

              <div className="pl-2 border-l-4 border-amber-600">
                <div className="font-medium text-gray-800">Final Step — Total Molar Mass</div>
                <BlockMath
                  math={`M = ${breakdown
                    .map((b) => `${(b.aw * b.count).toFixed(3)}`)
                    .join(" + ")} = ${mass.toFixed(3)}\\ \\text{g/mol}`}
                />
                <div className="mt-2 rounded-lg bg-amber-100 text-amber-800 px-3 py-1 inline-block">
                  <b>M = {mass.toFixed(3)} g/mol</b>
                </div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
