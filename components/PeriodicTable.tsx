"use client";

import { ElementCard } from "./ElementCard";
import { useElementData } from "../hooks/useElementData";
import { useState } from "react";
import { ElementFilter } from "./ElementFilter";

const categoryColors = {
  "alkali metal": "bg-yellow-300 text-yellow-900",
  "alkaline earth metal": "bg-green-300 text-green-900",
  "transition metal": "bg-blue-300 text-blue-900",
  "post-transition metal": "bg-orange-300 text-orange-900",
  "metalloid": "bg-purple-300 text-purple-900",
  "nonmetal": "bg-pink-300 text-pink-900",
  "halogen": "bg-red-300 text-red-900",
  "noble gas": "bg-indigo-300 text-indigo-900",
  "lanthanide": "bg-teal-300 text-teal-900",
  "actinide": "bg-cyan-300 text-cyan-900",
};

const ColorLegend = () => {
  return (
    <div className="flex justify-center flex-wrap p-4 mb-4 border border-gray-300 rounded bg-gray-100 shadow-md">
      {Object.entries(categoryColors).map(([category, colorClass]) => (
        <div key={category} className="flex items-center mx-2 my-1">
          <div className={`w-8 h-8 ${colorClass} rounded-full mr-2`} />
          <span className="font-semibold">
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const PeriodicTable = () => {
  const elements = useElementData();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query

  // Filter elements based on the selected category and search query
  const filteredElements = elements.filter((element) => {
    // Check if the element matches the selected category (if any)
    const matchesCategory =
      selectedCategory === "all" ||
      element.category.toLowerCase() === selectedCategory.toLowerCase();

    // Check if the element matches the search query
    const matchesSearch =
      element.atomicNumber.toString().includes(searchQuery) ||
      element.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      element.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <ColorLegend />
      {/* Search bar for filtering */}
      <div className="flex justify-center mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by atomic number, name, or symbol"
          className="border border-gray-300 p-2 rounded-lg w-full max-w-xs shadow-sm focus:outline-none focus:border-blue-500"
        />
      </div>
      <ElementFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-6">
        {filteredElements.length > 0 ? (
          filteredElements.map((element) => (
            <ElementCard
              key={element.symbol}
              atomicNumber={element.atomicNumber}
              symbol={element.symbol}
              name={element.name}
              atomicWeight={element.atomicWeight}
              category={element.category}
              electronConfiguration={element.electronConfiguration}   // Added for electron configuration
              density={element.density}          // Added for density (can be null for unknown values)
              meltingPoint={element.meltingPoint}   // Added for melting point (can be null for unknown values)
              boilingPoint={element.boilingPoint}    // Added for boiling point (can be null for unknown values)
              phase={element.phase}
            />
          ))
        ) : (
          <p className="col-span-full text-center">No elements found</p>
        )}
      </div>
    </div>
  );
};