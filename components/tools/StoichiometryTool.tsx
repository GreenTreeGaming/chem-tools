"use client";

import { useEffect, useMemo, useState } from "react";
import { elements } from "@/utils/elementsData"; // atomic weights

/* =============================
   CONSTANTS + LOOKUPS
============================= */
const NA = 6.02214076e23; // Avogadro’s number

const AW = new Map<string, number>(
  elements
    .filter((e) => typeof e.atomicWeight === "number")
    .map((e) => [e.symbol, e.atomicWeight as number])
);

/* =============================
   FORMULA PARSER
============================= */
type Counts = Record<string, number>;
const ELEMENT_RE = /[A-Z][a-z]?/y;
const NUM_RE = /\d+/y;

function parseFormula(formula: string): Counts {
  const s = formula.replace(/\s+/g, "");
  const stack: Counts[] = [Object.create(null)];
  let i = 0;

  const add = (map: Counts, k: string, n: number) => {
    map[k] = (map[k] || 0) + n;
  };

  while (i < s.length) {
    const ch = s[i];

    if (ch === "(") {
      stack.push(Object.create(null));
      i++;
      continue;
    }
    if (ch === ")") {
      i++;
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(s);
      const mult = m ? parseInt(m[0], 10) : 1;
      if (m) i = NUM_RE.lastIndex;

      const group = stack.pop();
      if (!group) throw new Error("Mismatched parentheses");
      const top = stack[stack.length - 1];
      for (const [el, cnt] of Object.entries(group)) add(top, el, cnt * mult);
      continue;
    }

    if (ch === "·" || ch === ".") { i++; continue; } // hydrate dot

    ELEMENT_RE.lastIndex = i;
    const e = ELEMENT_RE.exec(s);
    if (e) {
      const sym = e[0];
      i = ELEMENT_RE.lastIndex;
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(s);
      const mult = m ? parseInt(m[0], 10) : 1;
      if (m) i = NUM_RE.lastIndex;
      add(stack[stack.length - 1], sym, mult);
      continue;
    }

    throw new Error(`Unexpected token '${ch}' in formula '${formula}'`);
  }
  if (stack.length !== 1) throw new Error("Mismatched parentheses");
  return stack[0];
}

function molarMassFromCounts(counts: Counts): { mass: number; missing: string[] } {
  let mass = 0;
  const missing: string[] = [];
  for (const [sym, n] of Object.entries(counts)) {
    const aw = AW.get(sym);
    if (typeof aw !== "number") {
      missing.push(sym);
      continue;
    }
    mass += aw * n;
  }
  return { mass, missing };
}

/* =============================
   NUMERIC HELPERS
============================= */
const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

const fmt = (x: number | null, digits = 4) =>
  x === null || !Number.isFinite(x) ? "—" :
  (Math.abs(x) !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e6))
    ? x.toExponential(digits)
    : x.toFixed(digits);

/* =============================
   MAIN COMPONENT
============================= */
type KnownKey = "mass" | "moles" | "particles";
type PartUnit = "entities" | "e23";

