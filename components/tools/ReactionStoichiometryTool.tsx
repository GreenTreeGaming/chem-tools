"use client";

import { useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";
import { elements } from "@/utils/elementsData";

const NA = 6.02214076e23; // Avogadro
const VM = 22.4; // L/mol at STP

// quick molar mass lookup
const AW = new Map<string, number>(
  elements
    .filter((e) => typeof e.atomicWeight === "number")
    .map((e) => [e.symbol, e.atomicWeight as number])
);

type SpeciesInfo = { coeff: number; formula: string };

function parseReaction(reaction: string): { reactants: SpeciesInfo[]; products: SpeciesInfo[] } {
  const [lhs, rhs] = reaction.split(/->|→/).map((s) => s.trim());
  if (!lhs || !rhs) return { reactants: [], products: [] };

  const parseSide = (side: string): SpeciesInfo[] =>
    side.split("+").map((s) => {
      const part = s.trim();
      const m = part.match(/^(\d+)?\s*([A-Za-z0-9()^+\-]+)$/);
      if (!m) return { coeff: 1, formula: part };
      return { coeff: m[1] ? parseInt(m[1], 10) : 1, formula: m[2] };
    });

  return { reactants: parseSide(lhs), products: parseSide(rhs) };
}

// parse formula → molar mass
function molarMass(formula: string): number {
  const ELEMENT_RE = /[A-Z][a-z]?/y;
  const NUM_RE = /\d+/y;
  const s = formula.replace(/\s+/g, "");
  const stack: Record<string, number>[] = [Object.create(null)];
  let i = 0;
  const add = (map: Record<string, number>, k: string, n: number) => {
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
      const group = stack.pop()!;
      const top = stack[stack.length - 1];
      for (const [el, cnt] of Object.entries(group)) add(top, el, cnt * mult);
      continue;
    }
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
    i++;
  }

  const counts = stack[0];
  let mass = 0;
  for (const [sym, n] of Object.entries(counts)) {
    const aw = AW.get(sym);
    if (!aw) continue;
    mass += aw * n;
  }
  return mass;
}

function fmtSciPlain(x: number | null, sig = 4): string {
  if (x === null || !Number.isFinite(x)) return "—";
  if (x === 0) return "0";

  const absx = Math.abs(x);
  if (absx >= 1e-3 && absx < 1e4) {
    return Number(x.toPrecision(sig)).toString();
  }

  const exp = Math.floor(Math.log10(absx));
  const mant = x / Math.pow(10, exp);
  const mantRounded = Number(mant.toPrecision(sig));

  return `${mantRounded} × 10^${exp}`;
}

