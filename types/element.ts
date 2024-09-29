export interface Element {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicWeight: number;
  category: string;
  electronConfiguration: string;    // Added for electron configuration
  density: number | null;           // Added for density (can be null for unknown values)
  meltingPoint: number | null;      // Added for melting point (can be null for unknown values)
  boilingPoint: number | null;      // Added for boiling point (can be null for unknown values)
  phase: string;                    // Added for phase (solid, liquid, gas)
}