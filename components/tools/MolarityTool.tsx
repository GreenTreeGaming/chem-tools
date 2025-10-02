"use client";

import { useMemo, useState } from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

function toNumber(s: string) {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
function fmt(x: number | null, digits = 3) {
  if (x === null || !Number.isFinite(x)) return "—";
  const ax = Math.abs(x);
  if (ax !== 0 && (ax < 1e-3 || ax >= 1e5)) return x.toExponential(digits);
  return x.toFixed(digits);
}

export function MolarityTool() {
  const [moles, setMoles] = useState("1");
  const [volume, setVolume] = useState("1");
  const [volUnit, setVolUnit] = useState<"L" | "mL">("L");

  const molarity = useMemo(() => {
    const n = toNumber(moles);
    const vInput = toNumber(volume);
    if (!Number.isFinite(n) || !Number.isFinite(vInput)) return null;
    const vL = volUnit === "L" ? vInput : vInput / 1000;
    return vL > 0 ? n / vL : null;
  }, [moles, volume, volUnit]);

  // Dilution helper (C1 V1 = C2 V2)
  const [c1, setC1] = useState("");
  const [v1, setV1] = useState("");
  const [c2, setC2] = useState("");
  const [v2, setV2] = useState("");
  const [vUnitDil, setVUnitDil] = useState<"L" | "mL">("mL");

  const dilution = useMemo(() => {
    const vals = { c1: c1.trim(), v1: v1.trim(), c2: c2.trim(), v2: v2.trim() };
    const blanks = Object.entries(vals).filter(([_, v]) => v === "");
    if (blanks.length !== 1) return { field: null, value: null, steps: null };

    const _c1 = c1 ? toNumber(c1) : null;
    const _c2 = c2 ? toNumber(c2) : null;
    const _v1 = v1 ? toNumber(v1) : null;
    const _v2 = v2 ? toNumber(v2) : null;

    const toL = (v: number | null) => (v === null ? null : vUnitDil === "L" ? v : v / 1000);
    const v1L = toL(_v1);
    const v2L = toL(_v2);

    const blank = blanks[0][0];
    let value: number | null = null;
    let steps: string | null = null;

    switch (blank) {
      case "c1":
        if (v1L && _c2 !== null && v2L) {
          value = (_c2 * v2L) / v1L;
          steps = String.raw`C_1 = \frac{C_2 V_2}{V_1} = \frac{${_c2}\times ${fmt(v2L)}}{${fmt(v1L)}}`;
        }
        break;
      case "v1":
        if (_c1 !== null && _c2 !== null && _c1 > 0 && v2L !== null) {
          value = (_c2 * v2L) / _c1;
          steps = String.raw`V_1 = \frac{C_2 V_2}{C_1} = \frac{${_c2}\times ${fmt(v2L)}}{${_c1}}`;
        }
        break;
      case "c2":
        if (_c1 !== null && v1L && v2L) {
          value = (_c1 * v1L) / v2L;
          steps = String.raw`C_2 = \frac{C_1 V_1}{V_2} = \frac{${_c1}\times ${fmt(v1L)}}{${fmt(v2L)}}`;
        }
        break;
      case "v2":
        if (_c2 !== null && _c1 !== null && _c2 > 0 && v1L !== null) {
          value = (_c1 * v1L) / _c2;
          steps = String.raw`V_2 = \frac{C_1 V_1}{C_2} = \frac{${_c1}\times ${fmt(v1L)}}{${_c2}}`;
        }
        break;
    }
    return { field: blank, value, steps };
  }, [c1, v1, c2, v2, vUnitDil]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-teal-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Molarity & Dilution Calculator</h2>
        <p className="text-base opacity-90">
          Calculate solution concentration and dilution values.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Molarity */}
        <h3 className="text-lg font-semibold text-gray-800">Molarity</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-base">
            <span className="block mb-1 text-gray-700">Moles of solute (mol)</span>
            <input
              type="number"
              value={moles}
              onChange={(e) => setMoles(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
            />
          </label>
          <label className="text-base col-span-2">
            <span className="block mb-1 text-gray-700">Solution volume</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
              />
              <select
                value={volUnit}
                onChange={(e) => setVolUnit(e.target.value as "L" | "mL")}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-base shadow-sm"
              >
                <option value="L">L</option>
                <option value="mL">mL</option>
              </select>
            </div>
          </label>
        </div>

        {/* Result */}
        {molarity !== null && (
          <div className="rounded-xl bg-teal-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Result:</div>
            <div className="font-semibold text-teal-800">
              M = {fmt(molarity)} M
            </div>
          </div>
        )}

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-800">
          <h4 className="font-bold mb-2">Formulas</h4>
          <ul className="space-y-2">
            <li><BlockMath math="M = \frac{n}{V}" /></li>
            <li><BlockMath math="C_1 V_1 = C_2 V_2" /></li>
          </ul>
        </div>

        <hr className="my-6 border-dashed" />

        {/* Dilution */}
        <h3 className="text-lg font-semibold text-gray-800">Dilution</h3>
        <p className="text-sm text-gray-500">Leave one field blank; it will be solved for you.</p>

        <div className="grid gap-4 sm:grid-cols-4 mt-3">
          {/* Inputs same as before */}
          <label className="text-base">
            C₁ (M)
            <input
              type="number"
              value={c1}
              onChange={(e) => setC1(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm"
            />
          </label>
          <label className="text-base">
            V₁
            <input
              type="number"
              value={v1}
              onChange={(e) => setV1(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm"
            />
          </label>
          <label className="text-base">
            C₂ (M)
            <input
              type="number"
              value={c2}
              onChange={(e) => setC2(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm"
            />
          </label>
          <label className="text-base">
            V₂
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={v2}
                onChange={(e) => setV2(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 shadow-sm"
              />
              <select
                value={vUnitDil}
                onChange={(e) => setVUnitDil(e.target.value as "L" | "mL")}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2"
              >
                <option value="mL">mL</option>
                <option value="L">L</option>
              </select>
            </div>
          </label>
        </div>

        {/* Result */}
        {dilution.field && dilution.value !== null && (
          <div className="rounded-xl bg-green-50 p-4 text-lg">
            <div className="mb-1 text-gray-600">Result:</div>
            <div className="font-semibold text-green-800">
              {dilution.field.toUpperCase()} ={" "}
              {dilution.field.startsWith("v")
                ? `${fmt(vUnitDil === "L" ? dilution.value : dilution.value * 1000)} ${vUnitDil}`
                : `${fmt(dilution.value)} M`}
            </div>
          </div>
        )}

        {/* Show Work */}
        {dilution.steps && (
          <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work
            </summary>
            <div className="mt-4 space-y-4">
              <div className="pl-2 border-l-4 border-teal-400">
                <div className="font-medium text-gray-700">Rearrange and substitute values</div>
                <BlockMath math={dilution.steps} />
              </div>
              <div className="pl-2 border-l-4 border-teal-600">
                <div className="font-medium text-gray-700">Final Answer</div>
                <div className="mt-1 rounded bg-teal-100 text-teal-800 px-3 py-1 inline-block">
                  <b>
                    {dilution.field?.toUpperCase()} ={" "}
                    {dilution.field?.startsWith("v")
                      ? `${fmt(vUnitDil === "L" ? dilution.value : dilution.value! * 1000)} ${vUnitDil}`
                      : `${fmt(dilution.value)} M`}
                  </b>
                </div>
              </div>
            </div>
          </details>
        )}

        {/* Reset */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              setMoles("1"); setVolume("1"); setVolUnit("L");
              setC1(""); setV1(""); setC2(""); setV2(""); setVUnitDil("mL");
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
