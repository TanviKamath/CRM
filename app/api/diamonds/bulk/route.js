// app/api/diamonds/bulk/route.js
import { cookies } from "next/headers";
import knex from "../../../lib/db";
import { verifyToken } from "../../../lib/services/authService";
import { normalizeRow, findFileDuplicates, MAX_IMPORT_ROWS, BUILTIN_SHAPES, IMPORT_FIELDS } from "../../../lib/utils/diamondImport";
import { blankCutValue } from "../../../lib/utils/cutColumn";

const CHUNK = 200;
const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

const LABELS = Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, f.label.replace(" (optional)", "")]));
Object.assign(LABELS, {
  amount_usd: "Amount ($)",
  amount_inr: "Amount (₹)",
  purchase_price: "Purchase price ($)",
  purchase_price_inr: "Purchase price (₹)",
  availability: "Status",
  price_per_carat_usd: "Price / ct ($)",
});

const same = (a, b) => {
  if ((a === null || a === undefined || a === "") && (b === null || b === undefined || b === "")) return true;
  const x = Number(a);
  const y = Number(b);
  if (Number.isFinite(x) && Number.isFinite(y) && String(a).trim() !== "" && String(b).trim() !== "") return Math.abs(x - y) < 1e-6;
  return String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();
};

// Work out what a row would change on an existing stone. Only fields the file provided are touched.
function buildRevision(existing, record, provided) {
  const patch = {};
  const notes = [];

  for (const k of provided) {
    if (!(k in record) || record[k] === null || record[k] === undefined) continue;
    if (k === "availability" && existing.availability === "sold") {
      notes.push("Stone is sold, so its status was left as it is");
      continue;
    }
    if (!same(existing[k], record[k])) patch[k] = record[k];
  }

  // Keep the derived prices in step with whatever changed (same formulas as the Add Diamond form).
  const merged = (k) => (k in patch ? patch[k] : existing[k]);
  const w = num(merged("weight")) || 0;
  let ppc = num(merged("price_per_carat_usd"));
  const rap = num(merged("rap_rate")) || 0;
  const disc = num(merged("rap_discount")) || 0;
  if (!provided.includes("price_per_carat_usd") && ("rap_rate" in patch || "rap_discount" in patch) && rap > 0) {
    ppc = round2(rap * (1 - disc / 100));
    if (!same(existing.price_per_carat_usd, ppc)) patch.price_per_carat_usd = ppc;
  }
  if ("weight" in patch || "price_per_carat_usd" in patch) {
    const usd = round2(w * (ppc || 0));
    if (!same(existing.amount_usd, usd)) patch.amount_usd = usd;
  }
  const rate = num(merged("conversion_rate")) || 0;
  if (rate > 0 && ("amount_usd" in patch || "conversion_rate" in patch)) {
    const usd = "amount_usd" in patch ? patch.amount_usd : num(existing.amount_usd) || 0;
    const inr = round2(usd * rate);
    if (!same(existing.amount_inr, inr)) patch.amount_inr = inr;
  }
  const purDisc = provided.includes("pur_rap_discount") ? num(merged("pur_rap_discount")) : null;
  if (purDisc !== null && rap > 0 && w > 0) {
    const pp = round2(w * rap * (1 - purDisc / 100));
    if (!same(existing.purchase_price, pp)) patch.purchase_price = pp;
    const prate = num(merged("purchase_conversion_rate")) || 0;
    if (prate > 0) {
      const ppi = round2(pp * prate);
      if (!same(existing.purchase_price_inr, ppi)) patch.purchase_price_inr = ppi;
    }
  }

  const changes = Object.keys(patch).map((k) => ({
    field: k,
    label: LABELS[k] || k,
    from: existing[k] === undefined ? null : existing[k],
    to: patch[k],
  }));
  return { patch, changes, notes };
}

