"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { PeriodicTable } from "@/components/PeriodicTable";
import { MolarMassTool } from "@/components/tools/MolarMassTool";
import { EquationBalancer } from "@/components/tools/EquationBalancer";
import { MolarityTool } from "@/components/tools/MolarityTool";
import { IsotopeFinder } from "@/components/tools/IsotopeFinder";
import { StoichiometryTool } from "@/components/tools/StoichiometryTool";
import { LimitingReagentTool } from "@/components/tools/LimitingReagentTool";
import { YieldCalculator } from "@/components/tools/YieldCalculator";

/* ---------------- Types ---------------- */

type TabKey =
  | "table"
  | "molar-mass"
  | "balancer"
  | "molarity"
  | "isotopes"
  | "stoich"
  | "limiting"
  | "yield";

/* ---------------- Tool Shelf (category launcher) ---------------- */

type ToolItem = { key: TabKey; label: string; desc?: string };
type ToolGroup = { title: string; items: ToolItem[] };

const TOOL_GROUPS: ToolGroup[] = [
  {
    title: "🔢 Stoichiometry & Equations",
    items: [
      { key: "balancer",    label: "Equation Balancer", desc: "Balance reactions" },
      { key: "stoich",      label: "Stoichiometry",     desc: "Mass ↔ moles ↔ particles" },
      { key: "limiting",    label: "Limiting Reagent",  desc: "Find limiting & yield" },
      { key: "yield",       label: "Yield",             desc: "Theoretical & % yield" },
    ],
  },
  {
    title: "🧪 Solutions & Concentrations",
    items: [
      { key: "molarity",    label: "Molarity",          desc: "M and dilution" },
      { key: "molar-mass",  label: "Molar Mass",        desc: "Formula weights" },
    ],
  },
  {
    title: "🧾 Data & References",
    items: [
      { key: "table",       label: "Periodic Table",    desc: "Search & filter" },
      { key: "isotopes",    label: "Isotopes",          desc: "Masses & abundance" },
    ],
  },
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
          <div key={group.title} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
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
                        <div className={["text-sm font-medium", selected ? "text-blue-900" : "text-gray-900"].join(" ")}>
                          {t.label}
                        </div>
                        {t.desc && (
                          <div className={["text-xs", selected ? "text-blue-700" : "text-gray-500"].join(" ")}>
                            {t.desc}
                          </div>
                        )}
                      </div>
                      <div className={["text-gray-300 group-hover:text-gray-400", selected && "text-blue-400"].join(" ")} aria-hidden>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chemistry Tools</h1>
          <p className="text-sm text-gray-500">Interactive calculators, references, and study helpers</p>
        </div>
      </header>

      {/* Category launcher */}
      <ToolShelf active={active} onOpen={setActive} />

      {/* Panels */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <section role="tabpanel" id="panel-table" aria-labelledby="tab-table" hidden={active !== "table"}>
          <PeriodicTable />
        </section>

        <section role="tabpanel" id="panel-molar-mass" aria-labelledby="tab-molar-mass" hidden={active !== "molar-mass"}>
          <MolarMassTool />
        </section>

        <section role="tabpanel" id="panel-balancer" aria-labelledby="tab-balancer" hidden={active !== "balancer"}>
          <EquationBalancer />
        </section>

        <section role="tabpanel" id="panel-molarity" aria-labelledby="tab-molarity" hidden={active !== "molarity"}>
          <MolarityTool />
        </section>

        <section role="tabpanel" id="panel-isotopes" aria-labelledby="tab-isotopes" hidden={active !== "isotopes"}>
          <IsotopeFinder />
        </section>

        <section role="tabpanel" id="panel-stoich" aria-labelledby="tab-stoich" hidden={active !== "stoich"}>
          <StoichiometryTool />
        </section>

        <section role="tabpanel" id="panel-limiting" aria-labelledby="tab-limiting" hidden={active !== "limiting"}>
          <LimitingReagentTool />
        </section>

        <section role="tabpanel" id="panel-yield" aria-labelledby="tab-yield" hidden={active !== "yield"}>
          <YieldCalculator />
        </section>
      </main>
    </div>
  );
}