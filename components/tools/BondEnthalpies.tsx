"use client";

import { useEffect, useState, useMemo } from "react";

type BondRow = {
  rid: string;
  molecule: string;
  bond_index: string;
  fragment1: string;
  fragment2: string;
  bde: string;
  bond_type: string;
};

type SummaryRow = {
  bond: string;
  avg: number;
  count: number;
};

export function BondEnthalpies() {
  const [tab, setTab] = useState<"overview" | "search">("overview");
  const [query, setQuery] = useState("");
  const [bondFilter, setBondFilter] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [unit, setUnit] = useState<"kcal" | "kj">("kcal");

  const [data, setData] = useState<BondRow[]>([]);
  const [overview, setOverview] = useState<SummaryRow[]>([]);
  const pageSize = 20;

  // Load overview from precomputed JSON
  useEffect(() => {
    if (tab !== "overview") return;
    fetch("/data/bond_averages.json")
      .then((res) => res.json())
      .then((res: SummaryRow[]) => setOverview(res));
  }, [tab]);

  // Fetch search results
  useEffect(() => {
    if (tab !== "search") return;
    const q = query || bondFilter;
    fetch(`/api/bonds?q=${encodeURIComponent(q)}&page=${page}&pageSize=${pageSize}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res.results);
        setTotal(res.total);
      });
  }, [tab, query, bondFilter, page]);

  const totalPages = Math.ceil(total / pageSize);

  // Unit conversion
  const convert = (x: number) => (unit === "kcal" ? x : x * 4.184);
  const convertValue = (bde: string) => {
    const val = parseFloat(bde);
    if (isNaN(val)) return "—";
    return unit === "kcal" ? val.toFixed(2) : (val * 4.184).toFixed(1);
  };

  // Quick stats for search results
  const stats = useMemo(() => {
    if (!data.length) return null;
    const values = data.map((r) => parseFloat(r.bde)).filter((x) => !isNaN(x));
    if (!values.length) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return {
      avg: convert(avg),
      min: convert(Math.min(...values)),
      max: convert(Math.max(...values)),
    };
  }, [data, unit]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-6 py-4 text-white rounded-t-2xl">
        <h2 className="text-xl font-bold">Bond Enthalpies</h2>
        <p className="text-sm opacity-90">
          Explore bond dissociation energies (BDEs) for different bond types and molecules.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-3 border-b border-gray-200">
          <button
            onClick={() => setTab("overview")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "overview"
                ? "border-b-2 border-rose-600 text-rose-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setTab("search")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "search"
                ? "border-b-2 border-rose-600 text-rose-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setUnit(unit === "kcal" ? "kj" : "kcal")}
            className="ml-auto px-3 py-1 rounded-lg border text-xs bg-gray-50 hover:bg-gray-100"
          >
            Unit: {unit === "kcal" ? "kcal/mol" : "kJ/mol"}
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Average BDE by Bond Type</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Bond</th>
                    <th className="px-3 py-2 text-right">Average BDE ({unit}/mol)</th>
                    <th className="px-3 py-2 text-right"># Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.map((o) => (
                    <tr key={o.bond} className="border-t">
                      <td className="px-3 py-2 font-medium">{o.bond}</td>
                      <td className="px-3 py-2 text-right">{convert(o.avg).toFixed(1)}</td>
                      <td className="px-3 py-2 text-right text-gray-500">
                        {o.count.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {overview.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-gray-500 italic">
                        Loading…
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEARCH TAB */}
        {tab === "search" && (
          <div className="space-y-4">
            {/* Search controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                placeholder="Search by molecule or fragment..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-200"
              />
              <select
                value={bondFilter}
                onChange={(e) => {
                  setBondFilter(e.target.value);
                  setPage(0);
                }}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring focus:ring-rose-200"
              >
                <option value="">All bond types</option>
                <option value="C-H">C–H</option>
                <option value="O-H">O–H</option>
                <option value="N-H">N–H</option>
                <option value="C-C">C–C</option>
                <option value="C-O">C–O</option>
                <option value="C-N">C–N</option>
              </select>
            </div>

            {/* Stats summary */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Average</div>
                  <div className="font-semibold">{stats.avg.toFixed(1)} {unit}/mol</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Min</div>
                  <div className="font-semibold text-red-600">{stats.min.toFixed(1)} {unit}/mol</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <div className="text-xs text-gray-500">Max</div>
                  <div className="font-semibold text-green-600">{stats.max.toFixed(1)} {unit}/mol</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Bond</th>
                    <th className="px-3 py-2 text-left">Molecule</th>
                    <th className="px-3 py-2 text-left">Fragments</th>
                    <th className="px-3 py-2 text-right">BDE ({unit}/mol)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.rid} className="border-t">
                      <td className="px-3 py-2">{row.bond_type}</td>
                      <td className="px-3 py-2 font-mono">{row.molecule}</td>
                      <td className="px-3 py-2 text-gray-600">
                        {row.fragment1} + {row.fragment2}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-semibold ${
                          parseFloat(row.bde) > 100 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {convertValue(row.bde)}
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 italic">
                        No matches
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
              <div>
                Showing {total === 0 ? 0 : page * pageSize + 1}–
                {Math.min((page + 1) * pageSize, total)} of {total}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border text-gray-600 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border text-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}