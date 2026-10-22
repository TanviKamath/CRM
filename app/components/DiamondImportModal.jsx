"use client";

import { useState, useMemo, useRef } from "react";
import { IMPORT_FIELDS, MAX_IMPORT_ROWS, guessMapping } from "../lib/utils/diamondImport";

const C = { blue: "#0071e3", green: "#34c759", red: "#ff3b30", orange: "#ff9f0a", text: "#1d1d1f", sub: "#86868b", light: "#f2f2f7", border: "#e5e5ea" };
const STEPS = ["Upload", "Map columns", "Validate", "Done"];

const btn = (primary, disabled) => ({
  padding: "10px 20px", borderRadius: 12, fontSize: ".82rem", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
  border: primary ? "none" : `0.5px solid ${C.border}`, background: primary ? C.text : "#fff", color: primary ? "#fff" : C.text, opacity: disabled ? 0.5 : 1,
});

export default function DiamondImportModal({ onClose, onImported }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState("");
  const [headers, setHeaders] = useState([]);
  const [grid, setGrid] = useState([]);
  const [map, setMap] = useState({});
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState(null);
  const inputRef = useRef(null);

  const missing = IMPORT_FIELDS.filter((f) => f.required && map[f.key] === undefined);

  const rowsAsObjects = useMemo(
    () => grid.map((cells) => Object.fromEntries(Object.entries(map).map(([k, idx]) => [k, cells[idx]]))),
    [grid, map]
  );

  async function readFile(f) {
    setError("");
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await f.arrayBuffer(), { type: "array", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const all = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
      const rows = all.filter((r) => r.some((c) => String(c).trim() !== ""));
      if (rows.length < 2) throw new Error("The file needs a header row and at least one stone.");
      if (rows.length - 1 > MAX_IMPORT_ROWS) throw new Error(`This file has ${rows.length - 1} rows. The limit is ${MAX_IMPORT_ROWS} per import — please split it.`);
      const head = rows[0].map((h) => String(h).trim());
      setFile(f.name);
      setHeaders(head);
      setGrid(rows.slice(1));
      setMap(guessMapping(head));
      setStep(2);
    } catch (e) {
      setError(e.message || "Could not read that file.");
    }
  }

  async function post(commit, skipInvalid) {
    const res = await fetch("/api/diamonds/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: rowsAsObjects, commit, skipInvalid }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok && !data.results) throw new Error(data.error || "Request failed");
    return data;
  }

  async function validate() {
    setBusy(true);
    setError("");
    try {
      const data = await post(false, false);
      setResults(data.results);
      setStep(3);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function commit() {
    setBusy(true);
    setError("");
    try {
      // Only send rows that are error-free and not excluded; the server re-checks them anyway.
      const keep = results.filter((r) => r.errors.length === 0).map((r) => rowsAsObjects[r.index]);
      const res = await fetch("/api/diamonds/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: keep, commit: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Import failed");
      setOutcome({ created: data.created, left: results.length - data.created });
      setStep(4);
      onImported?.();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  const good = results.filter((r) => r.errors.length === 0);
  const bad = results.filter((r) => r.errors.length > 0);

  function downloadTemplate() {
    const head = IMPORT_FIELDS.filter((f) => f.required || ["diamond_id", "certificate_number", "lab", "pol", "sym", "flor", "rap_rate", "rap_discount"].includes(f.key)).map((f) => f.label);
    const sample = ["812-1", "2141000001", "GIA", "Round", "1.01", "F", "VS1", "EX", "EX", "EX", "None", "7500", "25"];
    const order = IMPORT_FIELDS.filter((f) => head.includes(f.label));
    const line = (a) => a.map((c) => `"${c}"`).join(",");
    const csv = [line(order.map((f) => f.label)), line(order.map((f, i) => sample[i] ?? ""))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "diamond-import-template.csv";
    a.click();
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Import diamonds" onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, width: "min(980px, 100%)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,.2)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: C.text }}>Import diamonds from Excel</div>
            <div style={{ fontSize: ".78rem", color: C.sub, marginTop: 2 }}>{STEPS.map((s, i) => (<span key={s} style={{ color: step === i + 1 ? C.text : C.sub, fontWeight: step === i + 1 ? 700 : 400 }}>{i + 1}. {s}{i < 3 ? "  ›  " : ""}</span>))}</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ border: "none", background: "none", fontSize: "1.2rem", cursor: "pointer", color: C.sub }}>×</button>
        </div>

        <div style={{ padding: 24, overflow: "auto", flex: 1 }}>
          {error && <div style={{ background: "#fff1f0", color: C.red, padding: "10px 14px", borderRadius: 10, fontSize: ".82rem", marginBottom: 16 }}>{error}</div>}

          {step === 1 && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) readFile(f); }}
                onClick={() => inputRef.current?.click()}
                style={{ border: `1.5px dashed ${C.border}`, borderRadius: 16, padding: "48px 24px", cursor: "pointer", background: C.light }}>
                <i className="bi bi-file-earmark-spreadsheet" style={{ fontSize: "2rem", color: C.sub }} />
                <div style={{ fontWeight: 600, marginTop: 8 }}>Drop an .xlsx, .xls or .csv file here, or click to choose</div>
                <div style={{ fontSize: ".78rem", color: C.sub, marginTop: 4 }}>First row = headers · up to {MAX_IMPORT_ROWS} stones · required columns: Shape, Carats, Color, Clarity, Cut</div>
              </div>
              <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
              <button onClick={downloadTemplate} style={{ ...btn(false), marginTop: 16 }}>Download template (.csv)</button>
            </div>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: ".85rem", marginBottom: 12 }}><b>{file}</b> · {grid.length} stones found. Check that each field points at the right column.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {IMPORT_FIELDS.map((f) => (
                  <label key={f.key} style={{ fontSize: ".78rem", color: C.sub, display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>{f.label}{f.required && <span style={{ color: C.red }}> *</span>}</span>
                    <select value={map[f.key] ?? ""} onChange={(e) => setMap((m) => { const n = { ...m }; if (e.target.value === "") delete n[f.key]; else n[f.key] = Number(e.target.value); return n; })}
                      style={{ padding: "8px 10px", borderRadius: 10, border: `0.5px solid ${map[f.key] === undefined && f.required ? C.red : C.border}`, fontSize: ".82rem" }}>
                      <option value="">— not in file —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                    </select>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: 18, fontSize: ".78rem", color: C.sub }}>Preview (first 5 rows)</div>
              <div style={{ overflow: "auto", border: `0.5px solid ${C.border}`, borderRadius: 12, marginTop: 6 }}>
                <table style={{ borderCollapse: "collapse", fontSize: ".78rem", width: "100%" }}>
                  <thead><tr>{headers.map((h, i) => <th key={i} style={{ textAlign: "left", padding: "6px 10px", background: C.light, whiteSpace: "nowrap" }}>{h || `Column ${i + 1}`}</th>)}</tr></thead>
                  <tbody>{grid.slice(0, 5).map((r, ri) => <tr key={ri}>{headers.map((_, ci) => <td key={ci} style={{ padding: "6px 10px", borderTop: `0.5px solid ${C.border}`, whiteSpace: "nowrap" }}>{String(r[ci] ?? "")}</td>)}</tr>)}</tbody>
                </table>
              </div>
              {missing.length > 0 && <div style={{ color: C.red, fontSize: ".8rem", marginTop: 12 }}>Map the required fields: {missing.map((m) => m.label).join(", ")}.</div>}
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ display: "flex", gap: 12, marginBottom: 14, fontSize: ".85rem" }}>
                <span style={{ color: C.green, fontWeight: 700 }}>{good.length} ready</span>
                <span style={{ color: bad.length ? C.red : C.sub, fontWeight: 700 }}>{bad.length} with errors</span>
              </div>
              {bad.length === 0 && <div style={{ color: C.sub, fontSize: ".82rem" }}>No errors found.</div>}
              {bad.length > 0 && (
                <div style={{ border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: "auto", maxHeight: 340 }}>
                  <table style={{ borderCollapse: "collapse", fontSize: ".78rem", width: "100%" }}>
                    <thead><tr><th style={{ textAlign: "left", padding: "6px 10px", background: C.light }}>Row</th><th style={{ textAlign: "left", padding: "6px 10px", background: C.light }}>Problem</th></tr></thead>
                    <tbody>{bad.map((r) => (
                      <tr key={r.index}><td style={{ padding: "6px 10px", borderTop: `0.5px solid ${C.border}`, whiteSpace: "nowrap" }}>{r.index + 2}</td>
                        <td style={{ padding: "6px 10px", borderTop: `0.5px solid ${C.border}`, color: C.red }}>{r.errors.join(" · ")}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
              {results.some((r) => r.errors.length === 0 && r.warnings.length > 0) && (
                <div style={{ marginTop: 12, fontSize: ".78rem", color: C.orange }}>
                  Notes on rows that will still import: {results.filter((r) => r.errors.length === 0 && r.warnings.length).slice(0, 5).map((r) => `row ${r.index + 2}: ${r.warnings.join(", ")}`).join(" · ")}
                  {results.filter((r) => r.errors.length === 0 && r.warnings.length).length > 5 && " …"}
                </div>
              )}
              {bad.length > 0 && <div style={{ marginTop: 12, fontSize: ".78rem", color: C.sub }}>Rows with errors are skipped. Fix them in the file and import again if you need them.</div>}
            </>
          )}

          {step === 4 && outcome && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: "2.4rem", color: C.green }} />
              <div style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 8 }}>{outcome.created} stones added to inventory</div>
              {outcome.left > 0 && <div style={{ color: C.sub, fontSize: ".85rem", marginTop: 4 }}>{outcome.left} rows were not imported.</div>}
            </div>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
          <button style={btn(false)} onClick={step === 4 ? onClose : step > 1 ? () => setStep(step - 1) : onClose}>{step === 4 ? "Close" : step > 1 ? "Back" : "Cancel"}</button>
          {step === 2 && <button style={btn(true, missing.length > 0 || busy)} disabled={missing.length > 0 || busy} onClick={validate}>{busy ? "Checking…" : "Validate"}</button>}
          {step === 3 && <button style={btn(true, good.length === 0 || busy)} disabled={good.length === 0 || busy} onClick={commit}>{busy ? "Importing…" : `Import ${good.length} stone${good.length === 1 ? "" : "s"}`}</button>}
        </div>
      </div>
    </div>
  );
}
