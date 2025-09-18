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

type TabKey =
  | "table"
  | "molar-mass"
  | "balancer"
  | "molarity"
  | "isotopes"
  | "stoich"
  | "limiting"
  | "yield";

type Tab = { key: TabKey; label: string; description: string };

const ALL_TABS: Tab[] = [
  { key: "table",       label: "Periodic Table",    description: "Search & filter all elements" },
  { key: "molar-mass",  label: "Molar Mass",        description: "Compute formula weights" },
  { key: "balancer",    label: "Equation Balancer", description: "Balance chemical equations" },
  { key: "molarity",    label: "Molarity",          description: "Molarity / dilution" },
  { key: "isotopes",    label: "Isotopes",          description: "Look up isotopes" },
  { key: "stoich",      label: "Stoichiometry",     description: "Mass ↔ moles ↔ particles" },
  { key: "limiting",    label: "Limiting Reagent",  description: "Limiting reactant & yield" },
  { key: "yield", label: "Yield", description: "Theoretical & percent yield" }
];

// show these as primary, everything else goes under “More”
const PRIMARY_KEYS: TabKey[] = ["table", "molar-mass", "balancer", "molarity"];

export default function Home() {
  const [active, setActive] = useState<TabKey>("table");
  const [openMore, setOpenMore] = useState(false);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { primaryTabs, moreTabs } = useMemo(() => {
    const primary = ALL_TABS.filter(t => PRIMARY_KEYS.includes(t.key));
    const rest = ALL_TABS.filter(t => !PRIMARY_KEYS.includes(t.key));
    return { primaryTabs: primary, moreTabs: rest };
  }, []);

  // close the “More” menu when clicking outside or on ESC
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!openMore) return;
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || moreBtnRef.current?.contains(target)) return;
      setOpenMore(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMore(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMore]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Chemistry Tools</h1>
              <p className="text-sm text-gray-500">Interactive calculators, references, and study helpers</p>
            </div>

            {/* Compact nav: a few primary buttons + More menu */}
            <nav className="flex items-center gap-2" aria-label="Chemistry tools">
              <div className="flex flex-wrap gap-2">
                {primaryTabs.map((t) => {
                  const selected = active === t.key;
                  return (
                    <button
                      key={t.key}
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`panel-${t.key}`}
                      id={`tab-${t.key}`}
                      onClick={() => setActive(t.key)}
                      className={[
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition ring-1",
                        selected
                          ? "bg-blue-600 text-white ring-blue-600"
                          : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                      title={t.description}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* More menu */}
              <div className="relative">
                <button
                  ref={moreBtnRef}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMore}
                  onClick={() => setOpenMore((v) => !v)}
                  className={[
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition ring-1",
                    openMore
                      ? "bg-gray-900 text-white ring-gray-900"
                      : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50",
                  ].join(" ")}
                >
                  More
                </button>

                {openMore && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-label="More chemistry tools"
                    className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
                  >
                    <div className="p-2">
                      {moreTabs.map((t) => {
                        const selected = active === t.key;
                        return (
                          <button
                            key={t.key}
                            role="menuitem"
                            onClick={() => {
                              setActive(t.key);
                              setOpenMore(false);
                            }}
                            className={[
                              "w-full text-left rounded-lg px-3 py-2 text-sm transition",
                              selected ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50 text-gray-800",
                            ].join(" ")}
                          >
                            <div className="font-medium">{t.label}</div>
                            <div className="text-xs text-gray-500">{t.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Panels */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
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
