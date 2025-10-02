"use client";

import { useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

const R = 0.082057; // L·atm/(mol·K)

type VarKey = "P" | "V" | "n" | "T";

export function GasLawSolver() {
  const [known, setKnown] = useState<VarKey>("P");

  const [P, setP] = useState("1.0");
  const [Punit, setPunit] = useState<"atm" | "kPa">("atm");

  const [V, setV] = useState("22.4");
  const [Vunit, setVunit] = useState<"L" | "mL">("L");

  const [n, setN] = useState("1.0");

  const [T, setT] = useState("273.15");
  const [Tunit, setTunit] = useState<"K" | "C">("K");

  // --- conversions ---
  const toAtm = (val: number, unit: "atm" | "kPa") =>
    unit === "atm" ? val : val / 101.325;
  const fromAtm = (val: number, unit: "atm" | "kPa") =>
    unit === "atm" ? val : val * 101.325;

  const toL = (val: number, unit: "L" | "mL") =>
    unit === "L" ? val : val / 1000;
  const fromL = (val: number, unit: "L" | "mL") =>
    unit === "L" ? val : val * 1000;

  const toK = (val: number, unit: "K" | "C") =>
    unit === "K" ? val : val + 273.15;
  const fromK = (val: number, unit: "K" | "C") =>
    unit === "K" ? val : val - 273.15;

  // --- calculation ---
  const result = useMemo(() => {
    const _P = parseFloat(P);
    const _V = parseFloat(V);
    const _n = parseFloat(n);
    const _T = parseFloat(T);

    if ([ _P, _V, _n, _T ].some((x) => isNaN(x))) return null;

    let val: number | null = null;
    let expr = "";
    let steps: string[] = [];

    try {
      if (known === "P") {
        const vL = toL(_V, Vunit);
        const nVal = _n;
        const tK = toK(_T, Tunit);
        steps.push(`\\text{Convert volume: } ${_V}\\,${Vunit} \\to ${vL}\\,L`);
        steps.push(`\\text{Convert temperature: } ${_T}\\,${Tunit} \\to ${tK}\\,K`);
        expr = String.raw`P = \frac{nRT}{V} = \frac{${nVal}\times ${R}\times ${tK}}{${vL}}`;
        val = (nVal * R * tK) / vL;
        val = fromAtm(val, Punit);
      } else if (known === "V") {
        const pAtm = toAtm(_P, Punit);
        const nVal = _n;
        const tK = toK(_T, Tunit);
        steps.push(`\\text{Convert pressure: } ${_P}\\,${Punit} \\to ${pAtm}\\,atm`);
        steps.push(`\\text{Convert temperature: } ${_T}\\,${Tunit} \\to ${tK}\\,K`);
        expr = String.raw`V = \frac{nRT}{P} = \frac{${nVal}\times ${R}\times ${tK}}{${pAtm}}`;
        val = (nVal * R * tK) / pAtm;
        val = fromL(val, Vunit);
      } else if (known === "n") {
        const pAtm = toAtm(_P, Punit);
        const vL = toL(_V, Vunit);
        const tK = toK(_T, Tunit);
        steps.push(`\\text{Convert pressure: } ${_P}\\,${Punit} \\to ${pAtm}\\,atm`);
        steps.push(`\\text{Convert volume: } ${_V}\\,${Vunit} \\to ${vL}\\,L`);
        steps.push(`\\text{Convert temperature: } ${_T}\\,${Tunit} \\to ${tK}\\,K`);
        expr = String.raw`n = \frac{PV}{RT} = \frac{${pAtm}\times ${vL}}{${R}\times ${tK}}`;
        val = (pAtm * vL) / (R * tK);
      } else if (known === "T") {
        const pAtm = toAtm(_P, Punit);
        const vL = toL(_V, Vunit);
        const nVal = _n;
        steps.push(`\\text{Convert pressure: } ${_P}\\,${Punit} \\to ${pAtm}\\,atm`);
        steps.push(`\\text{Convert volume: } ${_V}\\,${Vunit} \\to ${vL}\\,L`);
        expr = String.raw`T = \frac{PV}{nR} = \frac{${pAtm}\times ${vL}}{${nVal}\times ${R}}`;
        val = (pAtm * vL) / (nVal * R);
        val = fromK(val, Tunit);
      }
    } catch {
      val = null;
    }

    return { val, expr, steps };
  }, [known, P, V, n, T, Punit, Vunit, Tunit]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-cyan-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Ideal Gas Law Solver</h2>
        <p className="text-base opacity-90">PV = nRT</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Known picker */}
        <div>
          <p className="mb-2 text-sm text-gray-600">Solve for:</p>
          <div className="flex flex-wrap gap-2">
            {(["P", "V", "n", "T"] as VarKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setKnown(k)}
                className={`rounded-lg px-3 py-1 text-sm font-medium ${
                  known === k
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Pressure */}
          <label className="text-base">
            Pressure:
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={P}
                onChange={(e) => setP(e.target.value)}
                disabled={known === "P"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <select
                value={Punit}
                onChange={(e) => setPunit(e.target.value as any)}
                disabled={known === "P"}
                className="rounded-lg border border-gray-300 px-2 py-2"
              >
                <option value="atm">atm</option>
                <option value="kPa">kPa</option>
              </select>
            </div>
          </label>

          {/* Volume */}
          <label className="text-base">
            Volume:
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={V}
                onChange={(e) => setV(e.target.value)}
                disabled={known === "V"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <select
                value={Vunit}
                onChange={(e) => setVunit(e.target.value as any)}
                disabled={known === "V"}
                className="rounded-lg border border-gray-300 px-2 py-2"
              >
                <option value="L">L</option>
                <option value="mL">mL</option>
              </select>
            </div>
          </label>

          {/* Moles */}
          <label className="text-base">
            Moles (n):
            <input
              type="number"
              value={n}
              onChange={(e) => setN(e.target.value)}
              disabled={known === "n"}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>

          {/* Temperature */}
          <label className="text-base">
            Temperature:
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={T}
                onChange={(e) => setT(e.target.value)}
                disabled={known === "T"}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <select
                value={Tunit}
                onChange={(e) => setTunit(e.target.value as any)}
                disabled={known === "T"}
                className="rounded-lg border border-gray-300 px-2 py-2"
              >
                <option value="K">K</option>
                <option value="C">°C</option>
              </select>
            </div>
          </label>
        </div>

        {/* Result */}
        {result && result.val !== null && (
          <div className="rounded-xl bg-cyan-50 p-4 text-lg">
            <div className="mb-2 text-gray-600">Result:</div>
            <div className="font-semibold text-cyan-800">
              {known} = {result.val.toFixed(4)}{" "}
              {known === "P" ? Punit : known === "V" ? Vunit : known === "T" ? Tunit : "mol"}
            </div>
          </div>
        )}

        {/* Show Work */}
        {result && result.steps && (
          <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work
            </summary>
            <div className="mt-3 space-y-4">
              {/* Step 1: Conversions */}
              {result.steps.map((s, i) => (
                <div key={i} className="pl-2 border-l-4 border-cyan-400">
                  <div className="font-medium text-gray-700">Step {i + 1}: Conversion</div>
                  <BlockMath math={s} />
                </div>
              ))}

              {/* Step 2: Plug into equation */}
              <div className="pl-2 border-l-4 border-cyan-600">
                <div className="font-medium text-gray-700">Final Step — Solve</div>
                <BlockMath math={result.expr} />
                <div className="mt-2 rounded-lg bg-cyan-100 text-cyan-800 px-3 py-2 inline-block">
                  <b>
                    {known} = {result.val?.toFixed(4)}{" "}
                    {known === "P" ? Punit : known === "V" ? Vunit : known === "T" ? Tunit : "mol"}
                  </b>
                </div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
