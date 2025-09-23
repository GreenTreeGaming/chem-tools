"use client";

import { useMemo, useState } from "react";
import { CATEGORY_META } from "@/utils/categoryMeta";

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
  // Simple molarity (M = n / V)
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

  const molarityError =
    (moles && Number.isNaN(toNumber(moles))) ||
    (volume && Number.isNaN(toNumber(volume))) ||
    (toNumber(volume) <= 0);

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
          steps = `C₁ = (C₂ × V₂) ÷ V₁ = (${_c2} × ${fmt(v2L)}) ÷ ${fmt(v1L)} = ${fmt(value)} M`;
        }
        break;
      case "v1":
        if (_c1 !== null && _c2 !== null && _c1 > 0 && v2L !== null) {
          value = (_c2 * v2L) / _c1;
          steps = `V₁ = (C₂ × V₂) ÷ C₁ = (${_c2} × ${fmt(v2L)}) ÷ ${_c1} = ${fmt(value)} L`;
        }
        break;
      case "c2":
        if (_c1 !== null && v1L && v2L) {
          value = (_c1 * v1L) / v2L;
          steps = `C₂ = (C₁ × V₁) ÷ V₂ = (${_c1} × ${fmt(v1L)}) ÷ ${fmt(v2L)} = ${fmt(value)} M`;
        }
        break;
      case "v2":
        if (_c2 !== null && _c1 !== null && _c2 > 0 && v1L !== null) {
          value = (_c1 * v1L) / _c2;
          steps = `V₂ = (C₁ × V₁) ÷ C₂ = (${_c1} × ${fmt(v1L)}) ÷ ${_c2} = ${fmt(value)} L`;
        }
        break;
    }
    return { field: blank, value, steps };
  }, [c1, v1, c2, v2, vUnitDil]);

  // strong colors
  const molarityColor = CATEGORY_META["transition metal"]; // blue strong
  const dilutionColor = CATEGORY_META["alkaline earth metal"]; // green strong

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className={`${molarityColor.bg} ${molarityColor.text} px-6 py-4`}>
        <h2 className="text-xl font-bold">Molarity & Dilution Calculator</h2>
        <p className="text-base opacity-90">Compute solutions with <b>M = n/V</b> and <b>C₁V₁ = C₂V₂</b></p>
      </div>

      <div className="p-6 space-y-6">
        {/* Molarity */}
        <h3 className="text-lg font-semibold text-gray-800">Molarity</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">Moles of solute (mol)</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={moles}
              onChange={(e) => setMoles(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
          </label>

          <label className="text-base col-span-2">
            <span className="block text-gray-700 font-medium mb-1">Solution volume</span>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              />
              <select
                value={volUnit}
                onChange={(e) => setVolUnit(e.target.value as "L" | "mL")}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
              >
                <option value="L">L</option>
                <option value="mL">mL</option>
              </select>
            </div>
          </label>
        </div>

        <div className="mt-4 text-lg">
          <span className="font-medium text-gray-700">Molarity:</span>{" "}
          <b className={molarityError ? "text-red-600" : molarityColor.bg.replace("bg-", "text-")}>
            {molarityError ? "—" : `${fmt(molarity)} M`}
          </b>
        </div>

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-base text-gray-800">
          <h4 className="font-bold mb-2">Formulas</h4>
          <ul className="space-y-2 leading-relaxed">
            <li><b>Molarity (M):</b> M = n ÷ V</li>
            <li><b>Dilution:</b> C₁V₁ = C₂V₂</li>
          </ul>
        </div>

        <hr className="my-6 border-dashed" />

        {/* Dilution */}
        <h3 className="text-lg font-semibold text-gray-800">Dilution</h3>
        <p className="text-sm text-gray-500">Leave exactly one field blank; we’ll solve it.</p>

        <div className="mt-3 grid gap-4 sm:grid-cols-4">
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">C₁ (M)</span>
            <input
              type="number"
              value={c1}
              onChange={(e) => setC1(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
            />
          </label>
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">V₁</span>
            <input
              type="number"
              value={v1}
              onChange={(e) => setV1(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
            />
          </label>
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">C₂ (M)</span>
            <input
              type="number"
              value={c2}
              onChange={(e) => setC2(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
            />
          </label>
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">V₂</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={v2}
                onChange={(e) => setV2(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              />
              <select
                value={vUnitDil}
                onChange={(e) => setVUnitDil(e.target.value as "L" | "mL")}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-base shadow-sm focus:border-green-500 focus:ring focus:ring-green-200"
              >
                <option value="mL">mL</option>
                <option value="L">L</option>
              </select>
            </div>
          </label>
        </div>

        <div className="mt-4 text-lg">
          {dilution.field ? (
            <>
              <span className="font-medium text-gray-700">{dilution.field.toUpperCase()} = </span>
              <b className={dilutionColor.bg.replace("bg-", "text-")}>
                {dilution.value === null
                  ? "—"
                  : dilution.field.startsWith("v")
                  ? `${fmt(vUnitDil === "L" ? dilution.value : dilution.value! * 1000)} ${vUnitDil}`
                  : `${fmt(dilution.value)} M`}
              </b>
            </>
          ) : (
            <span className="text-gray-500">Enter three of C₁, V₁, C₂, V₂ (leave one blank).</span>
          )}
        </div>

        {/* Show Work */}
        {dilution.steps && (
          <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">Show Work</summary>
            <p className="mt-2 text-gray-700 leading-relaxed">{dilution.steps}</p>
          </details>
        )}

        <div className="mt-6 flex gap-2">
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