export function StoichiometryTool() {
  const [formula, setFormula] = useState("C6H12O6");
  const [known, setKnown] = useState<KnownKey>("mass");
  const [mass, setMass] = useState("180");
  const [moles, setMoles] = useState("");
  const [particles, setParticles] = useState("");
  const [partUnit, setPartUnit] = useState<PartUnit>("entities");
  const [error, setError] = useState<string | null>(null);

  const { counts, mm, missing } = useMemo(() => {
    try {
      const c = parseFormula(formula);
      const { mass, missing } = molarMassFromCounts(c);
      return { counts: c, mm: mass, missing };
    } catch {
      return { counts: null, mm: NaN, missing: [] as string[] };
    }
  }, [formula]);

  const derived = useMemo(() => {
    if (!counts || !Number.isFinite(mm) || mm <= 0)
      return { m: null, n: null, N: null } as const;

    const readParticles = () => {
      const raw = toNum(particles);
      if (!Number.isFinite(raw)) return NaN;
      return partUnit === "e23" ? raw * 1e23 : raw;
    };

    switch (known) {
      case "mass": {
        const m = toNum(mass);
        if (!Number.isFinite(m) || m < 0) return { m: null, n: null, N: null } as const;
        const n = m / mm;
        const N = n * NA;
        return { m, n, N } as const;
      }
      case "moles": {
        const n = toNum(moles);
        if (!Number.isFinite(n) || n < 0) return { m: null, n: null, N: null } as const;
        const m = n * mm;
        const N = n * NA;
        return { m, n, N } as const;
      }
      case "particles": {
        const N = readParticles();
        if (!Number.isFinite(N) || N < 0) return { m: null, n: null, N: null } as const;
        const n = N / NA;
        const m = n * mm;
        return { m, n, N } as const;
      }
    }
  }, [known, mass, moles, particles, partUnit, counts, mm]);

  useEffect(() => {
    if (!counts) {
      setError("Check the formula (parentheses, capitalization).");
    } else if (!Number.isFinite(mm) || mm <= 0) {
      setError("Could not compute molar mass.");
    } else if (missing.length) {
      setError(`Missing atomic weights for: ${missing.join(", ")}`);
    } else {
      setError(null);
    }
  }, [counts, mm, missing]);

  const resetInputs = () => {
    setMass("");
    setMoles("");
    setParticles("");
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-rose-600 text-white px-4 py-3 rounded-t-2xl">
        <h2 className="text-lg font-semibold">Stoichiometry</h2>
        <p className="text-sm opacity-90">Mass ↔ Moles ↔ Particles</p>
      </div>

      <div className="p-4 sm:p-6">
        <p className="text-sm text-gray-600">
          Enter a chemical formula, pick the quantity you have, and the rest are computed.
        </p>

        {/* Formula input */}
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            <span className="block text-gray-600 mb-1">Formula</span>
            <input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g., NaCl, C6H12O6, Ba3(PO4)2, CuSO4·5H2O"
              spellCheck={false}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring focus:ring-indigo-200"
            />
          </label>
          <div className="rounded-xl p-3 text-white bg-indigo-600 shadow">
            <div className="text-xs opacity-80">Molar mass</div>
            <div className="font-bold">{Number.isFinite(mm) ? `${fmt(mm, 4)} g/mol` : "—"}</div>
          </div>
        </div>

        {/* Known picker */}
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-1">I have…</div>
          <div className="flex flex-wrap gap-2">
            {(["mass", "moles", "particles"] as KnownKey[]).map((k) => (
              <button
                key={k}
                onClick={() => { setKnown(k); resetInputs(); }}
                type="button"
                className={[
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition ring-1",
                  known === k
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {k === "mass" ? "Mass (g)" : k === "moles" ? "Moles (mol)" : "Particles"}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {/* Mass */}
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Mass (g)</span>
            <input
              type="number"
              disabled={known !== "mass"}
              value={mass}
              onChange={(e) => setMass(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring focus:ring-indigo-200
                ${known === "mass" ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            />
          </label>

          {/* Moles */}
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Moles (mol)</span>
            <input
              type="number"
              disabled={known !== "moles"}
              value={moles}
              onChange={(e) => setMoles(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring focus:ring-indigo-200
                ${known === "moles" ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            />
          </label>

          {/* Particles */}
          <label className="text-sm">
            <span className="block text-gray-600 mb-1">Particles</span>
            <div className="flex gap-2">
              <input
                type="number"
                disabled={known !== "particles"}
                value={particles}
                onChange={(e) => setParticles(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-indigo-600 focus:ring focus:ring-indigo-200
                  ${known === "particles" ? "bg-white border-gray-300" : "bg-gray-50 border-gray-200 text-gray-500"}`}
              />
              <select
                disabled={known !== "particles"}
                value={partUnit}
                onChange={(e) => setPartUnit(e.target.value as PartUnit)}
                className="rounded-xl border border-gray-300 bg-white px-2 py-1 text-sm shadow-sm"
              >
                <option value="entities">entities</option>
                <option value="e23">×10^23</option>
              </select>
            </div>
          </label>
        </div>

        {/* Results */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl p-3 text-white bg-green-600 shadow">
            <div className="text-xs opacity-80">Mass (g)</div>
            <div className="text-sm font-bold">{fmt(derived.m)}</div>
          </div>
          <div className="rounded-xl p-3 text-white bg-blue-600 shadow">
            <div className="text-xs opacity-80">Moles (mol)</div>
            <div className="text-sm font-bold">{fmt(derived.n)}</div>
          </div>
          <div className="rounded-xl p-3 text-white bg-purple-600 shadow">
            <div className="text-xs opacity-80">Particles</div>
            <div className="text-sm font-bold">
              {derived.N === null ? "—" : partUnit === "e23"
                ? <b>{fmt(derived.N / 1e23)} × 10^23</b>
                : <b>{fmt(derived.N)}</b>}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-600 text-white p-3 text-sm shadow">
            {error}
          </div>
        )}

        {/* Breakdown */}
        {counts && (
          <details className="mt-4 text-xs text-gray-600">
            <summary className="cursor-pointer select-none">Atom counts</summary>
            <ul className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
              {Object.entries(counts).map(([sym, n]) => (
                <li key={sym} className="rounded-lg px-2 py-1 bg-indigo-600 text-white">
                  <span className="font-medium">{sym}</span> × <b>{n}</b>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}