// Body: { rows: [{ field: value }], commit?: boolean, updateExisting?: boolean, skipInvalid?: boolean }
// Without commit it only checks, so the modal can show what would be added / revised / rejected.
// A row whose certificate number or stock ID is already in inventory revises that stone instead of failing.
export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { rows, commit = false, updateExisting = true, skipInvalid = false } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: "No rows provided" }, { status: 400 });
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      return Response.json({ error: `Too many rows (max ${MAX_IMPORT_ROWS} per import)` }, { status: 400 });
    }

    const fileDup = findFileDuplicates(rows);
    const normalized = rows.map((raw) => normalizeRow(raw));

    // Shapes are open-ended. Reuse the spelling already in inventory, and report the genuinely new ones.
    const knownShapes = new Map(BUILTIN_SHAPES.map((x) => [x.toLowerCase(), x]));
    (await knex("diamonds").distinct("shape").whereNotNull("shape")).forEach((r) => {
      const k = String(r.shape).trim().toLowerCase();
      if (k && !knownShapes.has(k)) knownShapes.set(k, String(r.shape).trim());
    });
    const newShapes = {};

    // Stones already in inventory, by certificate number and stock ID
    const certs = normalized.map((n) => n.record?.certificate_number).filter(Boolean);
    const ids = normalized.map((n) => n.record?.diamond_id).filter(Boolean);
    const byCert = new Map();
    const byId = new Map();
    if (certs.length || ids.length) {
      const found = await knex("diamonds").where((q) => {
        if (certs.length) q.whereIn("certificate_number", certs);
        if (ids.length) q.orWhereIn("diamond_id", ids);
      });
      found.forEach((d) => {
        if (d.certificate_number) byCert.set(String(d.certificate_number).toUpperCase(), d);
        if (d.diamond_id) byId.set(String(d.diamond_id).toUpperCase(), d);
      });
    }

    const results = normalized.map((n, i) => {
      const errors = [...n.errors, ...(fileDup[i] || [])];
      const out = { index: i, errors, warnings: [...n.warnings], status: "new", match: null, changes: [] };
      if (!n.record || errors.length) {
        out.status = "error";
        return out;
      }
      const hit = knownShapes.get(n.record.shape);
      if (hit) n.record.shape = hit;

      const c = (n.record.certificate_number || "").toUpperCase();
      const d = (n.record.diamond_id || "").toUpperCase();
      const a = c ? byCert.get(c) : null;
      const b = d ? byId.get(d) : null;
      if (a && b && a.id !== b.id) {
        errors.push(`Stock ID "${n.record.diamond_id}" and certificate "${n.record.certificate_number}" belong to two different stones in inventory`);
        out.status = "error";
        return out;
      }
      const existing = a || b;
      if (!existing) {
        if (!hit) newShapes[n.record.shape] = (newShapes[n.record.shape] || 0) + 1;
        return out;
      }
      const rev = buildRevision(existing, n.record, n.provided);
      out.match = { id: existing.id, stockId: existing.diamond_id, certificate: existing.certificate_number, by: a ? "certificate number" : "stock ID" };
      out.changes = rev.changes;
      // A blank price is fine on an existing stone: its saved price is kept
      out.warnings = out.warnings.filter((w) => !w.startsWith("No price given"));
      out.warnings.push(...rev.notes);
      out.patch = rev.patch;
      out.status = rev.changes.length ? "update" : "unchanged";
      return out;
    });

    const count = (st) => results.filter((r) => r.status === st).length;
    const summary = { new: count("new"), update: count("update"), unchanged: count("unchanged"), error: count("error") };
    const publicResults = () => results.map(({ patch, ...r }) => r);

    if (!commit) {
      return Response.json({ results: publicResults(), summary, newShapes });
    }

    if (summary.error > 0 && !skipInvalid) {
      return Response.json({ error: "Some rows have errors", results: publicResults(), summary }, { status: 422 });
    }

    const blankCut = await blankCutValue(knex);
    const toInsert = results
      .filter((r) => r.status === "new")
      .map((r) => ({
        ...normalized[r.index].record,
        cut: normalized[r.index].record.cut || blankCut,
        availability: normalized[r.index].record.availability || "available",
        location: normalized[r.index].record.location || "Surat",
        terms_days: 0,
      }));
    const toUpdate = updateExisting ? results.filter((r) => r.status === "update") : [];

    if (toInsert.length === 0 && toUpdate.length === 0) {
      return Response.json({ error: "Nothing to add or revise", results: publicResults(), summary }, { status: 422 });
    }

    await knex.transaction(async (trx) => {
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        await trx("diamonds").insert(toInsert.slice(i, i + CHUNK));
      }
      for (const r of toUpdate) {
        await trx("diamonds").where({ id: r.match.id }).update({ ...r.patch, updated_at: new Date() });
      }
    });

    return Response.json({
      created: toInsert.length,
      updated: toUpdate.length,
      unchanged: summary.unchanged,
      skipped: summary.error + (updateExisting ? 0 : summary.update),
      newShapes,
    });
  } catch (e) {
    console.error("Bulk diamond import error:", e);
    return Response.json({ error: e.message || "Import failed" }, { status: 500 });
  }
}
