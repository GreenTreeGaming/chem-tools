// types/element.ts
export type Element = {
  // core
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicWeight: number | null;
  category: string;
  phase: string;

  // temps in °C (we convert from K in mapper)
  meltingPoint: number | null;
  boilingPoint: number | null;

  // structure
  electronConfiguration: string;
  shells?: number[] | null;
  period?: number | null;
  group?: number | null;
  block?: string | null;

  // physical / atomic
  density: number | null;            // g/cm³
  molarHeat?: number | null;         // J/(mol·K)
  electronegativityPauling?: number | null;
  electronAffinity?: number | null;  // kJ/mol
  ionizationEnergies?: number[] | null;

  // descriptive
  appearance?: string | null;
  discoveredBy?: string | null;
  namedBy?: string | null;
  summary?: string | null;

  // media / colors / links
  cpkHex?: string | null;            // hex color like "ffffff"
  spectralImg?: string | null;
  bohrModelImage?: string | null;
  bohrModel3d?: string | null;
  image?: { title?: string; url?: string; attribution?: string } | null;
  sourceUrl?: string | null;

  // layout metadata (optional)
  xpos?: number | null;
  ypos?: number | null;
  wxpos?: number | null;
  wypos?: number | null;
};