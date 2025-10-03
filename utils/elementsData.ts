// utils/elementsData.ts
import type { Element } from "../types/element";
import raw from "./rawElements.json";
import { normalizeCat } from "./categoryMeta";

type RawImage = { title?: string; url?: string; attribution?: string };
type RawElement = {
  name: string;
  symbol: string;
  number: number;
  atomic_mass: number | null;
  category: string;
  density: number | null;
  melt: number | null; // K
  boil: number | null; // K
  phase: string;
  electron_configuration: string;
  electron_configuration_semantic?: string;
  shells?: number[];
  period?: number;
  group?: number;
  block?: string;
  molar_heat?: number | null;
  electronegativity_pauling?: number | null;
  electron_affinity?: number | null;
  ionization_energies?: number[] | null;
  appearance?: string | null;
  discovered_by?: string | null;
  named_by?: string | null;
  summary?: string | null;
  "cpk-hex"?: string | null;
  spectral_img?: string | null;
  bohr_model_image?: string | null;
  bohr_model_3d?: string | null;
  image?: RawImage | null;
  source?: string | null;
  xpos?: number | null; ypos?: number | null; wxpos?: number | null; wypos?: number | null;
};

const kToC = (k: number | null): number | null =>
  typeof k === "number" ? +(k - 273.15).toFixed(2) : null;

const normalizeCategory = (src: string): string => {
  const s = src.toLowerCase();

  if (s.includes("noble gas")) return "noble gas";
  if (s.includes("alkali metal")) return "alkali metal";
  if (s.includes("alkaline earth metal")) return "alkaline earth metal";

  // 🔧 check this first
  if (s.includes("post-transition")) return "post-transition metal";
  if (s.includes("transition metal")) return "transition metal";

  if (s.includes("lanthanide")) return "lanthanide";
  if (s.includes("actinide")) return "actinide";
  if (s.includes("metalloid")) return "metalloid";
  if (s.includes("halogen")) return "halogen";
  if (s.includes("nonmetal")) return "nonmetal";
  return src;
};

const toElement = (r: RawElement): Element => ({
  atomicNumber: r.number,
  symbol: r.symbol,
  name: r.name,
  atomicWeight: typeof r.atomic_mass === "number" ? +r.atomic_mass.toFixed(3) : null,
  category: normalizeCat(r.category, r.group),
  phase: r.phase,

  meltingPoint: kToC(r.melt),
  boilingPoint: kToC(r.boil),

  electronConfiguration: r.electron_configuration_semantic || r.electron_configuration,
  shells: r.shells ?? null,
  period: r.period ?? null,
  group: r.group ?? null,
  block: r.block ?? null,

  density: r.density ?? null,
  molarHeat: r.molar_heat ?? null,
  electronegativityPauling: r.electronegativity_pauling ?? null,
  electronAffinity: r.electron_affinity ?? null,
  ionizationEnergies: r.ionization_energies ?? null,

  appearance: r.appearance ?? null,
  discoveredBy: r.discovered_by ?? null,
  namedBy: r.named_by ?? null,
  summary: r.summary ?? null,

  cpkHex: r["cpk-hex"] ?? null,
  spectralImg: r.spectral_img ?? null,
  bohrModelImage: r.bohr_model_image ?? null,
  bohrModel3d: r.bohr_model_3d ?? null,
  image: r.image ?? null,
  sourceUrl: r.source ?? null,

  xpos: r.xpos ?? null,
  ypos: r.ypos ?? null,
  wxpos: r.wxpos ?? null,
  wypos: r.wypos ?? null,
});

export const elements: Element[] = (raw.elements as RawElement[])
  .sort((a, b) => a.number - b.number)
  .map(toElement);