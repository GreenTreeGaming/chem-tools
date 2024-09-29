// components/ElementFilter.tsx
import { useState } from 'react';

const categories = [
  'All',
  'Alkali Metal',
  'Alkaline Earth Metal',
  'Transition Metal',
  'Post-Transition Metal',
  'Metalloid',
  'Nonmetal',
  'Halogen',
  'Noble Gas',
  'Lanthanide',
  'Actinide',
];

interface ElementFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const ElementFilter = ({ selectedCategory, onCategoryChange }: ElementFilterProps) => {
  return (
    <div className="mb-4 flex items-center justify-center">
      <label className="font-semibold mr-2">Filter by Category:</label>
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="border border-gray-300 rounded-md p-2 bg-white shadow-sm transition duration-200 focus:ring focus:ring-blue-300 focus:border-blue-500"
      >
        {categories.map((category) => (
          <option key={category} value={category.toLowerCase()}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};