"use client";

import { useState } from "react";
import { PeriodicTable } from "@/components/PeriodicTable";
import { MolarMassTool } from "@/components/tools/MolarMassTool";
import { EquationBalancer } from "@/components/tools/EquationBalancer";
import { MolarityTool } from "@/components/tools/MolarityTool";
import { IsotopeFinder } from "@/components/tools/IsotopeFinder";
import { StoichiometryTool } from "@/components/tools/StoichiometryTool";
import { LimitingReagentTool } from "@/components/tools/LimitingReagentTool";
import { YieldCalculator } from "@/components/tools/YieldCalculator";
import { SolutionConcentrationTool } from "@/components/tools/SolutionConcentrationTool";
import { GasLawSolver } from "@/components/tools/GasLawSolver"; // 👈 new import
import { GasLawVariations } from "@/components/tools/GasLawVariations"; // 👈 new import
import { BondEnthalpies } from "@/components/tools/BondEnthalpies";
import { SolubilityRules } from "@/components/tools/SolubilityRules";
import { ReactionStoichiometryTool } from "@/components/tools/ReactionStoichiometryTool";
import { StrongAcidsBases } from "@/components/tools/StrongAcidsBases";
import { PolyatomicIonsChart } from "@/components/tools/PolyatomicIonsChart";
import { CommonLabConstants } from "@/components/tools/CommonLabConstants";

/* ---------------- Types ---------------- */

type TabKey =
  | "table"
  | "molar-mass"
  | "balancer"
  | "molarity"
  | "solutions"
  | "isotopes"
  | "stoich"
  | "reactionstoich" // 👈 NEW
  | "limiting"
  | "yield"
  | "gaslaw"
  | "gasvariations" // 👈 new
  | "bondenthalpies"
  | "solubility"
  | "acidsbases"
  | "polyatomicions"
  | "constants";

/* ---------------- Tool Shelf (category launcher) ---------------- */

type ToolItem = { key: TabKey; label: string; desc?: string };
type ToolGroup = { title: string; items: ToolItem[] };

const TOOL_GROUPS: ToolGroup[] = [
{
    title: "🔢 Stoichiometry & Equations",
    items: [
      { key: "balancer", label: "Equation Balancer", desc: "Balance reactions" },
      { key: "stoich", label: "Stoichiometry", desc: "Mass ↔ moles ↔ particles" },
      { key: "reactionstoich", label: "Reaction Stoichiometry", desc: "Reactant-product mole ratios & limiting reagent" }, // 👈 NEW
      { key: "limiting", label: "Limiting Reagent", desc: "Find limiting & yield" },
      { key: "yield", label: "Yield", desc: "Theoretical & % yield" },
    ],
  },
  {
    title: "🧪 Solutions & Concentrations",
    items: [
      { key: "molarity", label: "Molarity", desc: "M and dilution" },
      { key: "solutions", label: "Solution Concentrations", desc: "Molality, %, ppm/ppb" },
      { key: "molar-mass", label: "Molar Mass", desc: "Formula weights" },
    ],
  },
  {
  title: "📐 Gases",
  items: [
    { key: "gaslaw", label: "Ideal Gas Law", desc: "PV = nRT solver" },
    { key: "gasvariations", label: "Gas Law Variations", desc: "Boyle • Charles • Avogadro • Dalton" }, // 👈 new
  ],
},
  {
    title: "🧾 Data & References",
    items: [
      { key: "table", label: "Periodic Table", desc: "Search & filter" },
      { key: "isotopes", label: "Isotopes", desc: "Masses & abundance" },
      { key: "bondenthalpies", label: "Bond Enthalpies", desc: "Bond dissociation energies" },
      { key: "solubility", label: "Solubility Rules", desc: "Aqueous solubility guide" },
      { key: "acidsbases", label: "Strong Acids & Bases", desc: "Reference list" },
      { key: "polyatomicions", label: "Polyatomic Ions", desc: "Common ions list" },
      { key: "constants", label: "Lab Constants", desc: "Physical & chemical constants" } // 👈 NEW
    ],
  }
];

function ToolShelf({
  active,
  onOpen,
}: {
  active: TabKey;
  onOpen: (k: TabKey) => void;
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid gap-4">
        {TOOL_GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">{group.title}</h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((t) => {
                const selected = active === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => onOpen(t.key)}
                    className={[
                      "group w-full text-left rounded-xl border p-3 transition",
                      selected
                        ? "border-blue-600 bg-blue-50 ring-1 ring-blue-200"
                        : "border-gray-200 bg-white hover:bg-gray-50",
                    ].join(" ")}
                    aria-pressed={selected}
                    aria-label={t.label}
                    title={t.desc}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div
                          className={[
                            "text-sm font-medium",
                            selected ? "text-blue-900" : "text-gray-900",
                          ].join(" ")}
                        >
                          {t.label}
                        </div>
                        {t.desc && (
                          <div
                            className={[
                              "text-xs",
                              selected ? "text-blue-700" : "text-gray-500",
                            ].join(" ")}
                          >
                            {t.desc}
                          </div>
                        )}
                      </div>
                      <div
                        className={[
                          "text-gray-300 group-hover:text-gray-400",
                          selected && "text-blue-400",
                        ].join(" ")}
                        aria-hidden
                      >
                        →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Page ---------------- */

export default function Home() {
  const [active, setActive] = useState<TabKey>("table");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Chemistry Tools
          </h1>
          <p className="text-sm text-gray-500">
            Interactive calculators, references, and study helpers
          </p>
        </div>
      </header>

      {/* Category launcher */}
      <ToolShelf active={active} onOpen={setActive} />

      {/* Panels */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <section hidden={active !== "table"}>
          <PeriodicTable />
        </section>

        <section hidden={active !== "molar-mass"}>
          <MolarMassTool />
        </section>

        <section hidden={active !== "balancer"}>
          <EquationBalancer />
        </section>

        <section hidden={active !== "molarity"}>
          <MolarityTool />
        </section>

        <section hidden={active !== "solutions"}>
          <SolutionConcentrationTool />
        </section>

        <section hidden={active !== "isotopes"}>
          <IsotopeFinder />
        </section>

        <section hidden={active !== "stoich"}>
          <StoichiometryTool />
        </section>

        <section hidden={active !== "reactionstoich"}>
          <ReactionStoichiometryTool /> {/* 👈 NEW */}
        </section>

        <section hidden={active !== "limiting"}>
          <LimitingReagentTool />
        </section>

        <section hidden={active !== "yield"}>
          <YieldCalculator />
        </section>

        <section hidden={active !== "gaslaw"}>
          <GasLawSolver />
        </section>

        <section hidden={active !== "gasvariations"}>
          <GasLawVariations /> {/* 👈 new panel */}
        </section>

        <section hidden={active !== "bondenthalpies"}>
          <BondEnthalpies /> {/* 👈 new component */}
        </section>

        <section hidden={active !== "solubility"}>
          <SolubilityRules /> {/* 👈 new panel */}
        </section>

        <section hidden={active !== "acidsbases"}>
          <StrongAcidsBases />
        </section>

        <section hidden={active !== "polyatomicions"}>
          <PolyatomicIonsChart />
        </section>

        <section hidden={active !== "constants"}>
          <CommonLabConstants /> {/* 👈 NEW */}
        </section>
      </main>
    </div>
  );
}
