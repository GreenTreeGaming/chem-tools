"use client";

import { useState, useMemo } from "react";

// helper
const fmt = (x: number | null, digits = 6) =>
  x === null || !Number.isFinite(x) ? "—" : x.toPrecision(digits);

export function SolutionConcentrationTool() {
  const [soluteMass, setSoluteMass] = useState(""); // g
  const [solventMass, setSolventMass] = useState(""); // g
  const [molarMass, setMolarMass] = useState(""); // g/mol

  // computed outputs + intermediate steps
  const results = useMemo(() => {
    const mSolute = parseFloat(soluteMass);
    const mSolvent = parseFloat(solventMass);
    const mm = parseFloat(molarMass);

    if (!(mSolute >= 0 && mSolvent > 0 && mm > 0)) {
      return {
        molality: null,
        massPct: null,
        ppm: null,
        ppb: null,
        steps: null,
      };
    }

    const molesSolute = mSolute / mm; // mol
    const kgSolvent = mSolvent / 1000; // kg

    const molality = molesSolute / kgSolvent; // mol/kg
    const massPct = (mSolute / (mSolute + mSolvent)) * 100;
    const ppm = (mSolute / (mSolute + mSolvent)) * 1e6;
    const ppb = (mSolute / (mSolute + mSolvent)) * 1e9;

    const steps = {
      moles: `${mSolute} g ÷ ${mm} g/mol = ${fmt(molesSolute, 6)} mol`,
      kgSolvent: `${mSolvent} g ÷ 1000 = ${fmt(kgSolvent, 6)} kg`,
      molality: `${fmt(molesSolute, 6)} mol ÷ ${fmt(kgSolvent, 6)} kg = ${fmt(molality, 6)} mol/kg`,
      massPct: `(${mSolute} ÷ (${mSolute} + ${mSolvent})) × 100 = ${fmt(massPct, 6)} %`,
      ppm: `(${mSolute} ÷ (${mSolute} + ${mSolvent})) × 1e6 = ${fmt(ppm, 6)}`,
      ppb: `(${mSolute} ÷ (${mSolute} + ${mSolvent})) × 1e9 = ${fmt(ppb, 6)}`,
    };

    return { molality, massPct, ppm, ppb, steps };
  }, [soluteMass, solventMass, molarMass]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-teal-600 text-white px-6 py-4 rounded-t-2xl">
        <h2 className="text-xl font-bold">Solution Concentration Converter</h2>
        <p className="text-base opacity-90">
          Compute <b>molality</b>, <b>mass %</b>, <b>ppm</b>, and <b>ppb</b> from solute/solvent data.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">Solute mass (g)</span>
            <input
              type="number"
              value={soluteMass}
              onChange={(e) => setSoluteMass(e.target.value)}
              placeholder="e.g., 10"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
            />
          </label>

          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">Solvent mass (g)</span>
            <input
              type="number"
              value={solventMass}
              onChange={(e) => setSolventMass(e.target.value)}
              placeholder="e.g., 250"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
            />
          </label>

          <label className="text-base sm:col-span-2">
            <span className="block text-gray-700 font-medium mb-1">Solute molar mass (g/mol)</span>
            <input
              type="number"
              value={molarMass}
              onChange={(e) => setMolarMass(e.target.value)}
              placeholder="e.g., 58.44 (NaCl)"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200"
            />
          </label>
        </div>

        {/* Results */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">Molality</div>
            <div className="text-lg font-semibold text-gray-900">
              {fmt(results.molality)} mol/kg
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">Mass % (w/w)</div>
            <div className="text-lg font-semibold text-gray-900">
              {fmt(results.massPct, 4)} %
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">ppm</div>
            <div className="text-lg font-semibold text-gray-900">
              {fmt(results.ppm, 6)}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">ppb</div>
            <div className="text-lg font-semibold text-gray-900">
              {fmt(results.ppb, 6)}
            </div>
          </div>
        </div>

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <h3 className="font-bold text-base mb-2">Formulas</h3>
          <ul className="space-y-2 leading-relaxed">
            <li><b>Moles of solute (n):</b> n = m<sub>solute</sub> ÷ M</li>
            <li><b>Molality (m):</b> m = n ÷ (m<sub>solvent</sub> in kg)</li>
            <li><b>Mass %:</b> (m<sub>solute</sub> ÷ (m<sub>solute</sub> + m<sub>solvent</sub>)) × 100</li>
            <li><b>ppm:</b> (m<sub>solute</sub> ÷ (m<sub>solute</sub> + m<sub>solvent</sub>)) × 10⁶</li>
            <li><b>ppb:</b> (m<sub>solute</sub> ÷ (m<sub>solute</sub> + m<sub>solvent</sub>)) × 10⁹</li>
          </ul>
        </div>

        {/* Show Work */}
        {results.steps && (
          <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work (with your inputs)
            </summary>
            <ul className="mt-3 space-y-2 text-gray-700 leading-relaxed">
              <li><b>Moles of solute:</b> {results.steps.moles}</li>
              <li><b>Kg of solvent:</b> {results.steps.kgSolvent}</li>
              <li><b>Molality:</b> {results.steps.molality}</li>
              <li><b>Mass %:</b> {results.steps.massPct}</li>
              <li><b>ppm:</b> {results.steps.ppm}</li>
              <li><b>ppb:</b> {results.steps.ppb}</li>
            </ul>
          </details>
        )}

        <p className="text-sm text-gray-500">
          Inputs: solute mass (g), solvent mass (g), and solute molar mass (g/mol).  
          Results are calculated assuming ideal solution behavior.
        </p>
      </div>
    </div>
  );
}