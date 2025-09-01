"use client";

import { useMemo, useState, useDeferredValue } from "react";
import { ElementCard } from "./ElementCard";
import { ElementFilter } from "./ElementFilter";
import { useElementData } from "../hooks/useElementData";

// Single source of truth for category styles + labels
export const CATEGORY_META: Record<
  Lowercase<
    | "Alkali Metal"
    | "Alkaline Earth Metal"
    | "Transition Metal"
    | "Post-Transition Metal"
    | "Metalloid"
    | "Nonmetal"
    | "Halogen"
    | "Noble Gas"
    | "Lanthanide"
    | "Actinide"
  >
, { label: string; bg: string; text: string; ring: string }
> = {
  "alkali metal": {
    label: "Alkali Metal",
    bg: "bg-yellow-100",
    text: "text-yellow-900",
    ring: "ring-yellow-200",
  },
  "alkaline earth metal": {
    label: "Alkaline Earth Metal",
    bg: "bg-green-100",
    text: "text-green-900",
    ring: "ring-green-200",
  },
  "transition metal": {
    label: "Transition Metal",
    bg: "bg-blue-100",
    text: "text-blue-900",
    ring: "ring-blue-200",
  },
  "post-transition metal": {
    label: "Post-Transition Metal",
    bg: "bg-orange-100",
    text: "text-orange-900",
    ring: "ring-orange-200",
  },
  metalloid: {
    label: "Metalloid",
    bg: "bg-purple-100",
    text: "text-purple-900",
    ring: "ring-purple-200",
  },
  nonmetal: {
    label: "Nonmetal",
    bg: "bg-pink-100",
    text: "text-pink-900",
    ring: "ring-pink-200",
  },
  halogen: {
    label: "Halogen",
    bg: "bg-red-100",
    text: "text-red-900",
    ring: "ring-red-200",
  },
  "noble gas": {
    label: "Noble Gas",
    bg: "bg-indigo-100",
    text: "text-indigo-900",
    ring: "ring-indigo-200",
  },
  lanthanide: {
    label: "Lanthanide",
    bg: "bg-teal-100",
    text: "text-teal-900",
    ring: "ring-teal-200",
  },
  actinide: {
    label: "Actinide",
    bg: "bg-cyan-100",
    text: "text-cyan-900",
    ring: "ring-cyan-200",
  },
};

const normalize = (v: string) => v.toLowerCase().trim();

const ColorLegend = () => {
  return (
    <div
      className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5"
      role="region"
      aria-label="Category color legend"
    >
      <div className="flex flex-wrap gap-3">
        {Object.entries(CATEGORY_META).map(([k, meta]) => (
          <div
            key={k}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ring-1 ${meta.bg} ${meta.text} ${meta.ring}`}
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-current opacity-70" />
            <span className="text-sm font-medium">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PeriodicTable = () => {
  const elements = useElementData();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");

  // Smooth typing without re-filtering on every keystroke
  const deferredQuery = useDeferredValue(searchInput);
  const query = normalize(deferredQuery);

  const filteredElements = useMemo(() => {
    const isAll = normalize(selectedCategory) === "all";

    return elements.filter((el) => {
      const cat = normalize(el.category || "");
      const matchesCategory = isAll || cat === normalize(selectedCategory);

      if (!query) return matchesCategory;

      const inNumber = String(el.atomicNumber).includes(query);
      const inName = (el.name || "").toLowerCase().includes(query);
      const inSymbol = (el.symbol || "").toLowerCase().includes(query);

      return matchesCategory && (inNumber || inName || inSymbol);
    });
  }, [elements, selectedCategory, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Interactive Periodic Table
          </h1>
          <p className="text-sm text-gray-500">
            Search by atomic number, name, or symbol. Filter by category.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <ColorLegend />

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Search elements</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search: 26 or iron or Fe"
              aria-label="Search elements by atomic number, name, or symbol"
              className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring focus:ring-blue-200"
            />
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.9 14.32a7 7 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
                clipRule="evenodd"
              />
            </svg>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </label>

          {/* Category Filter (pills) */}
          <ElementFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {filteredElements.length > 0 ? (
            filteredElements.map((el) => (
              <ElementCard
                key={el.symbol}
                atomicNumber={el.atomicNumber}
                symbol={el.symbol}
                name={el.name}
                category={el.category}
                // the rest of your fields can still be passed if your card uses them
                // atomicWeight={el.atomicWeight}
                // electronConfiguration={el.electronConfiguration}
                // density={el.density}
                // meltingPoint={el.meltingPoint}
                // boilingPoint={el.boilingPoint}
                // phase={el.phase}
              />
            ))
          ) : (
            <div className="col-span-full">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <span className="mb-2 text-3xl">🔎</span>
                <p className="font-medium">No elements found</p>
                <p className="mt-1 text-sm text-gray-500">
                  Try a different search term or pick another category.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};