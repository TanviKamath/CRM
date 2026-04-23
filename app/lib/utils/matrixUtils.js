// app/lib/utils/matrixUtils.js

const SIZES = ["-0", "+0", "-2", "+2", "-6.5", "+6.5", "-8", "+8", "-11", "+11", "-14", "+14", "-15", "+15", "-18", "+18"];
const STANDARD_COLORS = ["White", "White Natts", "LB", "LC", "Fancy", "Cap Color", "Green"];

export function calculateMatrixData(rows) {
  if (!rows || rows.length === 0) return null;

  // Extract dynamic unique sizes/colors
  const dynamicSizes = Array.from(new Set(rows.map(d => d.size_category || "N/A")));
  const dynamicColors = Array.from(new Set(rows.map(d => d.color_category || "N/A")));

  // Merge standard and dynamic sizes
  const allSizes = Array.from(new Set([...SIZES, ...dynamicSizes])).sort((a, b) => {
    if (a === "N/A") return 1;
    if (b === "N/A") return -1;

    const idxA = SIZES.indexOf(a);
    const idxB = SIZES.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    const vA = parseFloat(a.replace(/[+,-]/g, '')) || 0;
    const vB = parseFloat(b.replace(/[+,-]/g, '')) || 0;
    return vA - vB;
  });

  // Merge standard and dynamic colors
  const allColors = Array.from(new Set([...STANDARD_COLORS, ...dynamicColors])).sort((a, b) => {
    if (a === "N/A") return 1;
    if (b === "N/A") return -1;

    const idxA = STANDARD_COLORS.indexOf(a);
    const idxB = STANDARD_COLORS.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    return a.localeCompare(b);
  });

  // Build the grid
  const grid = {};
  const colTotals = {};
  const rowTotals = {};
  let grandTotal = 0;

  allColors.forEach(c => {
    grid[c] = {};
    rowTotals[c] = 0;
    allSizes.forEach(s => {
      grid[c][s] = { carats: 0, memoCarats: 0, totalPrice: 0, count: 0, grades: {} };
      colTotals[s] = 0;
    });
  });

  // Populate the grid
  rows.forEach(d => {
    const c = d.color_category || "N/A";
    const s = d.size_category || "N/A";
    const g = d.grade || "N/A";
    const carats = parseFloat(d.carats) || 0;
    const memoCarats = parseFloat(d.total_on_memo_carats) || 0;
    const price = parseFloat(d.total_value) || 0;

    if (grid[c] && grid[c][s]) {
      grid[c][s].carats += carats;
      grid[c][s].memoCarats += memoCarats;
      grid[c][s].totalPrice += price;
      grid[c][s].count += 1;

      if (!grid[c][s].grades[g]) {
        grid[c][s].grades[g] = { carats: 0, memoCarats: 0, totalPrice: 0, count: 0, items: [] };
      }
      grid[c][s].grades[g].carats += carats;
      grid[c][s].grades[g].memoCarats += memoCarats;
      grid[c][s].grades[g].totalPrice += price;
      grid[c][s].grades[g].count += 1;
      grid[c][s].grades[g].items.push(d);

      rowTotals[c] += carats;
      colTotals[s] += carats;
      grandTotal += carats;
    }
  });

  return { sizes: allSizes, colors: allColors, grid, rowTotals, colTotals, grandTotal };
}
