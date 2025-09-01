"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { elements } from "../../../utils/elementsData"; // adjust if needed
import type { Element } from "../../../types/element";
import { facts } from "../../../utils/elementsFacts";

// -----------------------------------------------------------------------------
// Category styling (kept local to avoid coupling; feel free to centralize)
// Matches the lighter aesthetic used in the table (badge + ring)
// -----------------------------------------------------------------------------
const CATEGORY_META: Record<string, { label: string; bg: string; text: string; ring: string; surface: string }> = {
  "alkali metal": { label: "Alkali Metal", bg: "bg-yellow-100", text: "text-yellow-900", ring: "ring-yellow-200", surface: "bg-yellow-50" },
  "alkaline earth metal": { label: "Alkaline Earth Metal", bg: "bg-green-100", text: "text-green-900", ring: "ring-green-200", surface: "bg-green-50" },
  "transition metal": { label: "Transition Metal", bg: "bg-blue-100", text: "text-blue-900", ring: "ring-blue-200", surface: "bg-blue-50" },
  "post-transition metal": { label: "Post-Transition Metal", bg: "bg-orange-100", text: "text-orange-900", ring: "ring-orange-200", surface: "bg-orange-50" },
  metalloid: { label: "Metalloid", bg: "bg-purple-100", text: "text-purple-900", ring: "ring-purple-200", surface: "bg-purple-50" },
  nonmetal: { label: "Nonmetal", bg: "bg-pink-100", text: "text-pink-900", ring: "ring-pink-200", surface: "bg-pink-50" },
  halogen: { label: "Halogen", bg: "bg-red-100", text: "text-red-900", ring: "ring-red-200", surface: "bg-red-50" },
  "noble gas": { label: "Noble Gas", bg: "bg-indigo-100", text: "text-indigo-900", ring: "ring-indigo-200", surface: "bg-indigo-50" },
  lanthanide: { label: "Lanthanide", bg: "bg-teal-100", text: "text-teal-900", ring: "ring-teal-200", surface: "bg-teal-50" },
  actinide: { label: "Actinide", bg: "bg-cyan-100", text: "text-cyan-900", ring: "ring-cyan-200", surface: "bg-cyan-50" },
};

const normalize = (v?: string) => (v ?? "").toLowerCase().trim();

// Safer numeric formatting
const fmt = (val: number | null | undefined, digits = 2) =>
  typeof val === "number" && !Number.isNaN(val) ? val.toFixed(digits) : "Not found";

const getFunFact = (symbol: string) => facts[symbol] || "No fun fact available.";

// Fetch a Wikipedia thumbnail for an element name
async function fetchWikipediaThumb(name: string): Promise<string | null> {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", name);
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("format", "json");
    url.searchParams.set("pithumbsize", "800");
    url.searchParams.set("origin", "*"); // CORS

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const firstKey = Object.keys(pages)[0];
    const thumb = pages?.[firstKey]?.thumbnail?.source as string | undefined;
    return thumb ?? null;
  } catch (e) {
    console.error("Error fetching image from Wikipedia:", e);
    return null;
  }
}

export default function ElementDetail() {
  const pathname = usePathname();
  const router = useRouter();
  const symbolFromPath = useMemo(() => decodeURIComponent(pathname.split("/").pop() || ""), [pathname]);

  const [element, setElement] = useState<Element | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImg, setLoadingImg] = useState<boolean>(false);

  // Resolve element from URL symbol
  useEffect(() => {
    if (!symbolFromPath) return;
    const found = elements.find((el) => normalize(el.symbol) === normalize(symbolFromPath));
    setElement(found ?? null);
  }, [symbolFromPath]);

  // Fetch thumbnail when element changes
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!element?.name) {
        setImageUrl(null);
        return;
      }
      setLoadingImg(true);
      const url = await fetchWikipediaThumb(element.name);
      if (alive) {
        setImageUrl(url);
        setLoadingImg(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [element?.name]);

  if (!element) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">Element not found.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <span aria-hidden>←</span> Back
          </button>
        </div>
      </div>
    );
  }

  const catKey = normalize(element.category);
  const meta = CATEGORY_META[catKey];
  const wikiHref = `https://en.wikipedia.org/wiki/${encodeURIComponent(element.name)}`;

  // Render electron configuration with clickable noble-gas core
  const renderElectronConfiguration = (config: string) => {
    const regex = /\[(.*?)\]/g; // [He], [Ne], etc.
    const parts = config.split(regex);
    return (
      <>
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            const noble = part.trim();
            const target = elements.find((el) => el.symbol === noble);
            return target ? (
              <Link
                key={`${noble}-${i}`}
                href={`/elements/${noble}`}
                className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
              >
                [{noble}]
              </Link>
            ) : (
              <span key={`${noble}-${i}`}>[{noble}]</span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className={["min-h-screen", meta?.surface ?? "bg-gray-50", "px-4 sm:px-6 lg:px-8 py-6"].join(" ")}> 
      <div className="mx-auto max-w-5xl">
        {/* Header / Back */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <span aria-hidden>←</span>
            Back
          </button>
          {meta && (
            <span className={["rounded-full px-3 py-1 text-xs font-semibold ring-1", meta.bg, meta.text, meta.ring].join(" ")}>{meta.label}</span>
          )}
        </div>

        {/* Card */}
        <div className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm md:grid-cols-2">
          {/* Left: main info */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {element.name} <span className="text-gray-400">({element.symbol})</span>
            </h1>
            <p className="mt-1 text-sm text-gray-500">Atomic Number #{element.atomicNumber}</p>

            {/* Quick stats */}
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Atomic Weight</dt>
                <dd className="text-sm font-medium">{fmt((element as any).atomicWeight, 3)}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Phase</dt>
                <dd className="text-sm font-medium">{element.phase ?? "—"}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Density (g/cm³)</dt>
                <dd className="text-sm font-medium">{fmt((element as any).density)}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Boiling (°C)</dt>
                <dd className="text-sm font-medium">{fmt((element as any).boilingPoint)}</dd>
              </div>
            </dl>

            {/* Properties list */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Electron Configuration</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {renderElectronConfiguration(element.electronConfiguration)}
              </p>
            </div>

            {/* Fun Fact */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold">Fun Fact</h2>
              <p className="mt-1 italic text-gray-700">{getFunFact(element.symbol)}</p>
            </div>

            {/* Links */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={wikiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Learn more on Wikipedia ↗
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Explore all elements
              </Link>
            </div>
          </div>

          {/* Right: image */}
          <div className="md:pl-4">
            <h2 className="sr-only">Image</h2>
            <div className={["aspect-square w-full max-w-sm mx-auto rounded-2xl border", meta?.ring ?? "ring-gray-200", "border-gray-200 bg-gray-50 overflow-hidden"].join(" ")}> 
              {loadingImg ? (
                <div className="h-full w-full animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              ) : imageUrl ? (
                // Using native img to avoid domain config requirements for next/image
                <img src={imageUrl} alt={element.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No image available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
