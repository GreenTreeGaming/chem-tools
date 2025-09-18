"use client";

import { useMemo, useState } from "react";
import { elements } from "@/utils/elementsData";

// super-minimal formula parser: supports symbols + integer counts (e.g., H2O, C6H12O6)
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
    if (!parsed) return { mass: null as number | null, breakdown: [] as string[] };

    let total = 0;
    const lines: string[] = [];
    for (const [sym, count] of Object.entries(parsed)) {
      const el = elements.find((e) => e.symbol === sym);
      const aw = el?.atomicWeight ?? 0;
      total += aw * count;
      lines.push(`${sym} × ${count} × ${aw?.toFixed?.(3) ?? "?"}`);
    }
    return { mass: total || null, breakdown: lines };
  }, [formula]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Molar Mass Calculator</h2>
      <p className="text-sm text-gray-500">Enter a chemical formula (e.g., H2O, C6H12O6)</p>
      <div className="mt-3 flex gap-2">
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g., NaCl"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        />
      </div>
      <div className="mt-4">
        <div className="text-sm text-gray-700">
          {mass ? <b>{mass.toFixed(3)} g/mol</b> : "—"}
        </div>
        {breakdown.length > 0 && (
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
            {breakdown.map((l, i) => <li key={i}>{l}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}