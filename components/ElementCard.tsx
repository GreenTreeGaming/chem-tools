import Link from "next/link";
import { CATEGORY_META } from "./PeriodicTable";

const SHORT_LABEL: Partial<Record<keyof typeof CATEGORY_META, string>> = {
  "post-transition metal": "Post-Trans",
  "alkaline earth metal": "Alkaline-Earth",
  "transition metal": "Transition",
  "noble gas": "Noble Gas",
  "alkali metal": "Alkali",
};

type ElementCardProps = {
  atomicNumber: number;
  symbol: string;
  name: string;
  category: string;
  hrefOverride?: string;
};

export const ElementCard = ({
  atomicNumber,
  symbol,
  name,
  category,
  hrefOverride,
}: ElementCardProps) => {
  const catKey = (category || "").toLowerCase().trim() as keyof typeof CATEGORY_META;
  const meta = CATEGORY_META[catKey];

  return (
    <Link href={hrefOverride ?? `/elements/${symbol}`} aria-label={`${name} details`}>
      <div
        className={[
          "group rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm",
          "transition hover:shadow-md hover:-translate-y-0.5",
          "focus-within:ring-2 focus-within:ring-blue-300",
        ].join(" ")}
      >
        {/* Top bar: number (left) + badge (right) in normal flow */}
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-xs tabular-nums text-gray-500">#{atomicNumber}</p>

          {meta && (
            <span
              title={meta.label} // full text on hover
              className={[
                "max-w-[6rem] truncate text-ellipsis overflow-hidden", // limit width
                "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                meta.bg,
                meta.text,
                meta.ring,
              ].join(" ")}
            >
              {meta.label}
            </span>
          )}
        </div>

        {/* Main content */}
        <div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-semibold tracking-tight">{symbol}</h2>
            <span className="truncate text-sm text-gray-700">{name}</span>
          </div>
        </div>

        {/* Hover indicator */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl ring-0 ring-inset ring-blue-200/0 transition group-hover:ring-2"
        />
      </div>
    </Link>
  );
};