import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.toLowerCase() || "";
  const page = parseInt(searchParams.get("page") || "0", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  // Read CSV file
  const filePath = path.join(process.cwd(), "public/data/bonds.csv");
  const file = fs.readFileSync(filePath, "utf8");

  // Parse CSV
  const parsed = Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
  });

  type BondRow = {
    rid: string;
    molecule: string;
    bond_index: string;
    fragment1: string;
    fragment2: string;
    bde: string;
    bond_type: string;
  };

  let rows = parsed.data as BondRow[];

  // 🔎 Apply filtering
  let filtered = rows.filter((row) => {
    if (!query) return true;
    const q = query.toLowerCase();

    return (
      row.bond_type.toLowerCase().includes(q) ||
      row.molecule.toLowerCase().includes(q) ||
      row.fragment1.toLowerCase().includes(q) ||
      row.fragment2.toLowerCase().includes(q) ||
      `${row.fragment1} + ${row.fragment2}`.toLowerCase().includes(q)
    );
  });

  // 🔢 Pagination on filtered results
  const total = filtered.length;
  const start = page * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    total,
    page,
    pageSize,
    results: paginated,
  });
}