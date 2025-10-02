"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BlockMath } from "react-katex";

/**
 * ===========================
 *  UI COMPONENT
 * ===========================
 */
export function EquationBalancer() {
  const [input, setInput] = useState("Fe + O2 -> Fe2O3");
  const [result, setResult] = useState<ReactNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const examples = useMemo(
    () => [
      "Fe + O2 -> Fe2O3",
      "C3H8 + O2 -> CO2 + H2O",
      "Al + O2 -> Al2O3",
      "KMnO4 + HCl -> KCl + MnCl2 + H2O + Cl2",
      "Na3PO4 + BaCl2 -> Ba3(PO4)2 + NaCl",
    ],
    []
  );

  function handleBalance() {
    setError(null);
    setResult(null);
    try {
      const balanced = balanceEquation(input);
      setResult(balanced);
    } catch (e: any) {
      setError(e?.message || "Could not balance equation.");
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-rose-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Equation Balancer</h2>
        <p className="text-base opacity-90">
          Paste an unbalanced equation like <code>Fe + O₂ → Fe₂O₃</code>.  
          Use <code className="mx-1">+</code> for species, <code className="mx-1">→</code> or <code>-&gt;</code> for arrows.
        </p>
      </div>

      <div className="p-6 grid gap-4">
        {/* Input */}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="e.g., C3H8 + O2 -> CO2 + H2O"
          spellCheck={false}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-lg shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-200"
        />

        {/* Example buttons */}
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              type="button"
              className="rounded-lg bg-gray-100 text-gray-700 border border-gray-300 px-3 py-1 text-sm font-medium shadow-sm hover:bg-gray-200"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleBalance}
            type="button"
            className="inline-flex items-center justify-center rounded-xl bg-rose-600 text-white px-5 py-2 text-base font-semibold shadow-sm hover:bg-rose-700"
          >
            Balance
          </button>
          <button
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
            type="button"
            className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Clear
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-xl bg-rose-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Result:</div>
            <div className="font-semibold text-rose-800">{result}</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-300 text-red-800 p-4 text-lg font-medium shadow-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ===========================
 *  BALANCER CORE (No deps)
 * ===========================
 */
function bigAbs(a: bigint) { return a < 0n ? -a : a; }
function bigGcd(a: bigint, b: bigint): bigint {
  a = bigAbs(a); b = bigAbs(b);
  while (b !== 0n) { const t = b; b = a % b; a = t; }
  return a || 1n;
}
function bigLcm(a: bigint, b: bigint): bigint {
  return (a === 0n || b === 0n) ? 0n : (bigAbs(a / bigGcd(a, b) * b));
}

class Frac {
  n: bigint; d: bigint;
  constructor(n: bigint | number, d: bigint | number = 1n) {
    this.n = BigInt(n); this.d = BigInt(d);
    if (this.d === 0n) throw new Error("Divide by zero");
    this.normalize();
  }
  private normalize() {
    if (this.d < 0n) { this.n = -this.n; this.d = -this.d; }
    const g = bigGcd(this.n, this.d);
    this.n /= g; this.d /= g;
  }
  static zero() { return new Frac(0n, 1n); }
  static one() { return new Frac(1n, 1n); }
  add(o: Frac) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o: Frac) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o: Frac) { return new Frac(this.n * o.n, this.d * o.d); }
  div(o: Frac) { return new Frac(this.n * o.d, this.d * o.n); }
  neg() { return new Frac(-this.n, this.d); }
  isZero() { return this.n === 0n; }
  eq(o: Frac) { return this.n === o.n && this.d === o.d; }
}

function toLatexFormula(formula: string): string {
  // replace numbers with _{number}
  return formula.replace(/(\d+)/g, "_{$1}");
}

type Counts = Record<string, number>;
const ELEMENT_RE = /[A-Z][a-z]?/y;
const NUM_RE = /\d+/y;

function parseCompound(formula: string): Counts {
  const stack: Counts[] = [Object.create(null)];
  let i = 0;
  const applyCount = (map: Counts, key: string, add: number) => {
    map[key] = (map[key] || 0) + add;
  };
  while (i < formula.length) {
    const ch = formula[i];
    if (ch === "(") { stack.push(Object.create(null)); i++; continue; }
    if (ch === ")") {
      i++;
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(formula);
      const mult = m ? parseInt(m[0], 10) : 1;
      if (m) i = NUM_RE.lastIndex;
      const group = stack.pop();
      if (!group) throw new Error("Mismatched parentheses");
      const top = stack[stack.length - 1];
      for (const [el, cnt] of Object.entries(group)) applyCount(top, el, cnt * mult);
      continue;
    }
    ELEMENT_RE.lastIndex = i;
    const e = ELEMENT_RE.exec(formula);
    if (e) {
      const el = e[0];
      i = ELEMENT_RE.lastIndex;
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(formula);
      const mult = m ? parseInt(m[0], 10) : 1;
      if (m) i = NUM_RE.lastIndex;
      applyCount(stack[stack.length - 1], el, mult);
      continue;
    }
    if (ch === "·" || ch === ".") { i++; continue; }
    if (/\s|\+/.test(ch)) { i++; continue; }
    throw new Error(`Unexpected token '${ch}' in formula '${formula}'`);
  }
  if (stack.length !== 1) throw new Error("Mismatched parentheses");
  return stack[0];
}

