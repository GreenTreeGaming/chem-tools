"use client";

import { useEffect, useMemo, useState } from "react";
import { elements } from "@/utils/elementsData";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

/* =============================
   CONSTANTS + LOOKUPS
============================= */
const NA = 6.02214076e23;

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
    if (ch === "·" || ch === ".") { i++; continue; }
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
   HELPERS
============================= */
const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

function fmtSci(x: number | null, sig = 5): string {
  if (x === null || !Number.isFinite(x)) return "—";
  if (x === 0) return "0";

  const absx = Math.abs(x);

  // If the number is "normal", just return with sig figs (no ×10^n)
  if (absx >= 1e-3 && absx < 1e4) {
    return Number(x.toPrecision(sig)).toString();
  }

  // Otherwise, format in scientific notation
  const exp = Math.floor(Math.log10(absx));
  const mant = x / Math.pow(10, exp);
  const mantRounded = Number(mant.toPrecision(sig));

  return `${mantRounded} \\times 10^{${exp}}`;
}

function fmtSciPlain(x: number | null, sig = 5): string {
  if (x === null || !Number.isFinite(x)) return "—";
  if (x === 0) return "0";

  const absx = Math.abs(x);

  // If the number is "normal" (between 1e-3 and 1e4), just return fixed sig figs
  if (absx >= 1e-3 && absx < 1e4) {
    return Number(x.toPrecision(sig)).toString();
  }

  // Otherwise, use scientific notation
  const exp = Math.floor(Math.log10(absx));
  const mant = x / Math.pow(10, exp);
  const mantRounded = Number(mant.toPrecision(sig));

  return `${mantRounded} × 10^${exp}`;
}

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

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-t-2xl">
        <h2 className="text-xl font-bold">Stoichiometry</h2>
        <p className="text-base opacity-90">Mass ↔ Moles ↔ Particles</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Formula input */}
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-base md:col-span-2">
            <span className="block text-gray-700 mb-1">Formula</span>
            <input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g., NaCl, C6H12O6, Ba3(PO4)2"
              spellCheck={false}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base shadow-sm focus:border-emerald-600 focus:ring focus:ring-emerald-200"
            />
          </label>
          <div className="rounded-xl p-4 bg-emerald-50 text-emerald-800 border border-emerald-200">
            <div className="text-sm">Molar mass</div>
            <div className="text-lg font-bold">
              {Number.isFinite(mm) ? `${fmtSciPlain(mm, 4)} g/mol` : "—"}
            </div>
          </div>
        </div>

        {/* Known picker */}
        <div>
          <div className="text-sm text-gray-500 mb-2">I have…</div>
          <div className="flex flex-wrap gap-2">
            {(["mass", "moles", "particles"] as KnownKey[]).map((k) => (
              <button
                key={k}
                onClick={() => { setKnown(k); setMass(""); setMoles(""); setParticles(""); }}
                type="button"
                className={[
                  "rounded-lg px-4 py-2 text-base font-medium transition ring-1",
                  known === k
                    ? "bg-emerald-600 text-white ring-emerald-600"
                    : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                {k === "mass" ? "Mass (g)" : k === "moles" ? "Moles (mol)" : "Particles"}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Mass */}
          <label className="text-base">
            <span className="block text-gray-700 mb-1">Mass (g)</span>
            <input
              type="number"
              disabled={known !== "mass"}
              value={mass}
              onChange={(e) => setMass(e.target.value)}
              className={`w-full rounded-xl border px-3 py-3 text-base shadow-sm focus:border-emerald-600 focus:ring focus:ring-emerald-200
                ${known === "mass" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
            />
          </label>

          {/* Moles */}
          <label className="text-base">
            <span className="block text-gray-700 mb-1">Moles (mol)</span>
            <input
              type="number"
              disabled={known !== "moles"}
              value={moles}
              onChange={(e) => setMoles(e.target.value)}
              className={`w-full rounded-xl border px-3 py-3 text-base shadow-sm focus:border-emerald-600 focus:ring focus:ring-emerald-200
                ${known === "moles" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
            />
          </label>

          {/* Particles */}
          <label className="text-base">
            <span className="block text-gray-700 mb-1">Particles</span>
            <div className="flex gap-2">
              <input
                type="number"
                disabled={known !== "particles"}
                value={particles}
                onChange={(e) => setParticles(e.target.value)}
                className={`w-full rounded-xl border px-3 py-3 text-base shadow-sm focus:border-emerald-600 focus:ring focus:ring-emerald-200
                  ${known === "particles" ? "bg-white" : "bg-gray-50 text-gray-500"}`}
              />
              <select
                disabled={known !== "particles"}
                value={partUnit}
                onChange={(e) => setPartUnit(e.target.value as PartUnit)}
                className="rounded-xl border border-gray-300 bg-white px-2 py-2 text-base shadow-sm"
              >
                <option value="entities">entities</option>
                <option value="e23">×10^23</option>
              </select>
            </div>
          </label>
        </div>

        {/* Results */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Mass</div>
            <div className="font-semibold text-emerald-800">{fmtSciPlain(derived.m)} g</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Moles</div>
            <div className="font-semibold text-emerald-800">{fmtSciPlain(derived.n)} mol</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Particles</div>
            <div className="font-semibold text-emerald-800">
              {derived.N === null ? "—" : partUnit === "e23"
                ? `${fmtSciPlain(derived.N / 1e23)} × 10^23`
                : fmtSciPlain(derived.N)}
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-800 p-4 text-base">
            {error}
          </div>
        )}

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <h3 className="font-bold text-base mb-2">Formulas</h3>
          <ul className="space-y-2">
            <li><BlockMath math="M = \sum n_i \times \text{AW}_i" /></li>
            <li><BlockMath math="n = \tfrac{m}{M}" /></li>
            <li><BlockMath math="m = n \times M" /></li>
            <li><BlockMath math="N = n \times N_a" /></li>
            <li><BlockMath math="n = \tfrac{N}{N_a}" /></li>
          </ul>
        </div>

        {/* Show Work */}
        {derived.n !== null && (
          <details className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work (with your inputs)
            </summary>
            <div className="mt-4 space-y-5">
              {/* Step 1 – Molar Mass */}
              <div className="pl-2 border-l-4 border-emerald-400">
                <div className="font-medium text-gray-800">Step 1 — Molar Mass</div>
                <BlockMath math={`M = ${fmtSci(mm)}\\ \\text{g/mol}`} />
              </div>

              {known === "mass" && (
                <>
                  <div className="pl-2 border-l-4 border-emerald-400">
                    <div className="font-medium text-gray-800">Step 2 — Mass → Moles</div>
                    <BlockMath math={`n = \\frac{${mass}}{${fmtSci(mm)}} = ${fmtSci(derived.n)}\\ \\text{mol}`} />
                    <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                      n = {fmtSciPlain(derived.n)} mol
                    </div>
                  </div>
                  <div className="pl-2 border-l-4 border-emerald-600">
                    <div className="font-medium text-gray-800">Step 3 — Moles → Particles</div>
                    <BlockMath 
                      math={`N = n \\times N_a = ${fmtSci(derived.n)} \\times ${fmtSci(NA)} = ${fmtSci(derived.N)}`} 
                    />
                    <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                      <div>N = {fmtSciPlain(derived.N)}</div>
                    </div>
                  </div>
                </>
              )}

              {known === "moles" && (
                <>
                  <div className="pl-2 border-l-4 border-emerald-400">
                    <div className="font-medium text-gray-800">Step 2 — Moles → Mass</div>
                    <BlockMath math={`m = ${moles} \\times ${fmtSci(mm)} = ${fmtSci(derived.m)}\\ \\text{g}`} />
                    <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                      m = {fmtSci(derived.m)} g
                    </div>
                  </div>
                  <div className="pl-2 border-l-4 border-emerald-600">
                    <div className="font-medium text-gray-800">Step 3 — Moles → Particles</div>
                    <BlockMath math={`N = ${moles} \\times ${fmtSci(NA)} = ${fmtSci(derived.N)}`} />
                    <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                      N = {fmtSciPlain(derived.N)}
                    </div>
                  </div>
                </>
              )}

              {known === "particles" && (
                <>
                  <div className="pl-2 border-l-4 border-emerald-400">
                    <div className="font-medium text-gray-800">Step 2 — Particles → Moles</div>
                    <BlockMath math={`n = \\frac{${fmtSci(derived.N)}}{${fmtSci(NA)}} = ${fmtSci(derived.n)}\\ \\text{mol}`} />
                    <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                      n = {fmtSciPlain(derived.n)} mol
                    </div>
                  </div>
                  <div className="pl-2 border-l-4 border-emerald-600">
                    <div className="font-medium text-gray-800">Step 3 — Moles → Mass</div>
                    <BlockMath math={`m = ${fmtSci(derived.n)} \\times ${fmtSci(mm)} = ${fmtSci(derived.m)}\\ \\text{g}`} />
                    <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                      m = {fmtSciPlain(derived.m)} g
                    </div>
                  </div>
                </>
              )}
            </div>
          </details>
        )}

        {/* Atom breakdown */}
        {counts && (
          <details className="mt-4 text-sm text-gray-700">
            <summary className="cursor-pointer font-medium">Atom counts</summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {Object.entries(counts).map(([sym, n]) => (
                <li key={sym} className="rounded bg-emerald-100 text-emerald-800 px-2 py-1">
                  {sym} × {n}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
