"use client";

import { useEffect, useMemo, useState } from "react";
import { elements } from "@/utils/elementsData";

/* ---------------- constants ---------------- */
const AW = new Map<string, number>(
  elements
    .filter((e) => typeof e.atomicWeight === "number")
    .map((e) => [e.symbol, e.atomicWeight as number])
);

/* ---------------- parsing: formula ---------------- */
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

/* ---------------- parsing: equation ---------------- */
type Species = { coef: number; formula: string };

function splitArrow(eq: string) {
  const arrow = /\-\>|\=\>|\u2192|=>|=|→/;
  const parts = eq.split(arrow);
  if (parts.length !== 2) throw new Error("Provide exactly one reaction arrow (e.g., A + B -> C).");
  return { leftStr: parts[0], rightStr: parts[1] };
}

function parseSide(side: string): Species[] {
  return side.split("+")
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

/* ---------------- helpers ---------------- */
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

/* ---------------- UI state types ---------------- */
type AmountMol = { kind: "mol"; value: string; excess?: boolean };
type AmountG = { kind: "g"; value: string; excess?: boolean };
type AmountSolution = {
  kind: "solution";
  molarity: string;
  volume: string;
  volUnit: "mL" | "L";
  excess?: boolean;
};
type Amount = AmountMol | AmountG | AmountSolution;

/* ---------------- Component ---------------- */
export function LimitingReagentTool() {
  const [equation, setEquation] = useState("BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2");

  // Parse eq + mm
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

  // per-reactant input state
  const [amounts, setAmounts] = useState<Amount[]>([]);
  useEffect(() => {
    if (!parsed.ok) return;
    setAmounts((prev) => {
      if (prev.length === parsed.reactMM.length) return prev;
      return parsed.reactMM.map((_, i) =>
        i === 0
          ? ({ kind: "mol", value: "0.00785" } as Amount)
          : ({ kind: "mol", value: "", excess: i === 1 } as Amount)
      );
    });
  }, [parsed.ok ? parsed.reactMM.length : 0]);

  // product + actual mass for percent yield
  const [targetIdx, setTargetIdx] = useState(0);
  const [actualMass, setActualMass] = useState<string>("");
  useEffect(() => {
    setTargetIdx(0);
    setActualMass("");
  }, [equation]);

  // update one reactant
  function updateAmount(i: number, updater: (old: Amount) => Amount) {
    setAmounts((arr) => {
      const next = arr.slice();
      next[i] = updater(arr[i] || { kind: "mol", value: "" });
      return next;
    });
  }

  // convert to moles
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

  // compute outcome
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

    const finiteCandidates = extentCandidates.filter((x) => Number.isFinite(x));
    if (!finiteCandidates.length) return null;

    const extent = Math.min(...finiteCandidates);
    const limitingIndex = extentCandidates.indexOf(extent);
    const limiting = limitingIndex >= 0 ? R[limitingIndex] : null;

    const P = parsed.prodMM;
    const tgt = P[targetIdx] ?? P[0];
    const nProduct = extent * tgt.coef;
    const mProduct = nProduct * tgt.mm;

    const leftovers = R.map((r, i) => {
      const n = nReact[i];
      if (n === Number.POSITIVE_INFINITY) {
        return { formula: r.formula, nLeft: null as number | null, mLeft: null as number | null, excess: true };
      }
      const nUsed = extent * r.coef;
      const nLeft = Math.max(0, n - nUsed);
      return { formula: r.formula, nLeft, mLeft: nLeft * r.mm, excess: false };
    });

    return {
      limiting: limiting ? { formula: limiting.formula, index: limitingIndex } : null,
      extent,
      product: { formula: tgt.formula, moles: nProduct, grams: mProduct },
      leftovers,
      nReact,
    };
  }, [parsed, amounts, targetIdx]);

  const percentYield = useMemo(() => {
    if (!outcome) return null;
    const actual = toNum(actualMass);
    if (!Number.isFinite(actual) || actual < 0) return null;
    const theo = outcome.product.grams;
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
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-4 text-white rounded-t-2xl">
        <h2 className="text-xl font-bold">Limiting Reagent & Percent Yield</h2>
        <p className="text-base opacity-90">
          Paste a <b>balanced</b> equation, choose reactant inputs (mol, g, or solution),
          pick a product, and optionally enter the actual product mass to calculate percent yield.
        </p>
      </div>

      <div className="p-6">
        {/* Equation */}
        <div className="mt-4 grid gap-3">
          <label className="text-base">
            <span className="block text-gray-700 mb-1">Balanced equation</span>
            <input
              value={equation}
              onChange={(e) => setEquation(e.target.value)}
              placeholder="e.g., BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </label>
        </div>

        {/* Reactants + Products */}
        {parsed.ok && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Reactants */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Reactants</h3>
              <div className="mt-2 grid gap-2">
                {parsed.reactMM.map((r, i) => {
                  const a = amounts[i] as Amount | undefined;
                  const kind = a?.kind ?? "mol";
                  return (
                    <div key={`${r.coef}-${r.formula}-${i}`} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-base font-medium">{r.coef !== 1 ? `${r.coef} ` : ""}{r.formula}</div>
                        <div className="text-sm text-gray-500">M = {fmt(r.mm, 4)} g/mol</div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {/* input type */}
                        <select
                          value={kind}
                          onChange={(e) => {
                            const k = e.target.value as Amount["kind"];
                            updateAmount(i, (old) => {
                              const ex = (old as any)?.excess ?? false;
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

                        {/* mark as excess */}
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

                      {/* input fields */}
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

            {/* Products */}
            <div>
              <h3 className="text-base font-semibold">Products</h3>
              <div className="mt-2 grid gap-2">
                {parsed.prodMM.map((p, i) => (
                  <div key={`${p.coef}-${p.formula}-${i}`} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {p.coef !== 1 ? `${p.coef} ` : ""}{p.formula}
                      </div>
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
                    {parsed.prodMM.map((p, i) => (
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
                    placeholder="e.g., 1.82"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-6">
          {error && (
            <div className="rounded-xl bg-amber-600 p-3 text-sm text-white">
              {error}
            </div>
          )}

          {parsed.ok && !error && outcome && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-green-600 p-3 text-white">
                  <div className="text-xs opacity-80">Limiting Reagent</div>
                  <div className="text-sm font-semibold">
                    {outcome.limiting ? outcome.limiting.formula : "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-blue-600 p-3 text-white">
                  <div className="text-xs opacity-80">Reaction Extent (ξ)</div>
                  <div className="text-sm font-semibold">
                    {fmt(outcome.extent, 6)} mol
                  </div>
                </div>
                <div className="rounded-xl bg-purple-600 p-3 text-white">
                  <div className="text-xs opacity-80">
                    Theoretical Yield ({outcome.product.formula})
                  </div>
                  <div className="text-sm font-semibold">
                    {fmt(outcome.product.moles, 6)} mol • {fmt(outcome.product.grams, 4)} g
                  </div>
                </div>
              </div>

              {/* Percent yield */}
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-emerald-600 p-3 text-white md:col-span-3">
                  <div className="text-xs opacity-80">Percent Yield</div>
                  <div className="text-sm font-semibold">
                    {percentYield === null ? "—" : `${fmt(percentYield, 2)} %`}
                  </div>
                </div>
              </div>

              {/* Leftovers */}
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-gray-800 mt-4">
                  Excess Reactants (Leftover)
                </h4>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {outcome.leftovers.map((x) => (
                    <li
                      key={x.formula}
                      className="rounded-lg bg-gray-700 text-white p-3"
                    >
                      <div className="text-sm font-medium">{x.formula}</div>
                      <div className="text-xs opacity-80">
                        {x.excess
                          ? "treated as excess"
                          : `${fmt(x.nLeft, 6)} mol • ${fmt(x.mLeft, 4)} g remaining`}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* --- Show Work --- */}
        {parsed.ok && outcome && (
          <details className="mt-6 text-lg text-gray-800">
            <summary className="cursor-pointer select-none font-semibold">
              Show Calculation Steps
            </summary>
            <div className="mt-4 space-y-4 leading-relaxed">
              <div>
                <b>Step 1:</b> Convert each reactant to moles.
                {parsed.reactMM.map((r, i) => {
                  const a = amounts[i];
                  const n = outcome.nReact?.[i];
                  if (!a) return null;
                  if (a.kind === "g") {
                    return (
                      <p key={i}>
                        {r.formula}: n = m / M = {a.value} ÷ {fmt(r.mm, 3)} ={" "}
                        <b>{fmt(n, 4)} mol</b>
                      </p>
                    );
                  }
                  if (a.kind === "mol") {
                    return (
                      <p key={i}>
                        {r.formula}: given directly = <b>{a.value || "—"} mol</b>
                      </p>
                    );
                  }
                  if (a.kind === "solution") {
                    return (
                      <p key={i}>
                        {r.formula}: n = M × V = {a.molarity} × {a.volume}
                        {a.volUnit} → <b>{fmt(n, 4)} mol</b>
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              <div>
                <b>Step 2:</b> Compute possible reaction extent ξ = nᵢ / νᵢ.  
                {parsed.reactMM.map((r, i) => {
                  const n = outcome.nReact?.[i];
                  if (!Number.isFinite(n)) return null;
                  return (
                    <p key={i}>
                      For {r.formula}: ξ = {fmt(n, 4)} ÷ {r.coef} ={" "}
                      <b>{fmt(n / r.coef, 4)} mol</b>
                    </p>
                  );
                })}
              </div>

              <div>
                <b>Step 3:</b> Limiting reagent is{" "}
                <b>{outcome.limiting?.formula || "—"}</b> since it gives the
                smallest ξ = <b>{fmt(outcome.extent, 4)}</b>.
              </div>

              <div>
                <b>Step 4:</b> Theoretical yield.  
                n = ξ × ν<sub>{outcome.product.formula}</sub> ={" "}
                {fmt(outcome.extent, 4)} × {parsed.prodMM[targetIdx]?.coef} ={" "}
                <b>{fmt(outcome.product.moles, 4)} mol</b>.  
                Mass = n × M = {fmt(outcome.product.moles, 4)} ×{" "}
                {fmt(parsed.prodMM[targetIdx]?.mm, 3)} ={" "}
                <b>{fmt(outcome.product.grams, 4)} g</b>.
              </div>

              <div>
                <b>Step 5:</b> Percent yield = (actual ÷ theoretical) × 100.{" "} 
                {actualMass
                  ? `${actualMass} ÷ ${fmt(outcome.product.grams, 4)} × 100 = ${fmt(
                      percentYield,
                      2
                    )}%`
                  : "Enter actual mass to compute."}
              </div>
            </div>
          </details>
        )}

        {/* Examples */}
        <div className="mt-6">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer select-none">Examples</summary>
          <ul className="ml-4 mt-2 list-disc space-y-1">
              <li>
                <button className="underline hover:text-blue-600" onClick={() => setEquation("BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2")} type="button">
                  BaCl2 + 2 AgNO3 -> 2 AgCl + Ba(NO3)2
                </button>
              </li>
              <li>
                <button className="underline hover:text-blue-600" onClick={() => setEquation("2 H2 + O2 -> 2 H2O")} type="button">
                  2 H2 + O2 -> 2 H2O
                </button>
              </li>
              <li>
                <button className="underline hover:text-blue-600" onClick={() => setEquation("C3H8 + 5 O2 -> 3 CO2 + 4 H2O")} type="button">
                  C3H8 + 5 O2 -> 3 CO2 + 4 H2O
                </button>
              </li>
              <li>
                <button className="underline hover:text-blue-600" onClick={() => setEquation("2 Al + 3 Cl2 -> 2 AlCl3")} type="button">
                  2 Al + 3 Cl2 -> 2 AlCl3
                </button>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
