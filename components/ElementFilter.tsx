import { useMemo } from "react";
import { CATEGORY_META } from "./PeriodicTable";

interface ElementFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const ALL = "all";

export const ElementFilter = ({
  selectedCategory,
  onCategoryChange,
}: ElementFilterProps) => {
  const categories = useMemo(
    () => [ALL, ...Object.keys(CATEGORY_META)],
    []
  );

  const norm = (v: string) => v.toLowerCase();

  return (
    <div className="w-full">
      <div
        className="flex flex-wrap items-center gap-2"
        role="tablist"
        aria-label="Filter by category"
      >
        {categories.map((cat) => {
          const isActive = norm(selectedCategory) === norm(cat);
          const meta =
            cat === ALL ? null : CATEGORY_META[cat as keyof typeof CATEGORY_META];
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(cat)}
              className={[
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition ring-1",
                isActive
                  ? meta
                    ? `${meta.bg} ${meta.text} ${meta.ring}`
                    : "bg-gray-900 text-white ring-gray-900"
                  : "bg-white text-gray-700 hover:bg-gray-50 ring-gray-200",
              ].join(" ")}
            >
              {cat === ALL ? "All" : meta?.label ?? cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};