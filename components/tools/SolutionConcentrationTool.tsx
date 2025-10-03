"use client";

import { useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

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
        steps: null as null | {
          moles: string;
          kgSolvent: string;
          molality: string;
          massPct: string;
          ppm: string;
          ppb: string;
        },
      };
    }

    const molesSolute = mSolute / mm; // mol
    const kgSolvent = mSolvent / 1000; // kg

    const molality = molesSolute / kgSolvent; // mol/kg
    const massPct = (mSolute / (mSolute + mSolvent)) * 100;
    const ppm = (mSolute / (mSolute + mSolvent)) * 1e6;
    const ppb = (mSolute / (mSolute + mSolvent)) * 1e9;

    const steps = {
      moles: String.raw`n = \frac{${mSolute}}{${mm}} = ${fmt(molesSolute, 6)}\ \text{mol}`,
      kgSolvent: String.raw`${mSolvent}\ \text{g} \div 1000 = ${fmt(kgSolvent, 6)}\ \text{kg}`,
      molality: String.raw`m = \frac{${fmt(molesSolute, 6)}}{${fmt(kgSolvent, 6)}} = ${fmt(molality, 6)}\ \text{mol/kg}`,
      massPct: String.raw`\text{Mass\%} = \frac{${mSolute}}{${mSolute}+${mSolvent}} \times 100 = ${fmt(massPct, 6)}\ \%`,
      ppm: String.raw`\text{ppm} = \frac{${mSolute}}{${mSolute}+${mSolvent}} \times 10^6 = ${fmt(ppm, 6)}`,
      ppb: String.raw`\text{ppb} = \frac{${mSolute}}{${mSolute}+${mSolvent}} \times 10^9 = ${fmt(ppb, 6)}`,
    };

    return { molality, massPct, ppm, ppb, steps };
  }, [soluteMass, solventMass, molarMass]);

  const hasAll = results.steps !== null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Solution Concentration Converter</h2>
        <p className="text-base opacity-90">
          Compute <b>molality</b>, <b>mass %</b>, <b>ppm</b>, and <b>ppb</b> from solute/solvent data.
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">Solute mass (g)</span>
            <input
              type="number"
              value={soluteMass}
              onChange={(e) => setSoluteMass(e.target.value)}
              placeholder="e.g., 10"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
            />
          </label>

          <label className="text-base">
            <span className="block text-gray-700 font-medium mb-1">Solvent mass (g)</span>
            <input
              type="number"
              value={solventMass}
              onChange={(e) => setSolventMass(e.target.value)}
              placeholder="e.g., 250"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
            />
          </label>

          <label className="text-base sm:col-span-2">
            <span className="block text-gray-700 font-medium mb-1">Solute molar mass (g/mol)</span>
            <input
              type="number"
              value={molarMass}
              onChange={(e) => setMolarMass(e.target.value)}
              placeholder="e.g., 58.44 (NaCl)"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-200"
            />
          </label>
        </div>

        {/* Results */}
        {hasAll && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-purple-50 p-4 text-lg">
              <div className="mb-1 text-gray-600">Molality:</div>
              <div className="font-semibold text-purple-800">{fmt(results.molality)} mol/kg</div>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-lg">
              <div className="mb-1 text-gray-600">Mass %:</div>
              <div className="font-semibold text-purple-800">{fmt(results.massPct, 6)} %</div>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-lg">
              <div className="mb-1 text-gray-600">ppm:</div>
              <div className="font-semibold text-purple-800">{fmt(results.ppm, 6)}</div>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-lg">
              <div className="mb-1 text-gray-600">ppb:</div>
              <div className="font-semibold text-purple-800">{fmt(results.ppb, 6)}</div>
            </div>
          </div>
        )}

        {/* Formula Reference */}
        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <h3 className="font-bold text-base mb-2">Formulas</h3>
          <ul className="space-y-2 leading-relaxed">
            <li><BlockMath math="n = \frac{m_{\text{solute}}}{M}" /></li>
            <li><BlockMath math="m = \frac{n}{m_{\text{solvent}}\ (\text{kg})}" /></li>
            <li><BlockMath math="\text{Mass\%} = \frac{m_{\text{solute}}}{m_{\text{solute}} + m_{\text{solvent}}} \times 100" /></li>
            <li><BlockMath math="\text{ppm} = \frac{m_{\text{solute}}}{m_{\text{solute}} + m_{\text{solvent}}} \times 10^6" /></li>
            <li><BlockMath math="\text{ppb} = \frac{m_{\text{solute}}}{m_{\text{solute}} + m_{\text{solvent}}} \times 10^9" /></li>
          </ul>
        </div>

        {/* Show Work */}
        {results.steps && (
          <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">
              Show Work (with your inputs)
            </summary>

            <div className="mt-4 space-y-5">
              <div className="pl-2 border-l-4 border-purple-400">
                <div className="font-medium text-gray-800">Step 1 — Calculate moles of solute</div>
                <BlockMath math={results.steps.moles} />
              </div>
              <div className="pl-2 border-l-4 border-purple-400">
                <div className="font-medium text-gray-800">Step 2 — Convert solvent mass to kilograms</div>
                <BlockMath math={results.steps.kgSolvent} />
              </div>
              <div className="pl-2 border-l-4 border-purple-600">
                <div className="font-medium text-gray-800">Step 3 — Molality</div>
                <BlockMath math={results.steps.molality} />
                <div className="mt-2 rounded-lg bg-purple-100 text-purple-800 px-3 py-1 inline-block">
                  <b>m = {fmt(results.molality)} mol/kg</b>
                </div>
              </div>
              <div className="pl-2 border-l-4 border-purple-600">
                <div className="font-medium text-gray-800">Step 4 — Mass %</div>
                <BlockMath math={results.steps.massPct} />
                <div className="mt-2 rounded-lg bg-purple-100 text-purple-800 px-3 py-1 inline-block">
                  <b>Mass % = {fmt(results.massPct, 6)} %</b>
                </div>
              </div>
              <div className="pl-2 border-l-4 border-purple-600">
                <div className="font-medium text-gray-800">Step 5 — ppm</div>
                <BlockMath math={results.steps.ppm} />
                <div className="mt-2 rounded-lg bg-purple-100 text-purple-800 px-3 py-1 inline-block">
                  <b>ppm = {fmt(results.ppm, 6)}</b>
                </div>
              </div>
              <div className="pl-2 border-l-4 border-purple-600">
                <div className="font-medium text-gray-800">Step 6 — ppb</div>
                <BlockMath math={results.steps.ppb} />
                <div className="mt-2 rounded-lg bg-purple-100 text-purple-800 px-3 py-1 inline-block">
                  <b>ppb = {fmt(results.ppb, 6)}</b>
                </div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
