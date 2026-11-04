// Shared by the import modal (preview) and /api/diamonds/bulk (authoritative check).

export const IMPORT_FIELDS = [
  { key: "diamond_id", label: "Stock ID", aliases: ["STOCK ID", "STOCKID", "STOCK NO", "STOCK", "ID", "REF", "REFERENCE"] },
  { key: "certificate_number", label: "Certificate No.", aliases: ["CERTIFICATE", "CERTIFICATE NO", "CERT NO", "CERT", "REPORT NO", "REPORT NUMBER"] },
  { key: "lab", label: "Lab", aliases: ["LAB"] },
  { key: "shape", label: "Shape", required: true, aliases: ["SHAPE"] },
  { key: "weight", label: "Carats", required: true, aliases: ["CTS", "CARAT", "CARATS", "WEIGHT", "SIZE"] },
  { key: "color", label: "Color", required: true, aliases: ["COLOR", "COLOUR"] },
  { key: "clarity", label: "Clarity", required: true, aliases: ["CLARITY", "PURITY"] },
  { key: "cut", label: "Cut (optional)", aliases: ["CUT", "CUT GRADE"] },
  { key: "pol", label: "Polish", aliases: ["POLISH", "POL"] },
  { key: "sym", label: "Symmetry", aliases: ["SYMMETRY", "SYM"] },
  { key: "flor", label: "Fluorescence", aliases: ["FLUORESCENCE", "FLUORESCENCE INTENSITY", "FLUOR", "FLOUR", "FLOR"] },
  { key: "rap_rate", label: "Rap rate / ct (USD)", aliases: ["RAP", "RAP RATE", "RAPAPORT", "RAP PRICE"] },
  { key: "rap_discount", label: "Rap discount %", aliases: ["DISC", "DISCOUNT", "RAP DISCOUNT", "DISC %", "RAP %"] },
  { key: "price_per_carat_usd", label: "Price / ct (USD)", aliases: ["RATE/CT", "RATE", "PRICE/CT", "PRICE PER CARAT", "$/CT", "PPC", "BUY P/CT", "BUY PRICE/CT", "BUY RATE"] },
  { key: "conversion_rate", label: "USD → INR rate", aliases: ["CONVERSION RATE", "USD RATE", "FX", "INR RATE"] },
  { key: "measurement", label: "Measurements", aliases: ["MEASUREMENT", "MEASUREMENTS", "MEAS"] },
  { key: "length", label: "Length", aliases: ["LENGTH", "MEASUREMENTS LENGTH"] },
  { key: "width", label: "Width", aliases: ["WIDTH", "MEASUREMENTS WIDTH"] },
  { key: "depth", label: "Depth (mm)", aliases: ["DEPTH MM", "MEASUREMENTS DEPTH"] },
  { key: "table_percentage", label: "Table %", aliases: ["TABLE", "TABLE %", "TABLE PERCENT"] },
  { key: "depth_percentage", label: "Depth %", aliases: ["DEPTH", "DEPTH %", "DEPTH PERCENT", "TOTAL DEPTH"] },
  { key: "ratio", label: "Ratio", aliases: ["RATIO"] },
  { key: "purchase_from", label: "Purchased from", aliases: ["SUPPLIER", "PURCHASE FROM", "VENDOR"] },
  { key: "pur_rap_discount", label: "Purchase rap discount %", aliases: ["PURCHASE DISC", "PUR DISC", "PUR RAP DISCOUNT"] },
  { key: "purchase_conversion_rate", label: "Purchase USD → INR rate", aliases: ["PURCHASE RATE", "PUR CONVERSION RATE"] },
  { key: "location", label: "Location", aliases: ["LOCATION", "LOC"] },
  { key: "report_dt", label: "Report date", aliases: ["REPORT DATE", "REPORT DT"] },
  { key: "availability", label: "Status / availability", aliases: ["AVAILABILITY", "STATUS", "STOCK STATUS"] },
  { key: "girdle_condition", label: "Girdle condition", aliases: ["GIRDLE CONDITION"] },
  { key: "girdle_pct", label: "Girdle %", aliases: ["GIRDLE PERCENT", "GIRDLE %"] },
  { key: "culet_size", label: "Culet size", aliases: ["CULET SIZE"] },
  { key: "report_comments", label: "Comments", aliases: ["REMARK", "REMARKS", "NOTE", "NOTES", "COMMENTS", "CERT COMMENT", "MEMBER COMMENTS"] },
];

export const MAX_IMPORT_ROWS = 2000;

