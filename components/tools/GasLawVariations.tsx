"use client";

import { useState, useMemo } from "react";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";

// helper
const fmt = (x: number | null, digits = 6) =>
  x === null || !Number.isFinite(x) ? "—" : x.toPrecision(digits);

type LawKey = "boyle" | "charles" | "avogadro" | "dalton";
type VarKey = "P1" | "P2" | "V1" | "V2" | "T1" | "T2" | "n1" | "n2";

export function GasLawVariations() {
  const [law, setLaw] = useState<LawKey>("boyle");
  const [known, setKnown] = useState<VarKey>("P2");

  // shared inputs
  const [P1, setP1] = useState("1.0");
  const [V1, setV1] = useState("1.0");
  const [P2, setP2] = useState("");
  const [V2, setV2] = useState("");

  const [T1, setT1] = useState("273.15");
  const [T2, setT2] = useState("");

  const [n1, setN1] = useState("1.0");
  const [n2, setN2] = useState("");

  const [partials, setPartials] = useState<string>("0.5, 0.8, 1.2");

  // calculation
  const result = useMemo(() => {
    let val: number | null = null;
    let steps: any[] = [];

    try {
      if (law === "boyle" && known) {
        const _P1 = parseFloat(P1);
        const _V1 = parseFloat(V1);
        const _P2 = parseFloat(P2);
        const _V2 = parseFloat(V2);

        if (known === "P2") {
          val = (_P1 * _V1) / _V2;
          steps.push({
            label: "Step 1 — Apply Boyle’s Law",
            math: String.raw`P_1 V_1 = P_2 V_2`,
          });
          steps.push({
            label: "Final Step — Solve for P₂",
            math: String.raw`P_2 = \frac{P_1 V_1}{V_2} = \frac{${_P1}\times ${_V1}}{${_V2}} \;\Rightarrow\; \mathbf{${fmt(val)}}`,
          });
        } else if (known === "V2") {
          val = (_P1 * _V1) / _P2;
          steps.push({
            label: "Step 1 — Apply Boyle’s Law",
            math: String.raw`P_1 V_1 = P_2 V_2`,
          });
          steps.push({
            label: "Final Step — Solve for V₂",
            math: String.raw`V_2 = \frac{P_1 V_1}{P_2} = \frac{${_P1}\times ${_V1}}{${_P2}} \;\Rightarrow\; \mathbf{${fmt(val)}}`,
          });
        }
      }

      if (law === "charles" && known) {
        const _V1 = parseFloat(V1);
        const _T1 = parseFloat(T1);
        const _V2 = parseFloat(V2);
        const _T2 = parseFloat(T2);

        if (known === "V2") {
          val = (_V1 * _T2) / _T1;
          steps.push({
            label: "Step 1 — Apply Charles’s Law",
            math: String.raw`\frac{V_1}{T_1} = \frac{V_2}{T_2}`,
          });
          steps.push({
            label: "Final Step — Solve for V₂",
            math: String.raw`V_2 = \frac{V_1 T_2}{T_1} = \frac{${_V1}\times ${_T2}}{${_T1}} \;\Rightarrow\; \mathbf{${fmt(val)}}`,
          });
        } else if (known === "T2") {
          val = (_V2 * _T1) / _V1;
          steps.push({
            label: "Step 1 — Apply Charles’s Law",
            math: String.raw`\frac{V_1}{T_1} = \frac{V_2}{T_2}`,
          });
          steps.push({
            label: "Final Step — Solve for T₂",
            math: String.raw`T_2 = \frac{V_2 T_1}{V_1} = \frac{${_V2}\times ${_T1}}{${_V1}} \;\Rightarrow\; \mathbf{${fmt(val)}}`,
          });
        }
      }

      if (law === "avogadro" && known) {
        const _V1 = parseFloat(V1);
        const _n1 = parseFloat(n1);
        const _V2 = parseFloat(V2);
        const _n2 = parseFloat(n2);

        if (known === "V2") {
          val = (_V1 * _n2) / _n1;
          steps.push({
            label: "Step 1 — Apply Avogadro’s Law",
            math: String.raw`\frac{V_1}{n_1} = \frac{V_2}{n_2}`,
          });
          steps.push({
            label: "Final Step — Solve for V₂",
            math: String.raw`V_2 = \frac{V_1 n_2}{n_1} = \frac{${_V1}\times ${_n2}}{${_n1}} \;\Rightarrow\; \mathbf{${fmt(val)}}`,
          });
        } else if (known === "n2") {
          val = (_n1 * _V2) / _V1;
          steps.push({
            label: "Step 1 — Apply Avogadro’s Law",
            math: String.raw`\frac{V_1}{n_1} = \frac{V_2}{n_2}`,
          });
          steps.push({
            label: "Final Step — Solve for n₂",
            math: String.raw`n_2 = \frac{n_1 V_2}{V_1} = \frac{${_n1}\times ${_V2}}{${_V1}} \;\Rightarrow\; \mathbf{${fmt(val)}}`,
          });
        }
      }

      if (law === "dalton") {
        const numbers = partials
          .split(",")
          .map((s) => parseFloat(s.trim()))
          .filter((x) => !isNaN(x));
        val = numbers.reduce((a, b) => a + b, 0);
        steps.push({
          label: "Step 1 — List partial pressures",
          math: String.raw`${numbers.join(" + ")}`,
        });
        steps.push({
          label: "Final Step — Total Pressure",
          math: String.raw`P_\text{total} = ${numbers.join(" + ")} = \mathbf{${fmt(val)}}`,
        });
      }
    } catch {
      val = null;
    }

    return { val, steps };
  }, [law, known, P1, V1, P2, V2, T1, T2, n1, n2, partials]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">Gas Law Variations</h2>
        <p className="text-base opacity-90">Boyle • Charles • Avogadro • Dalton</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Law selector */}
        <div>
          <p className="mb-2 text-sm text-gray-600">Choose a gas law:</p>
          <div className="flex flex-wrap gap-2">
            {([
              ["boyle", "Boyle’s Law"],
              ["charles", "Charles’s Law"],
              ["avogadro", "Avogadro’s Law"],
              ["dalton", "Dalton’s Law"],
            ] as [LawKey, string][]).map(([k, label]) => (
              <button
                key={k}
                onClick={() => {
                  setLaw(k);
                  if (k === "boyle") setKnown("P2");
                  if (k === "charles") setKnown("V2");
                  if (k === "avogadro") setKnown("V2");
                  if (k === "dalton") setKnown("P2"); // doesn't matter
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  law === k ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Known selector for each law */}
        {law === "boyle" && (
          <div>
            <label className="text-sm text-gray-600 mr-2">Solve for:</label>
            <select
              value={known}
              onChange={(e) => setKnown(e.target.value as VarKey)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="P2">P₂</option>
              <option value="V2">V₂</option>
            </select>
          </div>
        )}
        {law === "charles" && (
          <div>
            <label className="text-sm text-gray-600 mr-2">Solve for:</label>
            <select
              value={known}
              onChange={(e) => setKnown(e.target.value as VarKey)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="V2">V₂</option>
              <option value="T2">T₂</option>
            </select>
          </div>
        )}
        {law === "avogadro" && (
          <div>
            <label className="text-sm text-gray-600 mr-2">Solve for:</label>
            <select
              value={known}
              onChange={(e) => setKnown(e.target.value as VarKey)}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              <option value="V2">V₂</option>
              <option value="n2">n₂</option>
            </select>
          </div>
        )}

        {/* Inputs */}
        {law === "boyle" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>P₁<input value={P1} onChange={(e) => setP1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>V₁<input value={V1} onChange={(e) => setV1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>P₂<input value={P2} onChange={(e) => setP2(e.target.value)} disabled={known === "P2"} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>V₂<input value={V2} onChange={(e) => setV2(e.target.value)} disabled={known === "V2"} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          </div>
        )}

        {law === "charles" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>V₁<input value={V1} onChange={(e) => setV1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>T₁<input value={T1} onChange={(e) => setT1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>V₂<input value={V2} onChange={(e) => setV2(e.target.value)} disabled={known === "V2"} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>T₂<input value={T2} onChange={(e) => setT2(e.target.value)} disabled={known === "T2"} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          </div>
        )}

        {law === "avogadro" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>V₁<input value={V1} onChange={(e) => setV1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>n₁<input value={n1} onChange={(e) => setN1(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>V₂<input value={V2} onChange={(e) => setV2(e.target.value)} disabled={known === "V2"} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label>n₂<input value={n2} onChange={(e) => setN2(e.target.value)} disabled={known === "n2"} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          </div>
        )}

        {law === "dalton" && (
          <label>Partial pressures<input value={partials} onChange={(e) => setPartials(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
        )}

        {/* Result */}
        {result && result.val !== null && (
          <div className="rounded-xl bg-indigo-50 p-4 text-lg">
            <div className="mb-2 text-gray-600">Result:</div>
            <div className="font-semibold text-indigo-800">
              {known} = {fmt(result.val)}
            </div>
          </div>
        )}

        {/* Formula Reference */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          <h3 className="font-bold text-base mb-2">Formulas</h3>
          <ul className="space-y-2">
            <li><BlockMath math="P_1 V_1 = P_2 V_2 \quad \text{(Boyle)}" /></li>
            <li><BlockMath math="\tfrac{V_1}{T_1} = \tfrac{V_2}{T_2} \quad \text{(Charles)}" /></li>
            <li><BlockMath math="\tfrac{V_1}{n_1} = \tfrac{V_2}{n_2} \quad \text{(Avogadro)}" /></li>
            <li><BlockMath math="P_\text{total} = \sum_i P_i \quad \text{(Dalton)}" /></li>
          </ul>
        </div>

        {/* Show Work */}
        {result && result.steps && (
          <details className="mt-4 rounded-xl border bg-white p-4 text-base">
            <summary className="cursor-pointer font-semibold text-gray-800 text-lg">Show Work</summary>
            <div className="mt-3 space-y-4">
              {result.steps.map((s, i) => (
                <div key={i} className="pl-2 border-l-4 border-indigo-400">
                  <div className="font-medium text-gray-700">{s.label}</div>
                  <BlockMath math={s.math} />
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}