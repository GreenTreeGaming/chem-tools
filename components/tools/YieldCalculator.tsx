"use client";

import { useEffect, useMemo, useState } from "react";
import { elements } from "@/utils/elementsData";

// ---------------- data / constants ----------------
const AW = new Map<string, number>(
  elements
    .filter((e) => typeof e.atomicWeight === "number")
    .map((e) => [e.symbol, e.atomicWeight as number])
);

// ---------------- parsing: formula ----------------
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

function molarMass(formula: string): { mm: number; missing: string[] } {
  const counts = parseFormula(formula);
  let sum = 0;
  const missing: string[] = [];
  for (const [sym, n] of Object.entries(counts)) {
    const w = AW.get(sym);
    if (typeof w !== "number") missing.push(sym);
    else sum += w * n;
  }
  return { mm: sum, missing };
}

// ---------------- parsing: equation ----------------
type Species = { coef: number; formula: string };

function splitArrow(eq: string) {
  const arrow = /\-\>|\=\>|\u2192|=>|=|→/;
  const parts = eq.split(arrow);
  if (parts.length !== 2) throw new Error("Provide exactly one reaction arrow (e.g., A + B -> C).");
  return { leftStr: parts[0], rightStr: parts[1] };
}

function parseSide(side: string): Species[] {
  return side
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^(\d+)\s*(.*)$/);
      if (m) return { coef: parseInt(m[1], 10), formula: m[2].trim() };
      return { coef: 1, formula: chunk };
    });
}

function parseEquation(eq: string): { reactants: Species[]; products: Species[] } {
  const { leftStr, rightStr } = splitArrow(eq);
  const reactants = parseSide(leftStr);
  const products = parseSide(rightStr);
  if (!reactants.length || !products.length) throw new Error("Both sides must have at least one species.");
  return { reactants, products };
}

// ---------------- numeric helpers ----------------
const toNum = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
};

const fmt = (x: number | null, digits = 4) =>
  x === null || !Number.isFinite(x)
    ? "—"
    : Math.abs(x) !== 0 && (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e6)
    ? x.toExponential(digits)
    : x.toFixed(digits);

// ---------------- UI types ----------------
type AmountMol = { kind: "mol"; value: string; excess?: boolean };
type AmountG = { kind: "g"; value: string; excess?: boolean };
type AmountSolution = {
  kind: "solution";
  molarity: string;    // M
  volume: string;      // numeric
  volUnit: "mL" | "L"; // unit
  excess?: boolean;
};
type Amount = AmountMol | AmountG | AmountSolution;

