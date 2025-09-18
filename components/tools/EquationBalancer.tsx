"use client";

import { useMemo, useState } from "react";

/**
 * ===========================
 *  UI COMPONENT
 * ===========================
 */
export function EquationBalancer() {
  const [input, setInput] = useState("Fe + O2 -> Fe2O3");
  const [result, setResult] = useState<string | null>(null);
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
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Equation Balancer</h2>
      <p className="text-sm text-gray-500">
        Paste an unbalanced equation like <code>Fe + O2 -> Fe2O3</code>. Use
        <code className="mx-1">+</code> to separate species and
        <code className="mx-1">→</code>/<code className="mx-1">-&gt;</code> as the arrow. Parentheses supported.
      </p>

      <div className="mt-4 grid gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder="e.g., C3H8 + O2 -> CO2 + H2O"
          spellCheck={false}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
        />
        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs hover:bg-gray-100"
              onClick={() => setInput(ex)}
              type="button"
              aria-label={`Use example ${ex}`}
            >
              {ex}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBalance}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            type="button"
          >
            Balance
          </button>
          <button
            onClick={() => {
              setInput("");
              setResult(null);
              setError(null);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            type="button"
          >
            Clear
          </button>
        </div>

        {result && (
          <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
            <span className="font-medium">Balanced:</span> {result}
          </div>
        )}
        {error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <details className="mt-3 text-xs text-gray-500">
          <summary className="cursor-pointer select-none">Tips</summary>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Use <code>( )</code> for groups, e.g. <code>Ba3(PO4)2</code>.</li>
            <li>Arrows accepted: <code>-&gt;</code>, <code>=&gt;</code>, <code>→</code>, or <code>=</code>.</li>
            <li>No need to type coefficients — we’ll compute the smallest whole numbers.</li>
          </ul>
        </details>
      </div>
    </div>
  );
}

/**
 * ===========================
 *  BALANCER CORE (No deps)
 * ===========================
 * - Parses formulas with nested parentheses.
 * - Builds element matrix A where A * x = 0 (left positive, right negative).
 * - Finds a nontrivial nullspace vector using exact BigInt rational arithmetic.
 * - Scales to smallest whole numbers and formats.
 */

// ---------- Utilities: GCD / LCM for BigInt ----------
function bigAbs(a: bigint) { return a < 0n ? -a : a; }
function bigGcd(a: bigint, b: bigint): bigint {
  a = bigAbs(a); b = bigAbs(b);
  while (b !== 0n) { const t = b; b = a % b; a = t; }
  return a || 1n;
}
function bigLcm(a: bigint, b: bigint): bigint {
  return (a === 0n || b === 0n) ? 0n : (bigAbs(a / bigGcd(a, b) * b));
}

// ---------- Exact Fraction using BigInt ----------
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

// ---------- Formula parser (supports nested parentheses) ----------
type Counts = Record<string, number>;
const ELEMENT_RE = /[A-Z][a-z]?/y;
const NUM_RE = /\d+/y;

function parseCompound(formula: string): Counts {
  // Shunting-yard like stack of count maps
  const stack: Counts[] = [Object.create(null)];
  let i = 0;

  const applyCount = (map: Counts, key: string, add: number) => {
    map[key] = (map[key] || 0) + add;
  };

  while (i < formula.length) {
    const ch = formula[i];

    if (ch === "(") {
      stack.push(Object.create(null));
      i++;
      continue;
    }
    if (ch === ")") {
      i++;
      // read multiplier
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(formula);
      const mult = m ? parseInt(m[0], 10) : 1;
      if (m) i = NUM_RE.lastIndex;

      const group = stack.pop();
      if (!group) throw new Error("Mismatched parentheses");
      const top = stack[stack.length - 1];
      for (const [el, cnt] of Object.entries(group)) {
        applyCount(top, el, cnt * mult);
      }
      continue;
    }

    // element token
    ELEMENT_RE.lastIndex = i;
    const e = ELEMENT_RE.exec(formula);
    if (e) {
      const el = e[0];
      i = ELEMENT_RE.lastIndex;
      // possible number
      NUM_RE.lastIndex = i;
      const m = NUM_RE.exec(formula);
      const mult = m ? parseInt(m[0], 10) : 1;
      if (m) i = NUM_RE.lastIndex;
      applyCount(stack[stack.length - 1], el, mult);
      continue;
    }

    // dot/hydrate (·) or separators—treat as plus: split part after it as separate group
    if (ch === "·" || ch === ".") {
      // We’ll just treat it as concatenation (CuSO4·5H2O -> counts added)
      i++;
      continue;
    }

    // whitespace or plus
    if (/\s|\+/.test(ch)) { i++; continue; }

    throw new Error(`Unexpected token '${ch}' in formula '${formula}'`);
  }
  if (stack.length !== 1) throw new Error("Mismatched parentheses");
  return stack[0];
}

// ---------- Equation parsing ----------
function splitArrow(eq: string) {
  const arrow = /\-\>|\=\>|\u2192|=>|=|→/; // ->, =>, =, → supported
  const parts = eq.split(arrow);
  if (parts.length !== 2) throw new Error("Could not find a single reaction arrow.");
  const left = parts[0].split("+").map((s) => s.trim()).filter(Boolean);
  const right = parts[1].split("+").map((s) => s.trim()).filter(Boolean);
  if (!left.length || !right.length) throw new Error("Both sides of the equation must have species.");
  return { left, right };
}

// ---------- Build element matrix A such that A * x = 0 ----------
function buildMatrix(left: string[], right: string[]) {
  const species = [...left, ...right];
  const counts = species.map(parseCompound);

  // collect elements (rows)
  const elements = Array.from(
    new Set(counts.flatMap((c) => Object.keys(c)))
  ).sort();

  // rows = elements, cols = species (left positive, right negative)
  const A: Frac[][] = elements.map(() =>
    species.map(() => Frac.zero())
  );

  elements.forEach((el, r) => {
    species.forEach((sp, c) => {
      const v = counts[c][el] || 0;
      const sign = c < left.length ? 1 : -1; // products negative
      A[r][c] = new Frac(sign * v, 1n);
    });
  });

  return { A, elements, species, leftCount: left.length };
}

// ---------- RREF & nullspace (1D) ----------
function rref(A: Frac[][]): { R: Frac[][]; rank: number; pivotCols: number[] } {
  const R = A.map((row) => row.map((x) => new Frac(x.n, x.d)));
  const nRows = R.length;
  const nCols = R[0]?.length ?? 0;

  let lead = 0;
  const pivotCols: number[] = [];

  for (let r = 0; r < nRows; r++) {
    if (lead >= nCols) break;

    // find pivot
    let i = r;
    while (i < nRows && R[i][lead].isZero()) i++;
    if (i === nRows) {
      lead++;
      r--;
      continue;
    }

    // swap
    if (i !== r) {
      const tmp = R[i]; R[i] = R[r]; R[r] = tmp;
    }

    // normalize row r
    const pivot = R[r][lead];
    for (let j = 0; j < nCols; j++) R[r][j] = R[r][j].div(pivot);

    // eliminate other rows
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

// Find one nullspace vector (assuming 1D nullspace typical for balancing)
function nullspaceVector(A: Frac[][]): Frac[] {
  if (A.length === 0) throw new Error("Empty matrix.");
  const nCols = A[0].length;
  const { R, pivotCols } = rref(A);

  // Choose a free column (prefer the last)
  const piv = new Set(pivotCols);
  const freeCols: number[] = [];
  for (let c = 0; c < nCols; c++) if (!piv.has(c)) freeCols.push(c);
  if (freeCols.length === 0) throw new Error("No free variable; equation may be overconstrained.");
  const free = freeCols[freeCols.length - 1];

  // Initialize solution x with x_free = 1
  const x: Frac[] = Array.from({ length: nCols }, () => Frac.zero());
  x[free] = Frac.one();

  // For each pivot row, solve pivotCol in terms of free variables
  // R is in RREF: for each pivot row r, there is exactly one pivot at col p, and R[r][p] = 1
  for (let r = 0; r < R.length; r++) {
    const row = R[r];
    let p = row.findIndex((v) => v.eq(Frac.one())); // pivot column
    if (p === -1) continue;

    // x_pivot = - sum_{j != p} R[r][j] * x_j
    let sum = Frac.zero();
    for (let c = 0; c < nCols; c++) {
      if (c === p) continue;
      if (!row[c].isZero()) sum = sum.add(row[c].mul(x[c]));
    }
    x[p] = sum.neg();
  }

  // Scale to integers (LCM of denominators), then reduce by GCD
  let lcm = 1n;
  for (const xi of x) lcm = bigLcm(lcm, xi.d);
  const ints = x.map((xi) => (xi.n * (lcm / xi.d)));
  // Avoid negatives (flip sign if necessary)
  const allNeg = ints.every((v) => v <= 0n);
  const allPos = ints.every((v) => v >= 0n);
  const sign = allNeg ? -1n : 1n; // default keep positive if mixed, rely on formatting later
  const intsSigned = ints.map((v) => v * (allNeg ? -1n : 1n));
  // Reduce by GCD
  let g = intsSigned.reduce((acc, v) => bigGcd(acc, v), bigAbs(intsSigned[0] || 1n));
  if (g === 0n) g = 1n;
  return intsSigned.map((v) => new Frac(v / g, 1n));
}

// ---------- Main: balance wrapper & formatting ----------
function balanceEquation(eq: string): string {
  // Normalize arrow typo like "A - B" → user probably meant "A -> B"
  const sanitized = eq.replace(/\s+-\s+(?=[A-Za-z(])/g, " + "); // prevent mistaken "-"
  const { left, right } = splitArrow(sanitized);

  const { A, species, leftCount } = buildMatrix(left, right);
  const coeffs = nullspaceVector(A); // array of Frac (integers after scaling)

  // All coeffs should be integers now
  const ints = coeffs.map((f) => Number(f.n)); // safe: values are small

  // Format: put coefficients (omit '1') and join
  const fmtSide = (items: string[], offset: number) =>
    items
      .map((s, idx) => {
        const k = ints[offset + idx];
        const coef = Math.abs(k);
        return `${coef === 1 ? "" : coef + " "}${s}`;
      })
      .join(" + ");

  const lhs = fmtSide(left, 0);
  const rhs = fmtSide(right, leftCount);

  return `${lhs} → ${rhs}`;
}
