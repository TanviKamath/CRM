// app/api/diamonds/bulk/route.js
import { cookies } from "next/headers";
import knex from "../../../lib/db";
import { verifyToken } from "../../../lib/services/authService";
import { normalizeRow, findFileDuplicates, MAX_IMPORT_ROWS } from "../../../lib/utils/diamondImport";

const CHUNK = 200;

// Body: { rows: [{ field: value }], commit?: boolean, skipInvalid?: boolean }
// Without commit it only validates, so the modal can show problems before anything is saved.
export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || !verifyToken(token)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { rows, commit = false, skipInvalid = false } = await req.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      return Response.json({ error: "No rows provided" }, { status: 400 });
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      return Response.json({ error: `Too many rows (max ${MAX_IMPORT_ROWS} per import)` }, { status: 400 });
    }

    const fileDup = findFileDuplicates(rows);
    const normalized = rows.map((raw) => normalizeRow(raw));

    // Identifiers already in inventory
    const certs = normalized.map((n) => n.record?.certificate_number).filter(Boolean);
    const ids = normalized.map((n) => n.record?.diamond_id).filter(Boolean);
    const existingCerts = new Set();
    const existingIds = new Set();
    if (certs.length) {
      (await knex("diamonds").whereIn("certificate_number", certs).select("certificate_number"))
        .forEach((r) => existingCerts.add(String(r.certificate_number).toUpperCase()));
    }
    if (ids.length) {
      (await knex("diamonds").whereIn("diamond_id", ids).select("diamond_id"))
        .forEach((r) => existingIds.add(String(r.diamond_id).toUpperCase()));
    }

    const results = normalized.map((n, i) => {
      const errors = [...n.errors, ...(fileDup[i] || [])];
      if (n.record) {
        const c = (n.record.certificate_number || "").toUpperCase();
        const d = (n.record.diamond_id || "").toUpperCase();
        if (c && existingCerts.has(c)) errors.push(`Certificate no. "${n.record.certificate_number}" already in inventory`);
        if (d && existingIds.has(d)) errors.push(`Stock ID "${n.record.diamond_id}" already in inventory`);
      }
      return { index: i, errors, warnings: n.warnings };
    });

    const good = results.filter((r) => r.errors.length === 0).length;
    const bad = results.length - good;

    if (!commit) {
      return Response.json({ results, valid: good, invalid: bad });
    }

    if (bad > 0 && !skipInvalid) {
      return Response.json({ error: "Some rows have errors", results, valid: good, invalid: bad }, { status: 422 });
    }

    const toInsert = results
      .filter((r) => r.errors.length === 0)
      .map((r) => ({
        ...normalized[r.index].record,
        availability: "available",
        location: normalized[r.index].record.location || "Surat",
        terms_days: 0,
      }));

    if (toInsert.length === 0) {
      return Response.json({ error: "No valid rows to import", results, valid: 0, invalid: bad }, { status: 422 });
    }

    await knex.transaction(async (trx) => {
      for (let i = 0; i < toInsert.length; i += CHUNK) {
        await trx("diamonds").insert(toInsert.slice(i, i + CHUNK));
      }
    });

    return Response.json({ created: toInsert.length, skipped: bad, results });
  } catch (e) {
    console.error("Bulk diamond import error:", e);
    return Response.json({ error: e.message || "Import failed" }, { status: 500 });
  }
}