// ---------------- Component ----------------
export function YieldCalculator() {
  // default sample
  const [equation, setEquation] = useState("BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2");

  const parsed = useMemo(() => {
    try {
      const p = parseEquation(equation);
      const reactMM = p.reactants.map((r) => ({ ...r, ...molarMass(r.formula) }));
      const prodMM = p.products.map((r) => ({ ...r, ...molarMass(r.formula) }));
      const missing = [...reactMM, ...prodMM].flatMap((x) => x.missing.map((m) => `${x.formula}: ${m}`));
      return { ...p, reactMM, prodMM, missing, ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message || "Could not parse equation." };
    }
  }, [equation]);

  // reactant inputs
  const [amounts, setAmounts] = useState<Amount[]>([]);
  useEffect(() => {
    if (!parsed.ok) return;
    setAmounts((prev) => {
      if (prev.length === parsed.reactMM.length) return prev;
      return parsed.reactMM.map((_, i) =>
        i === 0
          ? ({ kind: "mol", value: "" } as Amount)
          : ({ kind: "mol", value: "", excess: false } as Amount)
      );
    });
  }, [parsed.ok ? parsed.reactMM.length : 0]);

  // product & actual mass
  const [targetIdx, setTargetIdx] = useState(0);
  const [actualMass, setActualMass] = useState<string>("");

  useEffect(() => {
    setTargetIdx(0);
    setActualMass("");
  }, [equation]);

  function updateAmount(i: number, updater: (old: Amount) => Amount) {
    setAmounts((arr) => {
      const next = arr.slice();
      next[i] = updater(arr[i] || { kind: "mol", value: "" });
      return next;
    });
  }

  // convert a reactant entry to moles (excess -> Infinity)
  function molesFromAmount(a: Amount, mm: number): number {
    if (a && "excess" in a && a.excess) return Number.POSITIVE_INFINITY;
    if (a?.kind === "mol") {
      const n = toNum(a.value);
      return Number.isFinite(n) && n >= 0 ? n : NaN;
    }
    if (a?.kind === "g") {
      const g = toNum(a.value);
      if (!(Number.isFinite(g) && g >= 0 && Number.isFinite(mm) && mm > 0)) return NaN;
      return g / mm;
    }
    if (a?.kind === "solution") {
      const M = toNum(a.molarity);
      const V = toNum(a.volume);
      if (!(Number.isFinite(M) && M >= 0 && Number.isFinite(V) && V >= 0)) return NaN;
      const L = a.volUnit === "mL" ? V / 1000 : V;
      return M * L;
    }
    return NaN;
  }

  // compute theoretical yield
  const outcome = useMemo(() => {
    if (!parsed.ok) return null;
    const R = parsed.reactMM;
    if (amounts.length !== R.length) return null;

    const nReact = R.map((r, i) => molesFromAmount(amounts[i], r.mm));
    if (nReact.some((n) => !Number.isFinite(n) && n !== Number.POSITIVE_INFINITY)) return null;

    const extentCandidates = R.map((r, i) => {
      const n = nReact[i];
      if (n === Number.POSITIVE_INFINITY) return Number.POSITIVE_INFINITY;
      return n / r.coef;
    });
    const finite = extentCandidates.filter((x) => Number.isFinite(x));
    if (!finite.length) return null;

    const extent = Math.min(...finite); // ξ
    const P = parsed.prodMM;
    const tgt = P[targetIdx] ?? P[0];

    const nProduct = extent * tgt.coef;
    const mProduct = nProduct * tgt.mm;

    return { extent, product: { formula: tgt.formula, n: nProduct, m: mProduct } };
  }, [parsed, amounts, targetIdx]);

  const percentYield = useMemo(() => {
    if (!outcome) return null;
    const actual = toNum(actualMass);
    if (!Number.isFinite(actual) || actual < 0) return null;
    const theo = outcome.product.m;
    if (!(Number.isFinite(theo) && theo > 0)) return null;
    return (actual / theo) * 100;
  }, [outcome, actualMass]);

  const error =
    !parsed.ok
      ? parsed.error
      : parsed.missing.length
      ? `Missing atomic weights for: ${parsed.missing.join(", ")}`
      : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Theoretical Yield & Percent Yield</h2>
      <p className="text-sm text-gray-500">
        Paste a <b>balanced</b> equation, enter reactant amounts (mol, g, or solution), pick a product, and—optionally—enter the actual mass to get percent yield.
      </p>

      {/* Equation */}
      <div className="mt-4 grid gap-3">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">Balanced equation</span>
          <input
            value={equation}
            onChange={(e) => setEquation(e.target.value)}
            placeholder="e.g., BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2"
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </label>
      </div>

      {/* Reactants + Product selection */}
      {parsed.ok && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Reactants */}
          <div>
            <h3 className="text-base font-semibold">Reactants</h3>
            <div className="mt-2 grid gap-2">
              {parsed.reactMM.map((r, i) => {
                const a = amounts[i] as Amount | undefined;
                const kind = a?.kind ?? "mol";
                return (
                  <div key={`${r.coef}-${r.formula}-${i}`} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {r.coef !== 1 ? `${r.coef} ` : ""}{r.formula}
                      </div>
                      <div className="text-xs text-gray-500">M = {fmt(r.mm, 4)} g/mol</div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <select
                        value={kind}
                        onChange={(e) => {
                          const k = e.target.value as Amount["kind"];
                          const ex = (a as any)?.excess ?? false;
                          updateAmount(i, () => {
                            if (k === "mol") return { kind: "mol", value: "", excess: ex };
                            if (k === "g") return { kind: "g", value: "", excess: ex };
                            return { kind: "solution", molarity: "", volume: "", volUnit: "mL", excess: ex };
                          });
                        }}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                      >
                        <option value="mol">mol</option>
                        <option value="g">g</option>
                        <option value="solution">solution (M & volume)</option>
                      </select>

                      <label className="ml-auto flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={(a as any)?.excess ?? false}
                          onChange={(e) =>
                            updateAmount(i, (old) => ({ ...(old as any), excess: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        Treat as excess
                      </label>
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {kind === "mol" && (
                        <label className="text-sm">
                          <span className="block text-gray-600 mb-1">Amount (mol)</span>
                          <input
                            type="number" inputMode="decimal" step="any" min="0"
                            disabled={(a as any)?.excess}
                            value={(a as AmountMol)?.value ?? ""}
                            onChange={(e) => updateAmount(i, (old) => ({ ...(old as AmountMol), value: e.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200
                              ${(a as any)?.excess ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-white border-gray-300"}`}
                          />
                        </label>
                      )}

                      {kind === "g" && (
                        <label className="text-sm">
                          <span className="block text-gray-600 mb-1">Mass (g)</span>
                          <input
                            type="number" inputMode="decimal" step="any" min="0"
                            disabled={(a as any)?.excess}
                            value={(a as AmountG)?.value ?? ""}
                            onChange={(e) => updateAmount(i, (old) => ({ ...(old as AmountG), value: e.target.value }))}
                            className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200
                              ${(a as any)?.excess ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-white border-gray-300"}`}
                          />
                        </label>
                      )}

                      {kind === "solution" && (
                        <>
                          <label className="text-sm">
                            <span className="block text-gray-600 mb-1">Molarity (M)</span>
                            <input
                              type="number" inputMode="decimal" step="any" min="0"
                              disabled={(a as any)?.excess}
                              value={(a as AmountSolution)?.molarity ?? ""}
                              onChange={(e) =>
                                updateAmount(i, (old) => ({ ...(old as AmountSolution), molarity: e.target.value }))
                              }
                              className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200
                                ${(a as any)?.excess ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-white border-gray-300"}`}
                            />
                          </label>
                          <div className="grid grid-cols-[1fr_auto] gap-2">
                            <label className="text-sm">
                              <span className="block text-gray-600 mb-1">Volume</span>
                              <input
                                type="number" inputMode="decimal" step="any" min="0"
                                disabled={(a as any)?.excess}
                                value={(a as AmountSolution)?.volume ?? ""}
                                onChange={(e) =>
                                  updateAmount(i, (old) => ({ ...(old as AmountSolution), volume: e.target.value }))
                                }
                                className={`w-full rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200
                                  ${(a as any)?.excess ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-white border-gray-300"}`}
                              />
                            </label>
                            <label className="text-sm">
                              <span className="sr-only">Volume unit</span>
                              <select
                                disabled={(a as any)?.excess}
                                value={(a as AmountSolution)?.volUnit ?? "mL"}
                                onChange={(e) =>
                                  updateAmount(i, (old) => ({ ...(old as AmountSolution), volUnit: e.target.value as "mL" | "L" }))
                                }
                                className={`mt-6 rounded-xl border px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200
                                  ${(a as any)?.excess ? "bg-gray-50 border-gray-200 text-gray-500" : "bg-white border-gray-300"}`}
                              >
                                <option value="mL">mL</option>
                                <option value="L">L</option>
                              </select>
                            </label>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Products & actual mass */}
          <div>
            <h3 className="text-base font-semibold">Product</h3>
            <div className="mt-2 grid gap-2">
              {parsed.prodMM.map((p, i) => (
                <div key={`${p.coef}-${p.formula}-${i}`} className="rounded-xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{p.coef !== 1 ? `${p.coef} ` : ""}{p.formula}</div>
                    <div className="text-xs text-gray-500">M = {fmt(p.mm, 4)} g/mol</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3">
              <label className="text-sm">
                <span className="block text-gray-600 mb-1">Target product for yield</span>
                <select
                  value={String(targetIdx)}
                  onChange={(e) => setTargetIdx(parseInt(e.target.value, 10))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                >
                  {parsed.products?.map((p, i) => (
                    <option key={i} value={i}>
                      {p.formula}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="block text-gray-600 mb-1">Actual mass of product (g)</span>
                <input
                  value={actualMass}
                  onChange={(e) => setActualMass(e.target.value)}
                  placeholder="optional, e.g., 1.82"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-5">
        {(!parsed.ok || parsed.missing.length) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {!parsed.ok ? parsed.error : `Missing atomic weights for: ${parsed.missing.join(", ")}`}
          </div>
        )}

        {parsed.ok && !parsed.missing.length && outcome && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-3 md:col-span-2">
                <div className="text-xs text-purple-800">Theoretical Yield ({outcome.product.formula})</div>
                <div className="text-sm font-medium text-purple-900">
                  {fmt(outcome.product.n, 6)} mol • {fmt(outcome.product.m, 4)} g
                </div>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="text-xs text-emerald-800">Percent Yield</div>
                <div className="text-sm font-semibold text-emerald-900">
                  {percentYield === null ? "—" : `${fmt(percentYield, 2)} %`}
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Theoretical yield is computed from the limiting reagent via stoichiometry. Enter actual mass to compute percent yield.
            </p>
          </>
        )}
      </div>

      {/* Examples */}
      <div className="mt-6">
        <details className="text-xs text-gray-600">
          <summary className="cursor-pointer select-none">Examples</summary>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <button
                className="underline hover:text-blue-600"
                onClick={() => setEquation("BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2")}
                type="button"
              >
                BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2
              </button>
            </li>
            <li>
              <button
                className="underline hover:text-blue-600"
                onClick={() => setEquation("2 H2 + O2 -> 2 H2O")}
                type="button"
              >
                2 H2 + O2 -> 2 H2O
              </button>
            </li>
            <li>
              <button
                className="underline hover:text-blue-600"
                onClick={() => setEquation("C3H8 + 5 O2 -> 3 CO2 + 4 H2O")}
                type="button"
              >
                C3H8 + 5 O2 -> 3 CO2 + 4 H2O
              </button>
            </li>
          </ul>
        </details>
      </div>
    </div>
  );
}