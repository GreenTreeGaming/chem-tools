// @ts-nocheck
const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");

const inputPath = path.join(__dirname, "../public/data/bonds.csv");
const outputPath = path.join(__dirname, "../public/data/bond_averages.json");

// Read file
const csv = fs.readFileSync(inputPath, "utf8");

// Parse CSV
const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
});

const groups = {};

parsed.data.forEach((row) => {
  const val = parseFloat(row.bde);
  if (!isNaN(val)) {
    groups[row.bond_type] ??= [];
    groups[row.bond_type].push(val);
  }
});

// Compute averages
const summary = Object.entries(groups).map(([bond, vals]) => {
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { bond, avg, count: vals.length };
});

// Save as JSON
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
console.log(`✅ Bond summary written to ${outputPath}`);