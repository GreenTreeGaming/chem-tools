// utils/categoryMeta.ts
export const CATEGORY_META = {
  "alkali metal": {
    label: "Alkali Metal",
    bg: "bg-yellow-400",
    text: "text-white",
    ring: "ring-yellow-600"
  },
  "alkaline earth metal": {
    label: "Alkaline Earth Metal",
    bg: "bg-green-500",
    text: "text-white",
    ring: "ring-green-700"
  },
  "transition metal": {
    label: "Transition Metal",
    bg: "bg-blue-500",
    text: "text-white",
    ring: "ring-blue-700"
  },
  "post-transition metal": {
    label: "Post-Transition Metal",
    bg: "bg-orange-500",
    text: "text-white",
    ring: "ring-orange-700"
  },
  metalloid: {
    label: "Metalloid",
    bg: "bg-purple-500",
    text: "text-white",
    ring: "ring-purple-700"
  },
  nonmetal: {
    label: "Nonmetal",
    bg: "bg-pink-500",
    text: "text-white",
    ring: "ring-pink-700"
  },
  "noble gas": {
    label: "Noble Gas",
    bg: "bg-indigo-500",
    text: "text-white",
    ring: "ring-indigo-700"
  },
  lanthanide: {
    label: "Lanthanide",
    bg: "bg-teal-500",
    text: "text-white",
    ring: "ring-teal-700"
  },
  actinide: {
    label: "Actinide",
    bg: "bg-cyan-500",
    text: "text-white",
    ring: "ring-cyan-700"
  },
} as const;

// Robust normalizer
export const normalizeCat = (raw: string): keyof typeof CATEGORY_META | string => {
  if (!raw) return "";
  let s = raw
    .toLowerCase()
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-") // unify unicode dashes
    .replace(/\s*-\s*/g, "-")               // collapse hyphen spacing
    .replace(/\s+/g, " ");                  // collapse extra spaces

  const aliases: Record<string, keyof typeof CATEGORY_META> = {
    "diatomic nonmetal": "halogen",
    "polyatomic nonmetal": "nonmetal",
    "other nonmetals": "nonmetal",
    "other nonmetal": "nonmetal",
    "poor metal": "post-transition metal",
    "post transition metal": "post-transition metal",
    "lanthanoid": "lanthanide",
    "actinoid": "actinide",
  };

  if (aliases[s]) s = aliases[s];

  return (CATEGORY_META as any)[s] ? s : s;
};