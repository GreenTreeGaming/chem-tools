"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { elements } from "../../../utils/elementsData";
import type { Element } from "../../../types/element";
import { CATEGORY_META, normalizeCat } from "@/utils/categoryMeta";

const norm = (v?: string) => (v ?? "").toLowerCase().trim();
const fmt = (val: number | null | undefined, digits = 2) =>
  typeof val === "number" && !Number.isNaN(val) ? val.toFixed(digits) : "—";
const joinUnits = (val: number | null | undefined, unit: string, digits = 2) =>
  typeof val === "number" && !Number.isNaN(val) ? `${val.toFixed(digits)} ${unit}` : "—";

// Reuse Wikipedia thumbnail if you still want it as a fallback (kept minimal)
async function fetchWikipediaThumb(name: string): Promise<string | null> {
  try {
    const url = new URL("https://en.wikipedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", name);
    url.searchParams.set("prop", "pageimages");
    url.searchParams.set("format", "json");
    url.searchParams.set("pithumbsize", "800");
    url.searchParams.set("origin", "*");
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages ?? {};
    const firstKey = Object.keys(pages)[0];
    return pages?.[firstKey]?.thumbnail?.source ?? null;
  } catch {
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

  useEffect(() => {
    if (!symbolFromPath) return;
    const found = elements.find((el) => norm(el.symbol) === norm(symbolFromPath));
    setElement(found ?? null);
  }, [symbolFromPath]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!element) return;
      // Prefer dataset image, then Bohr image, then fetch a wiki thumb
      const preferred =
        element.image?.url ??
        element.bohrModelImage ??
        null;
      if (preferred) {
        setImageUrl(preferred);
        return;
      }
      setLoadingImg(true);
      const fallback = await fetchWikipediaThumb(element.name);
      if (alive) {
        setImageUrl(fallback);
        setLoadingImg(false);
      }
    })();
    return () => { alive = false; };
  }, [element]);

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

  const meta = CATEGORY_META[norm(element.category)];
  const wikiHref = element.sourceUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(element.name)}`;

  // Electron configuration with clickable noble-gas core
  const renderElectronConfiguration = (config: string) => {
    const regex = /\[(.*?)\]/g;
    const parts = config.split(regex);
    return (
      <>
        {parts.map((part, i) => {
          if (i % 2 === 1) {
            const noble = part.trim();
            const target = elements.find((el) => el.symbol === noble);
            return target ? (
              <Link key={`${noble}-${i}`} href={`/elements/${noble}`} className="text-blue-600 underline underline-offset-2 hover:text-blue-700">
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
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <span aria-hidden>←</span> Back
          </button>
          {meta && (
            <span className={["rounded-full px-3 py-1 text-xs font-semibold ring-1", meta.bg, meta.text, meta.ring].join(" ")}>
              {meta.label}
            </span>
          )}
        </div>

        {/* Main card */}
        <div className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm md:grid-cols-5">
          {/* Left column — identity & overview */}
          <div className="md:col-span-3">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {element.name} <span className="text-gray-400">({element.symbol})</span>
            </h1>

            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">Atomic # {element.atomicNumber}</span>
              {element.block && <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">Block: {element.block.toUpperCase()}</span>}
              {typeof element.period === "number" && <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">Period {element.period}</span>}
              {typeof element.group === "number" && <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">Group {element.group}</span>}
              {element.shells?.length ? (
                <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                  Shells: {element.shells.join(" • ")}
                </span>
              ) : null}
              {element.cpkHex && (
                <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1">
                  CPK <span className="h-3 w-3 rounded" style={{ backgroundColor: `#${element.cpkHex}` }} />
                  #{element.cpkHex}
                </span>
              )}
            </div>

            {/* Summary */}
            {element.summary && (
              <p className="mt-4 text-sm leading-6 text-gray-700">{element.summary}</p>
            )}

            {/* Quick stats */}
            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Atomic Weight</dt>
                <dd className="text-sm font-medium">{fmt(element.atomicWeight, 3)}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Phase</dt>
                <dd className="text-sm font-medium">{element.phase || "—"}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Density</dt>
                <dd className="text-sm font-medium">{joinUnits(element.density, "g/cm³")}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Molar Heat</dt>
                <dd className="text-sm font-medium">{joinUnits(element.molarHeat ?? null, "J/(mol·K)")}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Melting</dt>
                <dd className="text-sm font-medium">{joinUnits(element.meltingPoint, "°C")}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Boiling</dt>
                <dd className="text-sm font-medium">{joinUnits(element.boilingPoint, "°C")}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Electronegativity</dt>
                <dd className="text-sm font-medium">{fmt(element.electronegativityPauling)}</dd>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <dt className="text-xs text-gray-500">Electron Affinity</dt>
                <dd className="text-sm font-medium">{joinUnits(element.electronAffinity ?? null, "kJ/mol")}</dd>
              </div>
            </dl>

            {/* Electronic structure */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold">Electronic Structure</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">
                {element.electronConfiguration ? (
                  <>
                    {/** clickable noble-gas core */}
                    {renderElectronConfiguration(element.electronConfiguration)}
                  </>
                ) : "—"}
              </p>
              {element.ionizationEnergies?.length ? (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Ionization Energies (kJ/mol)</div>
                  <div className="text-sm text-gray-700">
                    {element.ionizationEnergies.join(", ")}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Discovery / naming */}
            {(element.discoveredBy || element.namedBy || element.appearance) && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">History & Naming</h2>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {element.appearance && <li><strong>Appearance:</strong> {element.appearance}</li>}
                  {element.discoveredBy && <li><strong>Discovered by:</strong> {element.discoveredBy}</li>}
                  {element.namedBy && <li><strong>Named by:</strong> {element.namedBy}</li>}
                </ul>
              </div>
            )}

            {/* External links */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                Explore all elements
              </Link>
              <a
                href={wikiHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                Learn more on Wikipedia ↗
              </a>
              {element.bohrModel3d && (
                <a
                  href={element.bohrModel3d}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                >
                  View Bohr 3D model ↗
                </a>
              )}
            </div>
          </div>

          {/* Right column — media */}
          <div className="md:col-span-2 md:pl-4">
            <h2 className="sr-only">Media</h2>

            {/* Primary image */}
            <div className={["aspect-square w-full rounded-2xl border", meta?.ring ?? "ring-gray-200", "border-gray-200 bg-gray-50 overflow-hidden"].join(" ")}>
              {loadingImg ? (
                <div className="h-full w-full animate-pulse bg-gradient-to-br from-gray-100 to-gray-200" />
              ) : imageUrl ? (
                <img src={imageUrl} alt={element.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">No image available</div>
              )}
            </div>

            {/* Spectral image */}
            {element.spectralImg && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1">Emission spectrum</div>
                <a href={element.spectralImg} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-gray-200 overflow-hidden">
                  <img src={element.spectralImg} alt={`${element.name} emission spectrum`} className="w-full h-36 object-cover" />
                </a>
              </div>
            )}

            {/* Bohr model image (if different from primary) */}
            {element.bohrModelImage && element.bohrModelImage !== imageUrl && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1">Bohr model</div>
                <a href={element.bohrModelImage} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-gray-200 overflow-hidden">
                  <img src={element.bohrModelImage} alt={`${element.name} Bohr model`} className="w-full h-36 object-contain bg-white" />
                </a>
              </div>
            )}

            {/* Attribution */}
            {element.image?.attribution && (
              <p className="mt-3 text-[11px] leading-4 text-gray-500">
                {element.image.attribution}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}