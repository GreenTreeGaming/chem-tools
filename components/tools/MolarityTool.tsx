"use client";

import { useMemo, useState } from "react";

function toNumber(s: string) {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}
function fmt(x: number | null, digits = 3) {
  if (x === null || !Number.isFinite(x)) return "—";
  // flip to scientific if too large/small
  const ax = Math.abs(x);
  if ((ax !== 0 && (ax < 1e-3 || ax >= 1e5))) return x.toExponential(digits);
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
    const vL = volUnit === "L" ? vInput : vInput / 1000; // mL -> L
    return vL > 0 ? n / vL : null;
  }, [moles, volume, volUnit]);

  const molarityError =
    (moles && Number.isNaN(toNumber(moles))) ||
    (volume && Number.isNaN(toNumber(volume))) ||
    (toNumber(volume) <= 0);

  // Dilution helper (C1 V1 = C2 V2). Leave one field blank to solve it.
  const [c1, setC1] = useState("");
  const [v1, setV1] = useState("");
  const [c2, setC2] = useState("");
  const [v2, setV2] = useState("");
  const [vUnitDil, setVUnitDil] = useState<"L" | "mL">("mL"); // common lab unit

  const dilution = useMemo(() => {
    // Count how many blanks
    const vals = { c1: c1.trim(), v1: v1.trim(), c2: c2.trim(), v2: v2.trim() };
    const blanks = Object.entries(vals).filter(([_, v]) => v === "");
    if (blanks.length !== 1) return { field: null as string | null, value: null as number | null };

    // Parse knowns; convert volumes to liters
    const _c1 = c1 ? toNumber(c1) : null;
    const _c2 = c2 ? toNumber(c2) : null;
    const _v1 = v1 ? toNumber(v1) : null;
    const _v2 = v2 ? toNumber(v2) : null;
    if (
      [_c1, _c2, _v1, _v2].some((x, i) => x !== null && !Number.isFinite(x as number)) ||
      (_v1 !== null && _v1! <= 0) ||
      (_v2 !== null && _v2! <= 0) ||
      (_c1 !== null && _c1! < 0) ||
      (_c2 !== null && _c2! < 0)
    ) {
      return { field: blanks[0][0], value: null };
    }

    const toL = (v: number | null) => (v === null ? null : vUnitDil === "L" ? v : v / 1000);
    const v1L = toL(_v1);
    const v2L = toL(_v2);

    const blank = blanks[0][0];
    switch (blank) {
      case "c1":
        if (v1L && _c2 !== null && v2L) return { field: "c1", value: (_c2 * v2L) / v1L };
        break;
      case "v1":
        if (_c1 !== null && _c2 !== null && _c1 > 0) return { field: "v1", value: (_c2 * (v2L ?? 0)) / _c1 };
        break;
      case "c2":
        if (_c1 !== null && v1L && v2L) return { field: "c2", value: (_c1 * v1L) / v2L };
        break;
      case "v2":
        if (_c2 !== null && _c1 !== null && _c2 > 0) return { field: "v2", value: (_c1 * (v1L ?? 0)) / _c2 };
        break;
    }
    return { field: blank, value: null };
  }, [c1, v1, c2, v2, vUnitDil]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Molarity / Dilution</h2>

      {/* Molarity */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">Moles of solute (mol)</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={moles}
            onChange={(e) => setMoles(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </label>

        <label className="text-sm col-span-2">
          <span className="block text-gray-600 mb-1">Solution volume</span>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <select
              value={volUnit}
              onChange={(e) => setVolUnit(e.target.value as "L" | "mL")}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            >
              <option value="L">L</option>
              <option value="mL">mL</option>
            </select>
          </div>
        </label>
      </div>

      <div className="mt-3 text-sm">
        Molarity:{" "}
        <b className={molarityError ? "text-red-600" : "text-gray-900"}>
          {molarityError ? "—" : `${fmt(molarity)} M`}
        </b>
      </div>

      <hr className="my-5 border-dashed" />

      {/* Dilution (C1 V1 = C2 V2) */}
      <h3 className="text-base font-semibold">Dilution (C₁V₁ = C₂V₂)</h3>
      <p className="text-xs text-gray-500">Leave exactly one field blank; we’ll solve it.</p>

      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">C₁ (M)</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={c1}
            onChange={(e) => setC1(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">V₁</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={v1}
            onChange={(e) => setV1(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">C₂ (M)</span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={c2}
            onChange={(e) => setC2(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">V₂</span>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={v2}
              onChange={(e) => setV2(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <select
              value={vUnitDil}
              onChange={(e) => setVUnitDil(e.target.value as "L" | "mL")}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            >
              <option value="mL">mL</option>
              <option value="L">L</option>
            </select>
          </div>
        </label>
      </div>

      <div className="mt-3 text-sm text-gray-700">
        {dilution.field ? (
          <>
            {dilution.field.toUpperCase()} ={" "}
            <b>
              {dilution.field.startsWith("v")
                ? // show in chosen volume unit
                  (() => {
                    const valL = dilution.value;
                    if (valL === null) return "—";
                    const shown =
                      vUnitDil === "L" ? valL : valL * 1000;
                    return `${fmt(shown)} ${vUnitDil}`;
                  })()
                : fmt(dilution.value) + " M"}
            </b>
          </>
        ) : (
          <span className="text-gray-500">
            Enter three of C₁, V₁, C₂, V₂ (leave one blank).
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMoles("1"); setVolume("1"); setVolUnit("L");
            setC1(""); setV1(""); setC2(""); setV2(""); setVUnitDil("mL");
          }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
