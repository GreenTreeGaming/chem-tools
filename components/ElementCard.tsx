// components/ElementCard.tsx
"use client";
import Link from "next/link";
import { CATEGORY_META, normalizeCat } from "@/utils/categoryMeta";

type Props = {
  atomicNumber: number;
  symbol: string;
  name: string;
  category: string;
  hrefOverride?: string;
  dimmed?: boolean;
};

const FALLBACK = { bg: "bg-gray-100", text: "text-gray-900", ring: "ring-gray-200" };

export const ElementCard = ({
  atomicNumber,
  symbol,
  name,
  category,
  hrefOverride,
  dimmed = false,
}: Props) => {
  const meta =
    CATEGORY_META[normalizeCat(category) as keyof typeof CATEGORY_META] ??
    FALLBACK;

  return (
    <Link href={hrefOverride ?? `/elements/${symbol}`} aria-label={`${name} details`}>
      <div
        className={[
          "group relative rounded-xl p-2 sm:p-3 shadow-sm transition hover:shadow-md hover:-translate-y-0.5",
          meta.bg,
          meta.text,
          dimmed ? "opacity-30 grayscale pointer-events-none" : "opacity-100",
        ].join(" ")}
      >
        <div className="flex items-start justify-between">
          <p className="text-[10px] sm:text-xs tabular-nums opacity-80">
            #{atomicNumber}
          </p>
        </div>
        <div className="mt-0.5 sm:mt-1">
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-2xl sm:text-3xl font-semibold leading-none tracking-tight">
              {symbol}
            </h2>
            <span className="truncate text-xs sm:text-sm opacity-90">
              {name}
            </span>
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-inset ring-white/0 transition group-hover:ring-2"
        />
      </div>
    </Link>
  );
};