const LABS = ["GIA", "IGI", "HRD", "AGS", "GCAL", "EGL"];
const SHAPES = ["round", "princess", "cushion", "oval", "emerald", "pear", "marquise", "radiant", "asscher", "heart"];
const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"];

const GRADE = {
  ID: "ideal", IDEAL: "ideal", EX: "excellent", EXC: "excellent", EXCELLENT: "excellent",
  VG: "very_good", "VERY GOOD": "very_good", G: "good", GD: "good", GOOD: "good",
  F: "fair", FR: "fair", FAIR: "fair", P: "poor", PR: "poor", POOR: "poor",
};
const FLUOR = {
  N: "none", NON: "none", NONE: "none", NIL: "none",
  F: "faint", FNT: "faint", FAINT: "faint",
  M: "medium", MED: "medium", MEDIUM: "medium",
  S: "strong", STG: "strong", STR: "strong", STRONG: "strong",
  VS: "very_strong", VST: "very_strong", "VERY STRONG": "very_strong",
};

const SHAPE_ALIASES = { BRILLIANT: "round", RBC: "round", BR: "round", RD: "round", PS: "pear", OV: "oval", EM: "emerald", MQ: "marquise", CU: "cushion", RAD: "radiant", PR: "princess", PRN: "princess", HT: "heart", AS: "asscher" };

const AVAILABILITY = {
  AVAILABLE: "available", "IN STOCK": "available", STOCK: "available",
  MEMO: "memo", "ON MEMO": "memo", "OUT ON MEMO": "memo",
  "PLEASE CALL FOR STATUS": "subject_to_sale", "CALL FOR STATUS": "subject_to_sale", "SUBJECT TO PRIOR SALE": "subject_to_sale", "SUBJECT TO SALE": "subject_to_sale", HOLD: "subject_to_sale", "ON HOLD": "subject_to_sale",
  "AT LAB": "at_lab", SOLD: "sold",
};

export const BUILTIN_SHAPES = SHAPES;

const clean = (v) => (v === null || v === undefined ? "" : String(v).replace(/\s+/g, " ").trim());