export function ReactionStoichiometryTool() {
  const [reaction, setReaction] = useState("N2 + 3H2 -> 2NH3");
  const [given, setGiven] = useState({ species: "N2", amount: "10", unit: "mol" });
  const [target, setTarget] = useState({ species: "NH3", unit: "mol" });

  const { reactants, products } = useMemo(() => parseReaction(reaction), [reaction]);

  const calc = useMemo(() => {
    try {
      const coeffMap: Record<string, number> = {};
      [...reactants, ...products].forEach((s) => {
        coeffMap[s.formula] = s.coeff;
      });

      const gCoeff = coeffMap[given.species];
      const tCoeff = coeffMap[target.species];
      if (!gCoeff || !tCoeff) return null;

      const gAmount = parseFloat(given.amount);
      if (!Number.isFinite(gAmount)) return null;

      // convert given to moles
      let nGiven: number;
      let mmGiven = molarMass(given.species);
      let mmTarget = molarMass(target.species);

      switch (given.unit) {
        case "mol":
          nGiven = gAmount;
          break;
        case "g":
          nGiven = gAmount / mmGiven;
          break;
        case "particles":
          nGiven = gAmount / NA;
          break;
        case "L":
          nGiven = gAmount / VM;
          break;
        default:
          return null;
      }

      // ratio
      const nTarget = nGiven * (tCoeff / gCoeff);

      // convert target back
      let final: string;
      switch (target.unit) {
        case "mol":
          final = `${fmtSciPlain(nTarget)} mol`;
          break;
        case "g":
          final = `${fmtSciPlain(nTarget * mmTarget)} g`;
          break;
        case "particles":
          final = `${fmtSciPlain(nTarget * NA)} particles`;
          break;
        case "L":
          final = `${fmtSciPlain(nTarget * VM)} L (at STP)`;
          break;
        default:
          final = "—";
      }

      return {
        gCoeff,
        tCoeff,
        nGiven,
        nTarget,
        mmGiven,
        mmTarget,
        final,
      };
    } catch {
      return null;
    }
  }, [reaction, given, target, reactants, products]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-emerald-500 text-white px-6 py-4 rounded-t-2xl">
        <h2 className="text-xl font-bold">Reaction Stoichiometry</h2>
        <p className="text-base opacity-90">
          Convert between reactants and products using mole ratios
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Reaction input */}
        <label className="block text-base">
          <span className="text-gray-700">Reaction (balanced)</span>
          <input
            value={reaction}
            onChange={(e) => setReaction(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm"
            placeholder="e.g. N2 + 3H2 -> 2NH3"
          />
        </label>

        {/* Given */}
        <div>
          <h3 className="font-semibold text-gray-800">Given</h3>
          <input
            type="text"
            value={given.species}
            onChange={(e) => setGiven({ ...given, species: e.target.value })}
            placeholder="Species (e.g. N2)"
            className="mr-2 rounded-xl border px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={given.amount}
            onChange={(e) => setGiven({ ...given, amount: e.target.value })}
            placeholder="Amount"
            className="mr-2 w-24 rounded-xl border px-3 py-2 text-sm"
          />
          <select
            value={given.unit}
            onChange={(e) => setGiven({ ...given, unit: e.target.value })}
            className="rounded-xl border px-2 py-2 text-sm"
          >
            <option value="mol">mol</option>
            <option value="g">grams</option>
            <option value="particles">particles</option>
            <option value="L">liters (gas, STP)</option>
          </select>
        </div>

        {/* Target */}
        <div>
          <h3 className="font-semibold text-gray-800">Target</h3>
          <input
            type="text"
            value={target.species}
            onChange={(e) => setTarget({ ...target, species: e.target.value })}
            placeholder="Species (e.g. NH3)"
            className="mr-2 rounded-xl border px-3 py-2 text-sm"
          />
          <select
            value={target.unit}
            onChange={(e) => setTarget({ ...target, unit: e.target.value })}
            className="rounded-xl border px-2 py-2 text-sm"
          >
            <option value="mol">mol</option>
            <option value="g">grams</option>
            <option value="particles">particles</option>
            <option value="L">liters (gas, STP)</option>
          </select>
        </div>

        {/* Result */}
        <div className="rounded-xl bg-cyan-50 p-4 text-lg font-semibold text-cyan-800">
          Result: {calc?.final ?? "—"}
        </div>

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <h3 className="font-bold text-base mb-2">Formulas</h3>
          <ul className="space-y-2">
            <li><BlockMath math="n_{target} = n_{given} \times \tfrac{\text{coeff}_{target}}{\text{coeff}_{given}}" /></li>
            <li><BlockMath math="m = n \times M" /></li>
            <li><BlockMath math="N = n \times N_a" /></li>
            <li><BlockMath math="V = n \times 22.4\ \text{L (STP)}" /></li>
          </ul>
        </div>

        {/* Show Work */}
        {calc && (
          <details className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work (with your inputs)
            </summary>
            <div className="mt-4 space-y-5">
              {/* Step 1 */}
              <div className="pl-2 border-l-4 border-cyan-400">
                <div className="font-medium text-gray-800">Step 1 — Convert Given to Moles</div>
                <BlockMath math={
                  given.unit === "mol"
                    ? `n_{given} = ${given.amount}\\ \\text{mol}`
                    : given.unit === "g"
                    ? `n_{given} = \\tfrac{${given.amount}}{${fmtSciPlain(calc.mmGiven)}} = ${fmtSciPlain(calc.nGiven)}\\ \\text{mol}`
                    : given.unit === "particles"
                    ? `n_{given} = \\tfrac{${given.amount}}{${NA.toExponential(3)}} = ${fmtSciPlain(calc.nGiven)}\\ \\text{mol}`
                    : `n_{given} = \\tfrac{${given.amount}}{22.4} = ${fmtSciPlain(calc.nGiven)}\\ \\text{mol}`
                } />
                {/* ✅ highlight box */}
                <div className="mt-2 inline-block rounded bg-cyan-100 text-cyan-800 px-2 py-1 font-semibold">
                  n₍given₎ = {fmtSciPlain(calc.nGiven)} mol
                </div>
              </div>

              {/* Step 2 */}
              <div className="pl-2 border-l-4 border-cyan-600">
                <div className="font-medium text-gray-800">Step 2 — Mole Ratio</div>
                <BlockMath math={`n_{target} = ${fmtSciPlain(calc.nGiven)} \\times \\tfrac{${calc.tCoeff}}{${calc.gCoeff}} = ${fmtSciPlain(calc.nTarget)}\\ \\text{mol}`} />
                {/* ✅ highlight box */}
                <div className="mt-2 inline-block rounded bg-cyan-100 text-cyan-800 px-2 py-1 font-semibold">
                  n₍target₎ = {fmtSciPlain(calc.nTarget)} mol
                </div>
              </div>

              {/* Step 3 */}
              <div className="pl-2 border-l-4 border-emerald-600">
                <div className="font-medium text-gray-800">Step 3 — Convert Target to Desired Unit</div>
                <BlockMath math={
                  target.unit === "mol"
                    ? `n_{target} = ${fmtSciPlain(calc.nTarget)}\\ \\text{mol}`
                    : target.unit === "g"
                    ? `m = n \\times M = ${fmtSciPlain(calc.nTarget)} \\times ${fmtSciPlain(calc.mmTarget)} = ${fmtSciPlain(calc.nTarget * calc.mmTarget)}\\ \\text{g}`
                    : target.unit === "particles"
                    ? `N = n \\times N_a = ${fmtSciPlain(calc.nTarget)} \\times ${NA.toExponential(3)} = ${fmtSciPlain(calc.nTarget * NA)}`
                    : `V = n \\times 22.4 = ${fmtSciPlain(calc.nTarget)} \\times 22.4 = ${fmtSciPlain(calc.nTarget * VM)}\\ \\text{L}`
                } />
                {/* ✅ highlight box */}
                <div className="mt-2 inline-block rounded bg-emerald-100 text-emerald-800 px-2 py-1 font-semibold">
                  {calc.final}
                </div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}