function splitArrow(eq: string) {
  const arrow = /\-\>|\=\>|\u2192|=>|=|→/;
  const parts = eq.split(arrow);
  if (parts.length !== 2) throw new Error("Could not find a single reaction arrow.");
  const left = parts[0].split("+").map((s) => s.trim()).filter(Boolean);
  const right = parts[1].split("+").map((s) => s.trim()).filter(Boolean);
  if (!left.length || !right.length) throw new Error("Both sides of the equation must have species.");
  return { left, right };
}

function buildMatrix(left: string[], right: string[]) {
  const species = [...left, ...right];
  const counts = species.map(parseCompound);
  const elements = Array.from(new Set(counts.flatMap((c) => Object.keys(c)))).sort();
  const A: Frac[][] = elements.map(() => species.map(() => Frac.zero()));
  elements.forEach((el, r) => {
    species.forEach((sp, c) => {
      const v = counts[c][el] || 0;
      const sign = c < left.length ? 1 : -1;
      A[r][c] = new Frac(sign * v, 1n);
    });
  });
  return { A, species, leftCount: left.length };
}

function rref(A: Frac[][]): { R: Frac[][]; rank: number; pivotCols: number[] } {
  const R = A.map((row) => row.map((x) => new Frac(x.n, x.d)));
  const nRows = R.length;
  const nCols = R[0]?.length ?? 0;
  let lead = 0;
  const pivotCols: number[] = [];
  for (let r = 0; r < nRows; r++) {
    if (lead >= nCols) break;
    let i = r;
    while (i < nRows && R[i][lead].isZero()) i++;
    if (i === nRows) { lead++; r--; continue; }
    if (i !== r) { const tmp = R[i]; R[i] = R[r]; R[r] = tmp; }
    const pivot = R[r][lead];
    for (let j = 0; j < nCols; j++) R[r][j] = R[r][j].div(pivot);
    for (let i2 = 0; i2 < nRows; i2++) {
      if (i2 === r) continue;
      if (!R[i2][lead].isZero()) {
        const factor = R[i2][lead];
        for (let j = 0; j < nCols; j++) {
          R[i2][j] = R[i2][j].sub(factor.mul(R[r][j]));
        }
      }
    }
    pivotCols.push(lead);
    lead++;
  }
  return { R, rank: pivotCols.length, pivotCols };
}

function nullspaceVector(A: Frac[][]): Frac[] {
  if (A.length === 0) throw new Error("Empty matrix.");
  const nCols = A[0].length;
  const { R, pivotCols } = rref(A);
  const piv = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let c = 0; c < nCols; c++) if (!piv.has(c)) freeCols.push(c);
  if (freeCols.length === 0) throw new Error("No free variable; equation may be overconstrained.");
  const free = freeCols[freeCols.length - 1];
  const x: Frac[] = Array.from({ length: nCols }, () => Frac.zero());
  x[free] = Frac.one();
  for (let r = 0; r < R.length; r++) {
    const row = R[r];
    let p = row.findIndex((v) => v.eq(Frac.one()));
    if (p === -1) continue;
    let sum = Frac.zero();
    for (let c = 0; c < nCols; c++) {
      if (c === p) continue;
      if (!row[c].isZero()) sum = sum.add(row[c].mul(x[c]));
    }
    x[p] = sum.neg();
  }
  let lcm = 1n;
  for (const xi of x) lcm = bigLcm(lcm, xi.d);
  const ints = x.map((xi) => xi.n * (lcm / xi.d));
  const allNeg = ints.every((v) => v <= 0n);
  const intsSigned = ints.map((v) => v * (allNeg ? -1n : 1n));
  let g = intsSigned.reduce((acc, v) => bigGcd(acc, v), bigAbs(intsSigned[0] || 1n));
  if (g === 0n) g = 1n;
  return intsSigned.map((v) => new Frac(v / g, 1n));
}

function gcdArray(nums: number[]): number {
  return nums.reduce((g, v) => {
    let a = Math.abs(v);   // <-- make this mutable
    let b = g;             // also mutable
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }, Math.abs(nums[0] || 1));
}

function balanceEquation(eq: string): ReactNode {
  const sanitized = eq.replace(/\s+-\s+(?=[A-Za-z(])/g, " + ");
  const { left, right } = splitArrow(sanitized);
  const { A, leftCount } = buildMatrix(left, right);
  const coeffs = nullspaceVector(A);
  const ints = coeffs.map((f) => Number(f.n));

  // ✅ Reduce coefficients by gcd
  const g = gcdArray(ints);
  const reduced = ints.map((c) => c / g);

  const fmtSide = (items: string[], offset: number, arr: number[]) =>
  items
    .map((s, idx) => {
      const k = arr[offset + idx];
      const coef = Math.abs(k);
      const latexFormula = toLatexFormula(s); // ✅ convert to KaTeX subscripts
      return `${coef === 1 ? "" : coef} ${latexFormula}`;
    })
    .join(" + ");

  // Build LaTeX from reduced form
  const latexReduced =
    fmtSide(left, 0, reduced) + " \\; \\rightarrow \\; " + fmtSide(right, leftCount, reduced);

  // If user’s input matches the reduced form, return that
  const userNoSpaces = sanitized.replace(/\s+/g, "");
  const reducedNoSpaces = latexReduced
    .replace(/\\;|\\rightarrow/g, "")
    .replace(/\s+/g, "")
    .replace(/\+/g, "+")
    .replace(/(\d) /g, "$1");

  if (userNoSpaces === reducedNoSpaces) {
    return <BlockMath math={latexReduced} />;
  }

  // Otherwise, return full balanced version
  const latexFull =
    fmtSide(left, 0, ints) + " \\; \\rightarrow \\; " + fmtSide(right, leftCount, ints);

  return <BlockMath math={latexFull} />;
}