export const toNumber = (v) => {
  const s = clean(v).replace(/[,\s$₹%]/g, "");
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

const upper = (v) => clean(v).toUpperCase();

export function guessMapping(headers) {
  const norm = (h) => upper(h).replace(/#/g, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim();
  const map = {};
  const taken = new Set();
  IMPORT_FIELDS.forEach((f) => {
    const idx = headers.findIndex((h, i) => !taken.has(i) && (norm(h) === upper(f.label) || f.aliases.includes(norm(h))));
    if (idx >= 0) {
      map[f.key] = idx;
      taken.add(idx);
    }
  });
  return map;
}

// Turn one raw row (already keyed by field) into a DB-ready record or a list of errors.
export function normalizeRow(raw) {
  const errors = [];
  const warnings = [];
  const r = {};

  const text = (k) => { const v = clean(raw[k]); r[k] = v === "" ? null : v; };
  ["diamond_id", "certificate_number", "measurement", "purchase_from", "location", "report_dt", "report_comments", "girdle_condition", "girdle_pct", "culet_size"].forEach(text);

  // Lab
  const lab = upper(raw.lab);
  if (lab) {
    if (LABS.includes(lab)) r.lab = lab;
    else { r.lab = "OTHER"; warnings.push(`Lab "${clean(raw.lab)}" saved as Other`); }
  } else r.lab = null;

  // Shape: any non-empty value is accepted so custom shapes can come in with new stock.
  // Known aliases map to the built-in shapes; anything else is kept as typed (lower-cased).
  const shapeRaw = upper(raw.shape);
  if (!shapeRaw) errors.push("Shape is required");
  else {
    const known = SHAPES.find((s) => s.toUpperCase() === shapeRaw) || SHAPE_ALIASES[shapeRaw];
    const custom = clean(raw.shape).toLowerCase();
    if (known) r.shape = known;
    else if (custom.length > 40) errors.push(`Shape "${clean(raw.shape)}" is too long (max 40 characters)`);
    else r.shape = custom;
  }

  // Carats
  const w = toNumber(raw.weight);
  if (w === null) errors.push("Carats is required");
  else if (Number.isNaN(w) || w <= 0) errors.push(`Carats "${clean(raw.weight)}" is not a positive number`);
  else r.weight = w;

  // Color / clarity
  const color = upper(raw.color);
  if (!color) errors.push("Color is required");
  else if (!COLORS.includes(color)) errors.push(`Unknown color "${clean(raw.color)}"`);
  else r.color = color;

  const clarity = upper(raw.clarity);
  if (!clarity) errors.push("Clarity is required");
  else if (!CLARITIES.includes(clarity)) errors.push(`Unknown clarity "${clean(raw.clarity)}"`);
  else r.clarity = clarity;

  // Grades
  const grade = (k, label) => {
    const v = upper(raw[k]);
    if (!v) return null;
    if (GRADE[v]) return GRADE[v];
    warnings.push(`${label} "${clean(raw[k])}" not recognised, left blank`);
    return null;
  };
  // Cut is optional: fancy and non-standard shapes often have no cut grade.
  r.cut = grade("cut", "Cut");
  r.pol = grade("pol", "Polish");
  r.sym = grade("sym", "Symmetry");
  const fl = upper(raw.flor);
  if (fl) {
    r.flor = FLUOR[fl] || null;
    if (!r.flor) warnings.push(`Fluorescence "${clean(raw.flor)}" not recognised, left blank`);
  } else r.flor = null;

  // Availability / status
  const av = upper(raw.availability);
  if (!av) r.availability = "available";
  else if (AVAILABILITY[av]) r.availability = AVAILABILITY[av];
  else {
    r.availability = "available";
    warnings.push(`Status "${clean(raw.availability)}" not recognised, saved as Available`);
  }

  // Numbers
  const num = (k, label, { min = null, max = null } = {}) => {
    const v = toNumber(raw[k]);
    if (v === null) { r[k] = null; return; }
    if (Number.isNaN(v) || (min !== null && v < min) || (max !== null && v > max)) {
      errors.push(`${label} "${clean(raw[k])}" is not valid`);
      r[k] = null;
      return;
    }
    r[k] = v;
  };
  num("rap_rate", "Rap rate", { min: 0 });
  num("rap_discount", "Rap discount", { min: -100, max: 100 });
  num("price_per_carat_usd", "Price / ct", { min: 0 });
  num("conversion_rate", "USD → INR rate", { min: 0 });
  num("length", "Length", { min: 0 });
  num("width", "Width", { min: 0 });
  num("depth", "Depth", { min: 0 });
  num("table_percentage", "Table %", { min: 0, max: 100 });
  num("depth_percentage", "Depth %", { min: 0, max: 100 });
  num("ratio", "Ratio", { min: 0 });
  num("pur_rap_discount", "Purchase rap discount", { min: -100, max: 100 });
  num("purchase_conversion_rate", "Purchase USD → INR rate", { min: 0 });

  // Prices: same formula as the Add Diamond form (discount is a positive % off Rap).
  const round2 = (n) => Math.round(n * 100) / 100;
  if (r.weight) {
    if (r.price_per_carat_usd === null && r.rap_rate !== null && r.rap_discount !== null) {
      r.price_per_carat_usd = round2(r.rap_rate * (1 - r.rap_discount / 100));
    }
    if (r.price_per_carat_usd === null) warnings.push("No price given — saved with price 0");
    r.amount_usd = round2(r.weight * (r.price_per_carat_usd || 0));
    r.amount_inr = r.conversion_rate > 0 ? round2(r.amount_usd * r.conversion_rate) : null;
    if (r.rap_rate !== null && r.pur_rap_discount !== null) {
      r.purchase_price = round2(r.weight * r.rap_rate * (1 - r.pur_rap_discount / 100));
      r.purchase_price_inr = r.purchase_conversion_rate > 0 ? round2(r.purchase_price * r.purchase_conversion_rate) : null;
    }
  }
  r.rap_rate = r.rap_rate ?? 0;
  r.rap_discount = r.rap_discount ?? 0;
  r.price_per_carat_usd = r.price_per_carat_usd ?? 0;
  r.pur_rap_discount = r.pur_rap_discount ?? 0;

  // Fields the file actually gave a value for. Updating an existing stone only touches these,
  // so a blank or unmapped column never wipes what is already saved.
  const provided = Object.keys(raw).filter((k) => clean(raw[k]) !== "");

  return { record: errors.length ? null : r, errors, warnings, provided };
}

// Within-file duplicate detection on the identifiers a stone can be recognised by.
export function findFileDuplicates(rows) {
  const seen = { diamond_id: new Map(), certificate_number: new Map() };
  const dup = {};
  rows.forEach((row, i) => {
    ["diamond_id", "certificate_number"].forEach((k) => {
      const v = clean(row[k]).toUpperCase();
      if (!v) return;
      if (seen[k].has(v)) {
        const first = seen[k].get(v);
        (dup[i] = dup[i] || []).push(`${k === "diamond_id" ? "Stock ID" : "Certificate no."} "${clean(row[k])}" repeats row ${first + 1}`);
      } else seen[k].set(v, i);
    });
  });
  return dup;
}
