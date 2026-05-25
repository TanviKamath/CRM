// app/diamonds/page.js
"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { calculateMatrixData } from "../lib/utils/matrixUtils";

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const C = {
  blue: "#0071e3", green: "#34c759", orange: "#ff9f0a", red: "#ff3b30",
  purple: "#af52de", teal: "#5ac8fa", pink: "#ff2d55", indigo: "#5856d6",
  bg: "#f5f5f7", text: "#1d1d1f", sub: "#86868b", light: "#f2f2f7", border: "#e5e5ea",
};

const SHAPES = [
  { id: "round", label: "Round", icon: "bi-circle" },
  { id: "princess", label: "Princess", icon: "bi-diamond" },
  { id: "cushion", label: "Cushion", icon: "bi-square-fill" },
  { id: "oval", label: "Oval", icon: "bi-record-circle" },
  { id: "marquise", label: "Marquise", icon: "bi-eye" },
  { id: "pear", label: "Pear", icon: "bi-droplet" },
  { id: "emerald", label: "Emerald", icon: "bi-octagon" },
  { id: "heart", label: "Heart", icon: "bi-heart" },
  { id: "radiant", label: "Radiant", icon: "bi-brightness-high" },
  { id: "asscher", label: "Asscher", icon: "bi-bounding-box" },
];

const COLORS = ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1", "I2", "I3"];
const CUTS = ["Ideal", "Excellent", "Very Good", "Good", "Fair"];
const POLISH = ["Excellent", "Very Good", "Good", "Fair"];
const SYMMETRY = ["Excellent", "Very Good", "Good", "Fair"];
const FLUORS = ["None", "Faint", "Medium", "Strong", "Very Strong"];
const LABS = ["GIA", "IGI", "HRD", "AGS", "GCAL", "GIA DOR"];
const AVAIL_OPTIONS = [
  { id: "", label: "All", color: C.text },
  { id: "available", label: "Available", color: C.green },
  { id: "memo", label: "On Memo", color: C.orange },
  { id: "sold", label: "Sold", color: C.blue },
  { id: "subject_to_sale", label: "Subject to Sale", color: C.teal },
];

const LOOSE_COLOR_CATEGORIES = ["White", "White Natts", "Off-White LB. Natts", "Off-White LC. Natts", "LB", "LC", "Fancy", "Cap Color", "Green"];
const LOOSE_SIZES = ["-0", "+0", "-2", "+2", "-6.5", "+6.5", "-8", "+8", "-11", "+11", "-14", "+14", "-15", "+15", "-18", "+18"];
const LOOSE_GRADES = [
  "D", "EF", "GH", "HI", "I", 
  "Spotted. Natts", "Dark Natts", 
  "Ttlb. Natts", "Tlb. Natts", "Lb. Natts",
  "Tttlc. Natts", "Tlc. Natts", "Lc. Natts",
  "HI (Top Water Shade)", "I (Water Shade)", "Off White TTLB", "TTLB", "TLB", "LB", "DB", "DDB",
  "Off White TTLC", "TTLC", "TLC", "LC",
  "Standard"
];

const LOOSE_GRADE_MAP = {
  White: ["D", "EF", "GH", "HI", "I"],
  "White Natts": ["Spotted. Natts", "Dark Natts"],
  "Off-White LB. Natts": ["Ttlb. Natts", "Tlb. Natts", "Lb. Natts"],
  "Off-White LC. Natts": ["Tttlc. Natts", "Tlc. Natts", "Lc. Natts"],
  LB: ["HI (Top Water Shade)", "I (Water Shade)", "Off White TTLB", "TTLB", "TLB", "LB", "DB", "DDB"],
  LC: ["HI (Top Water Shade)", "I (Water Shade)", "Off White TTLC", "TTLC", "TLC", "LC"],
  Fancy: ["Standard"],
  "Cap Color": ["Standard"],
  Green: ["Standard"],
};

const INITIAL_FILTERS = {
  shapes: [], caratMin: "", caratMax: "",
  colors: [], clarities: [], cuts: [], polish: [], symmetry: [],
  fluorescence: [], labs: [],
  priceMin: "", priceMax: "", certificate: "",
  lotNumber: "",
};

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.di-page{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
  background:${C.bg};min-height:100vh;-webkit-font-smoothing:antialiased}

.skel{background:linear-gradient(90deg,#f0f0f2 25%,#e8e8ed 50%,#f0f0f2 75%);
  background-size:200% 100%;border-radius:6px;display:inline-block;animation:skel 1.5s infinite}
@keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}

.fi{animation:fi .5s ease forwards;opacity:0}
@keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* Search */
.search-wrap{position:relative}
.search-wrap input{width:100%;padding:10px 14px 10px 38px;border:0.5px solid ${C.border};
  border-radius:10px;font-size:.82rem;background:#fff;color:${C.text};
  transition:all .2s;outline:none}
.search-wrap input:focus{border-color:${C.blue};box-shadow:0 0 0 3px rgba(0,113,227,.1)}
.search-wrap .s-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);
  color:${C.sub};font-size:.85rem;pointer-events:none}

/* Availability pills */
.av-pill{padding:6px 14px;border-radius:980px;font-size:.75rem;font-weight:600;border:none;
  cursor:pointer;transition:all .2s;background:transparent;color:${C.sub}}
.av-pill:hover{background:rgba(0,0,0,.04)}
.av-pill.active{background:${C.text};color:#fff}


/* Advanced button */
.adv-btn{display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;
  font-size:.8rem;font-weight:600;border:0.5px solid ${C.border};background:#fff;
  color:${C.text};cursor:pointer;transition:all .2s;white-space:nowrap}
.adv-btn:hover{background:${C.light};border-color:${C.blue}}
.adv-btn.has-filters{border-color:${C.blue};color:${C.blue};background:rgba(0,113,227,.04)}

/* Filter chips */
.chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px 4px 12px;
  border-radius:980px;font-size:.7rem;font-weight:600;background:rgba(0,113,227,.08);
  color:${C.blue};white-space:nowrap}
.chip button{background:none;border:none;cursor:pointer;padding:0;display:flex;
  color:${C.blue};opacity:.6;transition:opacity .15s}
.chip button:hover{opacity:1}

/* Table card */
.tbl-card{background:#fff;border-radius:16px;border:0.5px solid rgba(0,0,0,.06);
  box-shadow:0 1px 3px rgba(0,0,0,.03);overflow:hidden}
.tbl-header{padding:16px 20px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:0.5px solid ${C.light};flex-wrap:wrap;gap:8px}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.tbl-wrap::-webkit-scrollbar{height:6px}
.tbl-wrap::-webkit-scrollbar-track{background:${C.light}}
.tbl-wrap::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}

.di-tbl{border-collapse:separate;border-spacing:0;width:max-content;min-width:100%}
.di-tbl th,.di-tbl td{padding:12px 16px;white-space:nowrap;font-size:.8rem;text-align:left;
  border-bottom:0.5px solid ${C.light}}
.di-tbl th{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;
  color:${C.sub};background:#fafafa;position:sticky;top:0;z-index:1;cursor:pointer;
  user-select:none;transition:background .15s}
.di-tbl th:hover{background:#f0f0f2}
.di-tbl tbody tr{transition:background .12s}
.di-tbl tbody tr:hover{background:rgba(0,113,227,.02)}

/* Frozen left columns */
.fz{position:sticky;z-index:3;background:#fff}
.di-tbl thead .fz{z-index:5;background:#fafafa}
.di-tbl tbody tr:hover .fz{background:#f5f8ff;z-index:8}

/* Shadow on last frozen column */
.fz-last::after{content:'';position:absolute;top:0;right:-8px;bottom:0;width:8px;
  background:linear-gradient(90deg,rgba(0,0,0,.06),transparent);pointer-events:none}

/* Frozen right action column */
.fz-r{position:sticky;right:0;z-index:4;background:#fff;box-shadow:-4px 0 12px rgba(0,0,0,.04)}
.di-tbl thead .fz-r{z-index:6;background:#fafafa}
.di-tbl tbody tr:hover .fz-r{background:#f5f8ff;z-index:8}
.fz-r::before{content:'';position:absolute;top:0;left:-8px;bottom:0;width:8px;
  background:linear-gradient(270deg,rgba(0,0,0,.06),transparent);pointer-events:none}

/* Badges */
.av-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:980px;
  font-size:.68rem;font-weight:600}
.av-badge .dot{width:5px;height:5px;border-radius:50%}

/* Action buttons */
.act-btn{width:36px;height:36px;border-radius:10px;border:0.5px solid ${C.border};cursor:pointer;
  display:inline-flex;align-items:center;justify-content:center;font-size:.88rem;
  transition:all .18s;background:#fff;color:${C.sub};text-decoration:none}
.act-btn:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.06)}
.act-btn.view{color:${C.blue}}
.act-btn.view:hover{background:rgba(0,113,227,.06);border-color:${C.blue};color:${C.blue}}
.act-btn.edit{color:${C.orange}}
.act-btn.edit:hover{background:rgba(255,159,10,.06);border-color:${C.orange};color:${C.orange}}
.act-btn.sell{color:${C.green}}
.act-btn.sell:hover{background:rgba(52,199,89,.06);border-color:${C.green};color:${C.green}}
.act-btn.memo{color:${C.purple}}
.act-btn.memo:hover{background:rgba(175,82,222,.06);border-color:${C.purple};color:${C.purple}}
.act-btn.del{color:${C.red}}
.act-btn.del:hover{background:rgba(255,59,48,.06);border-color:${C.red};color:${C.red}}

.act-tooltip{position:relative}
.act-tooltip::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 6px);left:50%;
  transform:translateX(-50%) scale(.9);background:${C.text};color:#fff;font-size:.62rem;
  font-weight:600;padding:4px 8px;border-radius:6px;white-space:nowrap;opacity:0;
  pointer-events:none;transition:all .15s ease;z-index:10}
.act-tooltip:hover::after{opacity:1;transform:translateX(-50%) scale(1)}

/* Sort */
.sort-icon{font-size:.55rem;margin-left:3px;opacity:.4;transition:opacity .15s}
.sort-icon.active{opacity:1;color:${C.blue}}

/* Modal */
.modal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.25);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);display:flex;
  align-items:flex-start;justify-content:center;padding:40px 16px;
  opacity:0;pointer-events:none;transition:opacity .25s ease}
.modal-overlay.show{opacity:1;pointer-events:auto}

.modal-card{background:#fff;border-radius:20px;width:100%;max-width:860px;
  max-height:calc(100vh - 80px);display:flex;flex-direction:column;
  box-shadow:0 24px 80px rgba(0,0,0,.12),0 0 0 .5px rgba(0,0,0,.05);
  transform:scale(.97) translateY(10px);transition:transform .3s cubic-bezier(.25,.46,.45,.94);
  overflow:hidden}
.modal-overlay.show .modal-card{transform:scale(1) translateY(0)}

.modal-head{padding:20px 24px;display:flex;justify-content:space-between;align-items:center;
  border-bottom:.5px solid ${C.light};flex-shrink:0}
.modal-body{overflow-y:auto;padding:0;flex:1}
.modal-foot{padding:16px 24px;border-top:.5px solid ${C.light};display:flex;
  justify-content:flex-end;gap:10px;flex-shrink:0;background:#fafafa}

/* Filter sections */
.f-section{padding:18px 24px;border-bottom:.5px solid ${C.light}}
.f-section:last-child{border-bottom:none}
.f-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;
  color:${C.sub};margin-bottom:12px;display:flex;align-items:center;gap:6px}

/* Toggle pills */
.tg-pill{padding:6px 14px;border-radius:8px;font-size:.76rem;font-weight:600;
  border:.5px solid ${C.border};background:#fff;color:${C.text};cursor:pointer;
  transition:all .18s}
.tg-pill:hover{border-color:${C.blue};color:${C.blue}}
.tg-pill.on{background:${C.text};color:#fff;border-color:${C.text}}

/* Shape buttons */
.sh-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 8px;
  border-radius:12px;border:.5px solid ${C.border};background:#fff;cursor:pointer;
  transition:all .2s;min-width:72px}
.sh-btn:hover{border-color:${C.blue};background:rgba(0,113,227,.02)}
.sh-btn.on{background:${C.text};border-color:${C.text};color:#fff}
.sh-btn .sh-icon{font-size:1.1rem;opacity:.6;transition:opacity .15s}
.sh-btn.on .sh-icon{opacity:1;color:#fff}
.sh-btn .sh-lbl{font-size:.6rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em}

/* Range inputs */
.rng-input{display:flex;align-items:center;gap:8px}
.rng-input input{flex:1;padding:8px 12px;border:.5px solid ${C.border};border-radius:8px;
  font-size:.8rem;background:#fff;color:${C.text};outline:none;transition:border-color .2s;
  min-width:0}
.rng-input input:focus{border-color:${C.blue}}
.rng-input span{color:${C.sub};font-size:.75rem;font-weight:500}

/* Modal buttons */
.m-btn{padding:9px 22px;border-radius:10px;font-size:.8rem;font-weight:600;cursor:pointer;
  transition:all .2s;border:none}
.m-btn.primary{background:${C.text};color:#fff}
.m-btn.primary:hover{background:#3a3a3c}
.m-btn.ghost{background:transparent;color:${C.sub};border:.5px solid ${C.border}}
.m-btn.ghost:hover{background:${C.light};color:${C.text}}

/* Empty state */
.empty-state{padding:64px 24px;text-align:center}

/* Scrollable cell with ellipsis */
.cell-clamp{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* Checkboxes */
.di-checkbox{width:15px;height:15px;accent-color:${C.blue};cursor:pointer;
  border-radius:4px;transition:transform .15s}
.di-checkbox:hover{transform:scale(1.1)}

@media(max-width:767px){
  .di-tbl th,.di-tbl td{padding:10px 12px;font-size:.74rem}
  .f-section{padding:14px 16px}
  .modal-card{max-height:calc(100vh - 32px)}
  .act-btn{width:32px;height:32px;font-size:.8rem;border-radius:8px}
}

/* Matrix Table Styling */
.matrix-container { overflow-x: auto; background: #fff; border-radius: 12px; border: 0.5px solid rgba(0,0,0,.08); box-shadow: 0 2px 12px rgba(0,0,0,.02); margin-bottom: 20px; padding: 1px; }
.matrix-table { width: max-content; min-width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.8rem; }
.matrix-table th, .matrix-table td { border: 0.5px solid ${C.light}; padding: 12px 14px; text-align: center; }
.matrix-table th { background: #fafafa; font-weight: 700; color: ${C.sub}; text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; z-index: 2; border-bottom: 1.5px solid ${C.light}; font-size: 0.62rem; }
.matrix-table th.col-header { top: auto; }
.matrix-table th.row-header { position: sticky; left: 0; z-index: 3; background: #fafafa; min-width: 90px; border-right: 1.5px solid ${C.light}; text-align: left; font-weight: 800; color: ${C.text}; }
.matrix-table td { background: #fff; min-width: 80px; color: ${C.text}; font-weight: 600; transition: all 0.15s ease; cursor: pointer; }
.matrix-table td:hover { background: ${C.blue}; color: #fff; transform: scale(1.03); z-index: 10; position: relative; box-shadow: 0 4px 16px rgba(0,113,227,0.2); border-radius: 6px; border-color: transparent; }
.matrix-zero { color: #e5e5ea; font-weight: 400 !important; cursor: default !important; }
.matrix-zero:hover { background: #fff !important; color: #e5e5ea !important; transform: none !important; box-shadow: none !important; }
.matrix-table tfoot th, .matrix-table tfoot td { border-top: 1.5px solid ${C.light}; background: #fafafa; }
.matrix-row-total { background: #f9f9f9; font-weight: 800 !important; border-left: 1.5px solid ${C.light} !important; color: ${C.text} !important; }
.matrix-grand-total { background: ${C.blue} !important; color: #fff !important; font-weight: 800 !important; border-left: 1.5px solid ${C.light} !important; }

/* Bifurcation & Dropdown */
.grade-card { background: #fff; border-radius: 10px; border: 1px solid rgba(0,0,0,0.05); transition: all 0.2s ease; overflow: hidden; }
.grade-card:hover { border-color: ${C.blue}; transform: translateY(-1px); }
.lot-row { transition: background 0.1s; }
.lot-row:hover { background: rgba(0,0,0,0.01); }
`;

/* ═══════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════ */
function fmt(v) {
  const n = parseFloat(v) || 0;
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "—"; }
function val(v, suffix = "") { return v != null && v !== "" ? `${v}${suffix}` : "—"; }

function Skel({ w = "100%", h = 16 }) {
  return <div className="skel" style={{ width: w, height: h }} />;
}

function AvBadge({ status }) {
  const map = {
    available: { label: "Available", bg: "rgba(52,199,89,.1)", color: C.green },
    sold: { label: "Sold", bg: "rgba(0,113,227,.1)", color: C.blue },
    memo: { label: "Memo", bg: "rgba(255,159,10,.1)", color: C.orange },
    subject_to_sale: { label: "STS", bg: "rgba(90,200,250,.1)", color: C.teal },
  };
  const s = map[status] || { label: cap(status || ""), bg: C.light, color: C.sub };
  return (
    <span className="av-badge" style={{ background: s.bg, color: s.color }}>
      <span className="dot" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

/* ═══════════════════════════════════════════
   TOGGLE GROUP
   ═══════════════════════════════════════════ */
function ToggleGroup({ options, selected, onChange, rangeSelect = false }) {
  const toggle = (opt) => {
    let next;
    if (selected.includes(opt)) {
      next = selected.filter((s) => s !== opt);
    } else if (rangeSelect && selected.length > 0) {
      const idxs = selected.map((s) => options.indexOf(s));
      const ni = options.indexOf(opt);
      const min = Math.min(...idxs, ni);
      const max = Math.max(...idxs, ni);
      next = options.slice(min, max + 1);
    } else {
      next = [...selected, opt];
    }
    onChange(next);
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((o) => (
        <button key={o} className={`tg-pill ${selected.includes(o) ? "on" : ""}`} suppressHydrationWarning onClick={() => toggle(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ADVANCED SEARCH MODAL
   ═══════════════════════════════════════════ */
function SearchModal({ show, onClose, filters, setFilters, onApply, isLoose = false }) {
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [show]);

  const update = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const availableGrades = useMemo(() => {
    if (!isLoose) return [];
    if (filters.colors.length === 0) return LOOSE_GRADES;
    const grades = new Set();
    filters.colors.forEach(cat => {
      const catGrades = LOOSE_GRADE_MAP[cat] || [];
      catGrades.forEach(g => grades.add(g));
    });
    return Array.from(grades);
  }, [filters.colors, isLoose]);

  // If selected grades are no longer available (due to color change), remove them
  useEffect(() => {
    if (!isLoose || filters.colors.length === 0) return;
    const valid = filters.clarities.filter(g => availableGrades.includes(g));
    if (valid.length !== filters.clarities.length) {
      update("clarities", valid);
    }
  }, [filters.colors, isLoose]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (filters.shapes.length) c++;
    if (filters.caratMin || filters.caratMax) c++;
    if (filters.colors.length) c++;
    if (filters.clarities.length) c++;
    if (!isLoose) {
      if (filters.cuts.length) c++;
      if (filters.polish.length) c++;
      if (filters.symmetry.length) c++;
      if (filters.fluorescence.length) c++;
      if (filters.labs.length) c++;
    }
    if (filters.priceMin || filters.priceMax) c++;
    if (filters.certificate) c++;
    if (isLoose && filters.lotNumber) c++;
    return c;
  }, [filters, isLoose]);

  return (
    <div className={`modal-overlay ${show ? "show" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, letterSpacing: "-.02em" }}>
              Advanced Search {isLoose ? "(Loose)" : ""}
            </div>
            <div style={{ fontSize: ".72rem", color: C.sub, marginTop: 2 }}>
              {activeCount > 0 ? `${activeCount} filter${activeCount > 1 ? "s" : ""} active` : "Refine your inventory search"}
            </div>
          </div>
          <button
            onClick={onClose}
            suppressHydrationWarning
            style={{
              width: 32, height: 32, borderRadius: 8, border: "none", background: C.light,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: C.sub, fontSize: ".9rem", transition: "all .15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#e8e8ed"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.light; }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="modal-body">
          {isLoose ? (
            <>
              {/* Lot Number */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-hash" style={{ color: C.blue }} /> Lot Number</div>
                <input
                  type="text" placeholder="Search by Lot ID..."
                  value={filters.lotNumber || ""}
                  suppressHydrationWarning
                  onChange={(e) => update("lotNumber", e.target.value)}
                  style={{
                    padding: "10px 14px", border: `0.5px solid ${C.border}`, borderRadius: 10,
                    fontSize: ".82rem", background: "#fff", color: C.text, outline: "none",
                    width: "100%", maxWidth: 320
                  }}
                />
              </div>

              {/* Color Category (Loose) */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-palette" style={{ color: C.orange }} /> Color Category</div>
                <ToggleGroup options={LOOSE_COLOR_CATEGORIES} selected={filters.colors}
                  onChange={(v) => update("colors", v)} />
              </div>

              {/* Size / Sieve (Loose) */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-grid-3x3" style={{ color: C.purple }} /> Size / Sieve</div>
                <ToggleGroup options={LOOSE_SIZES} selected={filters.shapes}
                  onChange={(v) => update("shapes", v)} />
              </div>

              {/* Grade (Loose) */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-eye" style={{ color: C.green }} /> Grade</div>
                <ToggleGroup options={availableGrades} selected={filters.clarities}
                  onChange={(v) => update("clarities", v)} />
              </div>
            </>
          ) : (
            <>
              {/* Shape */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-gem" style={{ color: C.blue }} /> Shape</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SHAPES.map((sh) => (
                    <button
                      key={sh.id}
                      className={`sh-btn ${filters.shapes.includes(sh.id) ? "on" : ""}`}
                      suppressHydrationWarning
                      onClick={() => {
                        const next = filters.shapes.includes(sh.id)
                          ? filters.shapes.filter((s) => s !== sh.id)
                          : [...filters.shapes, sh.id];
                        update("shapes", next);
                      }}
                    >
                      <i className={`bi ${sh.icon} sh-icon`} />
                      <span className="sh-lbl">{sh.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-palette" style={{ color: C.orange }} /> Color</div>
                <ToggleGroup options={COLORS} selected={filters.colors}
                  onChange={(v) => update("colors", v)} rangeSelect />
              </div>

              {/* Clarity */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-eye" style={{ color: C.green }} /> Clarity</div>
                <ToggleGroup options={CLARITIES} selected={filters.clarities}
                  onChange={(v) => update("clarities", v)} rangeSelect />
              </div>

              {/* Cut · Polish · Symmetry */}
              <div className="f-section">
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <div className="f-label"><i className="bi bi-scissors" style={{ color: C.indigo }} /> Cut</div>
                    <ToggleGroup options={CUTS} selected={filters.cuts} onChange={(v) => update("cuts", v)} />
                  </div>
                  <div>
                    <div className="f-label"><i className="bi bi-stars" style={{ color: C.teal }} /> Polish</div>
                    <ToggleGroup options={POLISH} selected={filters.polish} onChange={(v) => update("polish", v)} />
                  </div>
                  <div>
                    <div className="f-label"><i className="bi bi-symmetry-horizontal" style={{ color: C.pink }} /> Symmetry</div>
                    <ToggleGroup options={SYMMETRY} selected={filters.symmetry} onChange={(v) => update("symmetry", v)} />
                  </div>
                </div>
              </div>

              {/* Fluorescence */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-lightbulb" style={{ color: C.orange }} /> Fluorescence</div>
                <ToggleGroup options={FLUORS} selected={filters.fluorescence}
                  onChange={(v) => update("fluorescence", v)} />
              </div>

              {/* Lab */}
              <div className="f-section">
                <div className="f-label"><i className="bi bi-award" style={{ color: C.blue }} /> Lab</div>
                <ToggleGroup options={LABS} selected={filters.labs} onChange={(v) => update("labs", v)} />
              </div>
            </>
          )}

          {/* Carat - Common for both but different label potentially */}
          <div className="f-section">
            <div className="f-label"><i className="bi bi-rulers" style={{ color: C.purple }} /> Carat Weight</div>
            <div className="rng-input" style={{ maxWidth: 320 }}>
              <input type="number" placeholder="Min" step="0.01" value={filters.caratMin}
                suppressHydrationWarning
                onChange={(e) => update("caratMin", e.target.value)} />
              <span>to</span>
              <input type="number" placeholder="Max" step="0.01" value={filters.caratMax}
                suppressHydrationWarning
                onChange={(e) => update("caratMax", e.target.value)} />
            </div>
          </div>

          {/* Price */}
          <div className="f-section">
            <div className="f-label"><i className="bi bi-currency-rupee" style={{ color: C.green }} /> Price (INR)</div>
            <div className="rng-input" style={{ maxWidth: 320 }}>
              <input type="number" placeholder="Min" value={filters.priceMin}
                suppressHydrationWarning
                onChange={(e) => update("priceMin", e.target.value)} />
              <span>to</span>
              <input type="number" placeholder="Max" value={filters.priceMax}
                suppressHydrationWarning
                onChange={(e) => update("priceMax", e.target.value)} />
            </div>
          </div>

          {!isLoose && (
            /* Certificate */
            <div className="f-section">
              <div className="f-label"><i className="bi bi-file-earmark-text" style={{ color: C.sub }} /> Certificate Number</div>
              <input
                type="text" placeholder="Enter certificate number..."
                value={filters.certificate || ""}
                suppressHydrationWarning
                onChange={(e) => update("certificate", e.target.value)}
                style={{
                  padding: "8px 12px", border: `0.5px solid ${C.border}`, borderRadius: 8,
                  fontSize: ".8rem", background: "#fff", color: C.text, outline: "none",
                  width: "100%", maxWidth: 320, transition: "border-color .2s"
                }}
                onFocus={(e) => { e.target.style.borderColor = C.blue; }}
                onBlur={(e) => { e.target.style.borderColor = C.border; }}
              />
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="m-btn ghost" suppressHydrationWarning onClick={() => setFilters({ ...INITIAL_FILTERS })}>
            Clear All
          </button>
          <button className="m-btn primary" suppressHydrationWarning onClick={onApply}>
            <i className="bi bi-search" style={{ marginRight: 6, fontSize: ".72rem" }} />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SCROLLABLE COLUMNS (cleaned up)
   ═══════════════════════════════════════════ */
const SCROLL_COLS = [
  { key: "cut", label: "Cut", w: 100 },
  { key: "pol", label: "Polish", w: 100 },
  { key: "sym", label: "Symmetry", w: 100 },
  { key: "flor", label: "Fluor", w: 90 },
  { key: "lab", label: "Lab", w: 72 },
  { key: "rap_rate", label: "Rap", w: 90, num: true },
  { key: "rap_discount", label: "Disc %", w: 80, num: true },
  { key: "price_per_carat_usd", label: "₹/ct", w: 90, num: true },
  { key: "amount_usd", label: "Amount (₹)", w: 100, num: true },
  { key: "measurement", label: "Meas.", w: 130 },
  { key: "table_percentage", label: "Table %", w: 80, num: true },
  { key: "depth_percentage", label: "Depth %", w: 80, num: true },
  { key: "availability", label: "Status", w: 110 },
];

/* ═══════════════════════════════════════════
   MIX LOT CONFIG (for Loose clients)
   ═══════════════════════════════════════════ */
const MIX_FZ = [
  { key: "_idx", label: "#", w: 48 },
  { key: "lot_number", label: "Lot #", w: 100 },
  { key: "color_category", label: "Color", w: 100 },
  { key: "size_category", label: "Size", w: 80 },
  { key: "grade", label: "Grade", w: 160 },
];
const mixFzLeft = MIX_FZ.reduce((arr, col, i) => {
  arr.push(i === 0 ? 0 : arr[i - 1] + MIX_FZ[i - 1].w);
  return arr;
}, []);

const MIX_SCROLL_COLS = [
  { key: "carats", label: "Carats", w: 90, num: true },
  { key: "base_price", label: "Base Price (₹)", w: 110, num: true },
  { key: "discount_pct", label: "Disc %", w: 90, num: true },
  { key: "final_price_per_carat", label: "₹/ct", w: 110, num: true },
  { key: "total_value", label: "Total Value (₹)", w: 120, num: true },
  { key: "supplier_name", label: "Supplier", w: 140 },
  { key: "purchase_date", label: "Purchased", w: 120 },
];

/* Frozen left columns */
const FZ = [
  { key: "_idx", label: "#", w: 48 },
  { key: "shape", label: "Shape", w: 100 },
  { key: "weight", label: "Carat", w: 72 },
  { key: "color", label: "Color", w: 64 },
  { key: "clarity", label: "Clarity", w: 76 },
];

const fzLeft = FZ.reduce((arr, col, i) => {
  arr.push(i === 0 ? 0 : arr[i - 1] + FZ[i - 1].w);
  return arr;
}, []);

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
/* ═══════════════════════════════════════════
   EXPORT HELPERS
   ═══════════════════════════════════════════ */
const EXPORT_COLS = [
  { key: "id", label: "ID" },
  { key: "stone_type", label: "Stone Type" },
  { key: "lab", label: "Lab" },
  { key: "diamond_id", label: "Diamond ID" },
  { key: "certificate_number", label: "Certificate #" },
  { key: "shape", label: "Shape" },
  { key: "weight", label: "Carat" },
  { key: "color", label: "Color" },
  { key: "clarity", label: "Clarity" },
  { key: "cut", label: "Cut" },
  { key: "pol", label: "Polish" },
  { key: "sym", label: "Symmetry" },
  { key: "flor", label: "Fluorescence" },
  { key: "eye_clean", label: "Eye Clean" },
  { key: "no_bgm", label: "No BGM" },
  // Report & Reference
  { key: "job_no", label: "Job No" },
  { key: "control_no", label: "Control No" },
  { key: "diamond_dossier", label: "Diamond Dossier" },
  { key: "report_no", label: "Report No" },
  { key: "report_dt", label: "Report Date" },
  { key: "client_ref", label: "Client Ref" },
  { key: "memo_no", label: "Memo No" },
  // Quality
  { key: "color_descriptions", label: "Color Description" },
  { key: "clarity_status", label: "Clarity Status" },
  { key: "final_cut", label: "Final Cut" },
  { key: "fluorescence_intensity", label: "Fluor Intensity" },
  { key: "fluorescence_color", label: "Fluor Color" },
  // Origin
  { key: "country_of_origin", label: "Country of Origin" },
  { key: "rough_report_number", label: "Rough Report #" },
  { key: "diamond_type", label: "Diamond Type" },
  { key: "disclosed_source", label: "Disclosed Source" },
  { key: "kimberley_process_number", label: "Kimberley Process #" },
  { key: "rough_invoice_number", label: "Rough Invoice #" },
  // Pricing
  { key: "rap_rate", label: "Rap Rate" },
  { key: "rap_discount", label: "Disc %" },
  { key: "price_per_carat_usd", label: "₹/ct" },
  { key: "amount_usd", label: "Amount (INR)" },
  { key: "conversion_rate", label: "Conversion Rate" },
  { key: "amount_inr", label: "Amount (INR) Ref" },
  { key: "availability", label: "Status" },
  // Dimensions
  { key: "measurement", label: "Measurement" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "depth", label: "Depth" },
  { key: "table_percentage", label: "Table %" },
  { key: "depth_percentage", label: "Depth %" },
  { key: "ratio", label: "Ratio" },
  { key: "crn_ag", label: "Crown Angle" },
  { key: "crn_ht", label: "Crown Height" },
  { key: "pav_ag", label: "Pavilion Angle" },
  { key: "pav_dp", label: "Pavilion Depth" },
  { key: "str_ln", label: "Star Length" },
  { key: "lr_half", label: "LR Half" },
  { key: "girdle", label: "Girdle" },
  { key: "girdle_condition", label: "Girdle Condition" },
  { key: "girdle_pct", label: "Girdle %" },
  { key: "culet_size", label: "Culet Size" },
  // Features
  { key: "polish_features", label: "Polish Features" },
  { key: "symmetry_features", label: "Symmetry Features" },
  { key: "painting", label: "Painting" },
  { key: "proportion", label: "Proportion" },
  { key: "paint_comm", label: "Paint Comment" },
  { key: "key_to_symbols", label: "Key to Symbols" },
  { key: "report_comments", label: "Report Comments" },
  // Technical
  { key: "inscription", label: "Inscription" },
  { key: "synthetic_indicator", label: "Synthetic Indicator" },
  { key: "agsi_aset", label: "AGSI ASET" },
  { key: "shape_description", label: "Shape Description" },
  { key: "report_type", label: "Report Type" },
  { key: "sorting", label: "Sorting" },
  { key: "basket_status", label: "Basket Status" },
  { key: "location", label: "Location" },
];

function exportToExcel(diamonds) {
  const header = EXPORT_COLS.map((c) => `"${c.label}"`).join(",");
  const rows = diamonds.map((d) =>
    EXPORT_COLS.map((c) => {
      const v = d[c.key] ?? "";
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csv = "\uFEFF" + [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `diamonds_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function DiamondsIndexPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlAvailability = searchParams.get("availability") || "";

  const [user, setUser] = useState(null);
  const isLoose = user?.client_type?.toLowerCase() === "loose";
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState(urlAvailability);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS });
  const [activeFilters, setActiveFilters] = useState({ ...INITIAL_FILTERS });
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [selected, setSelected] = useState(new Set());
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [viewMode, setViewMode] = useState("matrix"); // "matrix" | "table"

  useEffect(() => {
    setHasMounted(true);
    fetch("/api/auth/me")
      .then(res => res.ok ? res.json() : null)
      .then(setUser);
  }, []);

  useEffect(() => {
    setAvailability(searchParams.get("availability") || "");
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (isLoose) {
          // Construct Query Params for Loose Items
          const params = new URLSearchParams();
          if (availability === "available") params.set("available", "true");
          if (activeFilters.lotNumber) params.set("lot_number", activeFilters.lotNumber);
          if (activeFilters.colors.length) params.set("color_category", activeFilters.colors.join(","));
          if (activeFilters.shapes.length) params.set("size_category", activeFilters.shapes.join(","));
          if (activeFilters.clarities.length) params.set("grade", activeFilters.clarities.join(","));
          if (activeFilters.caratMin) params.set("caratMin", activeFilters.caratMin);
          if (activeFilters.caratMax) params.set("caratMax", activeFilters.caratMax);
          if (activeFilters.priceMin) params.set("priceMin", activeFilters.priceMin);
          if (activeFilters.priceMax) params.set("priceMax", activeFilters.priceMax);

          const res = await fetch(`/api/loose-diamonds/items?${params.toString()}`);
          const data = await res.json();
          setDiamonds(Array.isArray(data) ? data : []);
        } else {
          // Fetch Standard Diamonds
          const payload = {
            selectedShapes: activeFilters.shapes,
            sizeFrom: activeFilters.caratMin,
            sizeTo: activeFilters.caratMax,
            color: activeFilters.colors,
            clarity: activeFilters.clarities,
            cut: activeFilters.cuts,
            polish: activeFilters.polish,
            symmetry: activeFilters.symmetry,
            fluorescence: activeFilters.fluorescence,
            lab: activeFilters.labs,
            priceFrom: activeFilters.priceMin,
            priceTo: activeFilters.priceMax,
            refNo: activeFilters.certificate,
            availability: availability,
            limit: 1000
          };

          const res = await fetch("/api/inventory/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          setDiamonds(Array.isArray(data) ? data : data.data || []);
        }
      } catch { setDiamonds([]); }
      setLoading(false);
    })();
  }, [availability, activeFilters, isLoose]);

  const changeAvail = (id) => {
    setAvailability(id);
    router.push(id ? `/diamonds?availability=${id}` : "/diamonds", { scroll: false });
  };

  const handleSort = (key) => {
    if (!key) return;
    setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));
  };

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === rows.length && rows.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((d) => d.id)));
    }
  };

  const handleExport = () => {
    const toExport = selected.size > 0
      ? rows.filter((d) => selected.has(d.id))
      : rows;
    exportToExcel(toExport);
  };

  const advFilterCount = useMemo(() => {
    let c = 0;
    Object.entries(filters).forEach(([, v]) => {
      if (Array.isArray(v) && v.length) c++;
      if (typeof v === "string" && v) c++;
    });
    return c;
  }, [filters]);

  const chips = useMemo(() => {
    const list = [];

    if (activeFilters.lotNumber) list.push({ key: "lotNumber", label: `Lot: LOT-${activeFilters.lotNumber}` });

    if (activeFilters.shapes.length) {
      list.push({ 
        key: "shapes", 
        label: `${isLoose ? "Size" : "Shape"}: ${activeFilters.shapes.map(s => isLoose ? s : cap(s)).join(", ")}` 
      });
    }

    if (activeFilters.caratMin || activeFilters.caratMax) list.push({ key: "carat", label: `Carat: ${activeFilters.caratMin || "0"} – ${activeFilters.caratMax || "∞"}` });

    if (activeFilters.colors.length) {
      list.push({ 
        key: "colors", 
        label: `${isLoose ? "Type" : "Color"}: ${activeFilters.colors.join(", ")}` 
      });
    }

    if (activeFilters.clarities.length) {
      list.push({ 
        key: "clarities", 
        label: `${isLoose ? "Grade" : "Clarity"}: ${activeFilters.clarities.join(", ")}` 
      });
    }

    if (!isLoose) {
      if (activeFilters.cuts.length) list.push({ key: "cuts", label: `Cut: ${activeFilters.cuts.join(", ")}` });
      if (activeFilters.polish.length) list.push({ key: "polish", label: `Polish: ${activeFilters.polish.join(", ")}` });
      if (activeFilters.symmetry.length) list.push({ key: "symmetry", label: `Sym: ${activeFilters.symmetry.join(", ")}` });
      if (activeFilters.fluorescence.length) list.push({ key: "fluorescence", label: `Fluor: ${activeFilters.fluorescence.join(", ")}` });
      if (activeFilters.labs.length) list.push({ key: "labs", label: `Lab: ${activeFilters.labs.join(", ")}` });
    }

    if (activeFilters.priceMin || activeFilters.priceMax) list.push({ key: "price", label: `Price: ₹${activeFilters.priceMin || "0"} – ₹${activeFilters.priceMax || "∞"}` });
    if (!isLoose && activeFilters.certificate) list.push({ key: "certificate", label: `Cert: ${activeFilters.certificate}` });

    return list;
  }, [activeFilters, isLoose]);

  const removeChip = (key) => {
    const removeFn = (f) => {
      const n = { ...f };
      if (key === "carat") { n.caratMin = ""; n.caratMax = ""; }
      else if (key === "price") { n.priceMin = ""; n.priceMax = ""; }
      else if (key === "certificate") { n.certificate = ""; }
      else if (key === "lotNumber") { n.lotNumber = ""; }
      else { n[key] = []; }
      return n;
    };
    setFilters(removeFn);
    setActiveFilters(removeFn);
  };

  const handleDelete = async (id) => {
    const msg = isLoose ? "Are you sure you want to delete this mix item?" : "Are you sure you want to delete this diamond?";
    if (!confirm(msg)) return;
    try {
      const url = isLoose ? `/api/loose-diamonds/items/${id}` : `/api/diamonds/${id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setDiamonds((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  /* Filtered & sorted */
  const rows = useMemo(() => {
    let data = [...diamonds];
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((d) =>
        [d.shape, d.color, d.clarity, d.certificate_number, d.lab, d.stone_type, d.purchase_from, d.lot_number, d.color_category, d.size_category, d.grade, d.supplier_name]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
        || String(d.id).includes(q)
        || String(d.weight || d.carats || "").includes(q)
      );
    }
    if (sort.key) {
      const allCols = isLoose ? [...MIX_FZ, ...MIX_SCROLL_COLS] : [...FZ, ...SCROLL_COLS];
      const col = allCols.find((c) => c.key === sort.key);
      data.sort((a, b) => {
        let va = a[sort.key], vb = b[sort.key];
        if (col?.num) { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
        else { va = String(va || "").toLowerCase(); vb = String(vb || "").toLowerCase(); }
        if (va < vb) return sort.dir === "asc" ? -1 : 1;
        if (va > vb) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [diamonds, query, sort, isLoose]);

  const matrixData = useMemo(() => {
    if (!isLoose || rows.length === 0) return null;
    return calculateMatrixData(rows);
  }, [rows, isLoose]);

  const stats = useMemo(() => {
    if (isLoose) {
      return {
        total: diamonds.length,
        available: diamonds.length,
        value: diamonds.reduce((s, d) => s + (parseFloat(d.total_value) || 0), 0),
        carats: diamonds.reduce((s, d) => s + (parseFloat(d.carats) || 0), 0),
      };
    }
    const avail = diamonds.filter((d) => d.availability === "available");
    return {
      total: diamonds.length,
      available: avail.length,
      value: avail.reduce((s, d) => s + (parseFloat(d.amount_usd) || 0), 0),
      carats: avail.reduce((s, d) => s + (parseFloat(d.weight) || 0), 0),
    };
  }, [diamonds, isLoose]);

  /* Render cell */
  const renderCell = (d, key) => {
    const v = d[key];
    switch (key) {
      case "availability": return <AvBadge status={v} />;
      case "amount_usd":
      case "total_value":
        return v ? fmt(v) : "—";
      case "rap_rate":
      case "price_per_carat_usd":
      case "base_price":
      case "final_price_per_carat":
        return v ? `₹${parseFloat(v).toLocaleString()}` : "—";
      case "rap_discount":
      case "discount_pct":
      case "table_percentage":
      case "depth_percentage":
        return val(v, "%");
      case "purchase_date":
        return v ? new Date(v).toLocaleDateString() : "—";
      case "measurement":
        return <span className="cell-clamp" title={v || ""}>{v || "—"}</span>;
      default:
        return v != null && v !== "" ? cap(String(v)) : "—";
    }
  };

  /* Sort TH */
  const SortTH = ({ colKey, children, style, className }) => (
    <th style={style} className={className || ""} onClick={() => handleSort(colKey)}>
      <span style={{ display: "inline-flex", alignItems: "center" }}>
        {children}
        {colKey && (
          <i className={`bi ${sort.key === colKey ? (sort.dir === "asc" ? "bi-chevron-up" : "bi-chevron-down") : "bi-chevron-expand"} sort-icon ${sort.key === colKey ? "active" : ""}`} />
        )}
      </span>
    </th>
  );

  /* Action column width */
  const ACT_W = 230;
  const allRowsSelected = rows.length > 0 && selected.size === rows.length;
  const someRowsSelected = selected.size > 0 && !allRowsSelected;

  return (
    <div className="di-page" suppressHydrationWarning>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" />

      <div className="container-fluid" style={{ maxWidth: 1440, padding: "24px 20px" }} suppressHydrationWarning>
        {/* Header */}
        <div className="fi" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.text, letterSpacing: "-.03em", margin: 0 }}>
              Diamonds
            </h1>
            <p style={{ fontSize: ".82rem", color: C.sub, margin: "2px 0 0" }}>
              Manage your diamond inventory
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
{hasMounted && isLoose && (
  <Link
    href="/loose-diamonds"
    style={{
      background: "#fff",
      color: C.text, // ✅ black text
      padding: "10px 20px",
      borderRadius: 12,
      fontSize: ".82rem",
      fontWeight: 600,
      border: `0.5px solid ${C.border}`,
      display: "flex",
      alignItems: "center",
      gap: 6,
      cursor: "pointer",
      transition: "all .2s",
      textDecoration: "none",
      whiteSpace: "nowrap"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = C.light; // ✅ same hover as others
      e.currentTarget.style.borderColor = C.border;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#fff";
      e.currentTarget.style.borderColor = C.border;
    }}
  >
    <i className="bi bi-layers" style={{ fontSize: ".82rem", color: C.text }} />
    Loose Diamond Management
  </Link>
)}
{hasMounted && isLoose && (
  <div style={{
    display: "flex", border: `0.5px solid ${C.border}`, borderRadius: 12,
    overflow: "hidden", background: "#fff"
  }}>
    <button
      suppressHydrationWarning
      onClick={() => setViewMode("matrix")}
      style={{
        padding: "10px 16px", fontSize: ".8rem", fontWeight: 600, border: "none",
        cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
        background: viewMode === "matrix" ? C.text : "transparent",
        color: viewMode === "matrix" ? "#fff" : C.sub,
      }}
    >
      <i className="bi bi-grid-3x3-gap" style={{ fontSize: ".82rem" }} />
      Matrix
    </button>
    <button
      suppressHydrationWarning
      onClick={() => setViewMode("table")}
      style={{
        padding: "10px 16px", fontSize: ".8rem", fontWeight: 600, border: "none",
        cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
        background: viewMode === "table" ? C.text : "transparent",
        color: viewMode === "table" ? "#fff" : C.sub,
        borderLeft: `0.5px solid ${C.border}`
      }}
    >
      <i className="bi bi-table" style={{ fontSize: ".82rem" }} />
      Table
    </button>
  </div>
)}
            <button
               onClick={handleExport}
               suppressHydrationWarning
               style={{
                 background: "#fff", color: C.text, padding: "10px 20px", borderRadius: 12,
                 fontSize: ".82rem", fontWeight: 600, border: `0.5px solid ${C.border}`,
                 display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                 transition: "all .2s"
               }}
               onMouseEnter={(e) => { e.currentTarget.style.background = C.light; e.currentTarget.style.borderColor = C.text; }}
               onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.border; }}
               title={selected.size > 0 ? `Export ${selected.size} selected` : "Export all visible"}
             >
               <i className="bi bi-file-earmark-spreadsheet" style={{ fontSize: ".82rem", color: C.text }} />
               Export{selected.size > 0 ? ` (${selected.size})` : ""}
             </button>
            <Link
              href={!hasMounted ? "/diamonds/create" : (isLoose ? "/loose-diamonds/create" : "/diamonds/create")}
              style={{
                background: C.text, color: "#fff", padding: "10px 20px", borderRadius: 12,
                fontSize: ".82rem", fontWeight: 600, textDecoration: "none", display: "flex",
                alignItems: "center", gap: 6, transition: "background .2s"
              }}
            >
              <i className="bi bi-plus-lg" style={{ fontSize: ".72rem" }} /> 
              Add {!hasMounted ? "Diamond" : (isLoose ? "Lot" : "Diamond")}
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="fi" style={{ animationDelay: ".05s", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <div className="search-wrap" style={{ flex: "1 1 220px", maxWidth: 320 }}>
            <i className="bi bi-search s-icon" />
            <input placeholder="Search inventory..." value={query} onChange={(e) => setQuery(e.target.value)} suppressHydrationWarning />
          </div>

          <button className={`adv-btn ${advFilterCount > 0 ? "has-filters" : ""}`} onClick={() => setShowModal(true)} suppressHydrationWarning>
            <i className="bi bi-sliders" style={{ fontSize: ".82rem" }} />
            Advanced
            {advFilterCount > 0 && (
              <span style={{
                width: 18, height: 18, borderRadius: "50%", background: C.blue, color: "#fff",
                fontSize: ".6rem", fontWeight: 700, display: "inline-flex", alignItems: "center",
                justifyContent: "center"
              }}>
                {advFilterCount}
              </span>
            )}
          </button>

          <div style={{ width: 1, height: 28, background: C.border, flexShrink: 0 }} />

          <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {AVAIL_OPTIONS.map((a) => (
              <button key={a.id} className={`av-pill ${availability === a.id ? "active" : ""}`}
                suppressHydrationWarning
                onClick={() => changeAvail(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active chips */}
        {chips.length > 0 && (
          <div className="fi" style={{ animationDelay: ".1s", display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {chips.map((ch) => (
              <span key={ch.key} className="chip">
                {ch.label}
                <button onClick={() => removeChip(ch.key)} suppressHydrationWarning><i className="bi bi-x" style={{ fontSize: ".7rem" }} /></button>
              </span>
            ))}
            <button
              style={{
                background: "none", border: "none", cursor: "pointer", fontSize: ".7rem",
                fontWeight: 600, color: C.red, padding: "4px 8px"
              }}
              onClick={() => {
                setFilters({ ...INITIAL_FILTERS });
                setActiveFilters({ ...INITIAL_FILTERS });
              }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Matrix View (Only for Mix Items) */}
        {/* Main Content Area: Matrix or List */}
        {(() => {
          if (!hasMounted) return <div style={{ padding: "40px", textAlign: "center", color: C.sub }}>Loading view...</div>;
          
 if (isLoose) {
  if (!matrixData) {
    return (
      <div className="tbl-card fi" style={{ animationDelay: ".1s", padding: "40px", textAlign: "center", color: C.sub }}>
        No items matching these filters to display.
      </div>
    );
  }

  // ✅ MATRIX VIEW (DEFAULT)
if (viewMode === "matrix") {
  return (
    <div className="fi" style={{ animationDelay: ".1s" }}>
      
      {/* ✅ PASTE YOUR ORIGINAL MATRIX TABLE HERE (FULL WIDTH) */
      }
      <div style={{ width: "100%", background: "#fff", borderRadius: 14, padding: "20px", border: "0.5px solid rgba(0,0,0,.05)", boxShadow: "0 1px 3px rgba(0,0,0,.02)" }}>
  
  {/* Header */}
  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center", flexWrap: "wrap", gap: 12 }}>
    
    <div>
      <h3 style={{ margin: 0, fontSize: "1rem", color: C.text, fontWeight: 800, letterSpacing: "-0.01em" }}>
        Inventory Matrix
      </h3>
      <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: C.sub }}>
        Weight by Size & Color
      </p>
    </div>

    {/* Hover Dashboard */}
    <div style={{
      background: "#f9f9f9",
      borderRadius: 10,
      padding: "6px 14px",
      display: "flex",
      gap: 20,
      alignItems: "center",
      minWidth: 240,
      minHeight: 48,
      border: `1px solid ${C.light}`,
      transition: "all 0.25s ease",
      opacity: hoveredCell && matrixData.grid[hoveredCell.c]?.[hoveredCell.s]?.carats > 0 ? 1 : 0.6,
    }}>
      {hoveredCell && matrixData.grid[hoveredCell.c]?.[hoveredCell.s]?.carats > 0 ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i className="bi bi-gem" style={{ color: C.blue, fontSize: "0.9rem" }} />
            <div style={{ fontSize: "0.85rem", color: C.text, fontWeight: 800 }}>
              {hoveredCell.s} | {hoveredCell.c}
            </div>
          </div>

          <div style={{ width: 1, height: 16, background: C.border }} />

          <div>
            <span style={{ fontSize: "0.62rem", color: C.sub, textTransform: "uppercase", fontWeight: 700, marginRight: 6 }}>
              Rate
            </span>
            <span style={{ fontSize: "0.85rem", color: C.green, fontWeight: 800 }}>
              {fmt(matrixData.grid[hoveredCell.c][hoveredCell.s].totalPrice / matrixData.grid[hoveredCell.c][hoveredCell.s].carats)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.62rem", color: C.sub, textTransform: "uppercase", fontWeight: 700, marginRight: 6 }}>
              On Memo
            </span>
            <span style={{ fontSize: "0.85rem", color: C.orange, fontWeight: 800 }}>
              {matrixData.grid[hoveredCell.c][hoveredCell.s].memoCarats.toFixed(3)}
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: C.border }} />

          <div>
            <span style={{ fontSize: "0.85rem", color: C.text, fontWeight: 800 }}>
              {matrixData.grid[hoveredCell.c][hoveredCell.s].count}
              <span style={{ fontSize: "0.65rem", color: C.sub, fontWeight: 600 }}> lots</span>
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: "0.75rem", color: C.sub, width: "100%", textAlign: "center", fontWeight: 500 }}>
          Hover cells for insights
        </div>
      )}
    </div>
  </div>

  {/* Matrix Table */}
  <div style={{ overflowX: "auto" }}>
    <table className="matrix-table">
      <thead>
        <tr>
          <th className="row-header" style={{ zIndex: 10 }}>Color \ Size</th>
          {matrixData.sizes.map(s => (
            <th key={s} className="col-header">{s}</th>
          ))}
          <th className="col-header matrix-row-total">Total</th>
        </tr>
      </thead>

      <tbody>
        {matrixData.colors.map(c => (
          <tr key={c}>
            <th className="row-header">{c}</th>

            {matrixData.sizes.map(s => {
              const cellVal = matrixData.grid[c][s].carats;

              return (
                <td
                  key={s}
                  className={cellVal === 0 ? "matrix-zero" : ""}
                  onMouseEnter={() => setHoveredCell({ c, s })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() =>
                    cellVal > 0 &&
                    router.push(`/diamonds/matrix/analysis?color=${encodeURIComponent(c)}&size=${encodeURIComponent(s)}`)
                  }
                >
                  {cellVal > 0 ? cellVal.toFixed(3) : "-"}
                </td>
              );
            })}

            <td className="matrix-row-total">
              {matrixData.rowTotals[c] > 0 ? matrixData.rowTotals[c].toFixed(3) : "-"}
            </td>
          </tr>
        ))}
      </tbody>

      <tfoot>
        <tr>
          <th className="row-header">Total</th>

          {matrixData.sizes.map(s => (
            <td key={s} className="matrix-row-total">
              {matrixData.colTotals[s] > 0 ? matrixData.colTotals[s].toFixed(3) : "-"}
            </td>
          ))}

          <td className="matrix-grand-total">
            {matrixData.grandTotal > 0 ? matrixData.grandTotal.toFixed(3) : "-"}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>

</div>
      

    </div>
  );
}

  // ✅ TABLE VIEW (FULL WIDTH WHEN CLICKED)
  if (viewMode === "table") {
    return (
      <div className="tbl-card fi" style={{ animationDelay: ".1s" }}>
        
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `0.5px solid ${C.light}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1rem", color: C.text, fontWeight: 800 }}>Lot List</h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: C.sub }}>
              {rows.length} lot{rows.length !== 1 ? "s" : ""} · {rows.reduce((s, d) => s + (parseFloat(d.carats) || 0), 0).toFixed(3)} ct total
            </p>
          </div>
        </div>

        {/* FULL WIDTH TABLE */}
        <div style={{ overflow: "auto", maxHeight: "70vh" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ background: "#fafafa" }}>
                {["#", "Lot #", "Color", "Size", "Grade", "Carats", "On Memo", "Available", "₹/ct", "Total Value", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px",
                    textAlign: (h === "#" || h === "Carats" || h === "On Memo" || h === "Available") ? "center" : "left",
                    fontSize: "0.65rem",
                    color: C.sub,
                    textTransform: "uppercase",
                    borderBottom: `1px solid ${C.light}`
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((d, idx) => (
                <tr key={d.id} style={{ borderBottom: `0.5px solid ${C.light}` }}>
                  <td style={{ padding: "10px", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ padding: "10px", fontWeight: 700 }}>LOT-{d.lot_number}</td>
                  <td style={{ padding: "10px" }}>{d.color_category}</td>
                  <td style={{ padding: "10px" }}>{d.size_category}</td>
                  <td style={{ padding: "10px" }}>{d.grade}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>{parseFloat(d.carats).toFixed(3)}</td>
                  <td style={{ padding: "10px", textAlign: "center", color: C.orange, fontWeight: 600 }}>
                    {parseFloat(d.total_on_memo_carats || 0).toFixed(3)}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center", color: C.green, fontWeight: 600 }}>
                    {(parseFloat(d.carats) - parseFloat(d.total_on_memo_carats || 0)).toFixed(3)}
                  </td>
                  <td style={{ padding: "10px" }}>
                    {d.final_price_per_carat ? `₹${parseFloat(d.final_price_per_carat).toLocaleString()}` : "—"}
                  </td>
                  <td style={{ padding: "10px", fontWeight: 800 }}>{fmt(d.total_value)}</td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/loose-diamonds/${d.loose_diamond_id}`} className="act-btn view">
                        <i className="bi bi-eye" />
                      </Link>
                      <Link href={`/loose-diamonds/edit/${d.loose_diamond_id}`} className="act-btn edit">
                        <i className="bi bi-pencil" />
                      </Link>
                      <button className="act-btn del" onClick={() => handleDelete(d.id)}>
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    );
  }
}
          /* Default List Table View */
          return (
            <div className="tbl-card fi" style={{ animationDelay: ".1s" }}>
              <div className="tbl-header">
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: ".82rem", fontWeight: 600, color: C.text }}>
                    {loading ? "Loading…" : `${rows.length} Diamond${rows.length !== 1 ? "s" : ""}`}
                  </span>
                  {!loading && (
                    <span style={{ fontSize: ".72rem", color: C.sub }}>
                      {stats.available + " available"} · {stats.carats.toFixed(2)} ct · {fmt(stats.value)}
                    </span>
                  )}
                </div>
              </div>

              <div className="tbl-wrap">
                <table className="di-tbl">
                  <thead>
                    <tr>
                      <th className="fz" style={{ left: 0, width: 44, minWidth: 44, maxWidth: 44, textAlign: "center", zIndex: 5, background: "#fafafa" }}>
                        <input
                          type="checkbox"
                          className="di-checkbox"
                          checked={allRowsSelected}
                          suppressHydrationWarning
                          ref={(el) => { if (el) el.indeterminate = someRowsSelected; }}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      {isLoose ? (
                        <>
                          {MIX_FZ.map((col, i) => (
                            <SortTH
                              key={col.key}
                              colKey={col.key === "_idx" ? null : col.key}
                              className={`fz ${i === MIX_FZ.length - 1 ? "fz-last" : ""}`}
                              style={{ left: mixFzLeft[i] + 44, width: col.w, minWidth: col.w, maxWidth: col.w }}
                            >
                              {col.label}
                            </SortTH>
                          ))}
                          {MIX_SCROLL_COLS.map((col) => (
                            <SortTH key={col.key} colKey={col.key} style={{ minWidth: col.w, width: col.w }}>
                              {col.label}
                            </SortTH>
                          ))}
                        </>
                      ) : (
                        <>
                          {FZ.map((col, i) => (
                            <SortTH
                              key={col.key}
                              colKey={col.key === "_idx" ? null : col.key}
                              className={`fz ${i === FZ.length - 1 ? "fz-last" : ""}`}
                              style={{ left: fzLeft[i] + 44, width: col.w, minWidth: col.w, maxWidth: col.w }}
                            >
                              {col.label}
                            </SortTH>
                          ))}
                          {SCROLL_COLS.map((col) => (
                            <SortTH key={col.key} colKey={col.key} style={{ minWidth: col.w, width: col.w }}>
                              {col.label}
                            </SortTH>
                          ))}
                        </>
                      )}
                      <th className="fz-r" style={{ width: ACT_W, minWidth: ACT_W, textAlign: "center" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>
                          <td className="fz" style={{ left: 0, width: 44, minWidth: 44, maxWidth: 44, textAlign: "center" }}>
                            <Skel w={16} h={16} />
                          </td>
                          {(isLoose ? MIX_FZ : FZ).map((col, j) => (
                            <td key={j} className={`fz ${j === (isLoose ? MIX_FZ : FZ).length - 1 ? "fz-last" : ""}`}
                              style={{ left: (isLoose ? mixFzLeft[j] : fzLeft[j]) + 44, width: col.w, minWidth: col.w, maxWidth: col.w }}>
                              <Skel w={col.w - 28} h={14} />
                            </td>
                          ))}
                          {(isLoose ? MIX_SCROLL_COLS : SCROLL_COLS).map((col) => (
                            <td key={col.key} style={{ minWidth: col.w, width: col.w }}>
                              <Skel w={col.w - 32} h={14} />
                            </td>
                          ))}
                          <td className="fz-r" style={{ width: ACT_W, minWidth: ACT_W, textAlign: "center" }}>
                            <Skel w={140} h={14} />
                          </td>
                        </tr>
                      ))
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={isLoose ? (MIX_FZ.length + MIX_SCROLL_COLS.length + 2) : (FZ.length + SCROLL_COLS.length + 2)} style={{ border: "none" }}>
                          <div className="empty-state">
                            <i className="bi bi-gem" style={{ fontSize: "2.5rem", color: C.border, display: "block", marginBottom: 12 }} />
                            <div style={{ fontSize: ".95rem", fontWeight: 600, color: C.text, marginBottom: 4 }}>No diamonds found</div>
                            <div style={{ fontSize: ".8rem", color: C.sub, marginBottom: 16 }}>
                              {query || advFilterCount > 0 ? "Try adjusting your filters" : "Add your first diamond to get started"}
                            </div>
                            {query || advFilterCount > 0 ? (
                              <button className="m-btn ghost" onClick={() => { setQuery(""); setFilters({ ...INITIAL_FILTERS }); setActiveFilters({ ...INITIAL_FILTERS }); changeAvail(""); }}>
                                Clear Filters
                              </button>
                            ) : (
                              <Link href={isLoose ? "/loose-diamonds/create" : "/diamonds/create"} className="m-btn primary" style={{ textDecoration: "none", display: "inline-block" }}>
                                Add {isLoose ? "Lot" : "Diamond"}
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((d, idx) => (
                        <tr key={d.id} style={selected.has(d.id) ? { background: "rgba(0,113,227,.04)" } : {}}>
                          {/* Checkbox */}
                          <td className="fz" style={{ left: 0, width: 44, minWidth: 44, maxWidth: 44, textAlign: "center", background: selected.has(d.id) ? "rgba(0,113,227,.04)" : undefined }}>
                            <input
                              type="checkbox"
                              className="di-checkbox"
                              checked={selected.has(d.id)}
                              suppressHydrationWarning
                              onChange={() => toggleSelect(d.id)}
                            />
                          </td>
                          {/* Frozen Left Columns */}
                          {isLoose ? (
                            <>
                              {/* Frozen: # */}
                              <td className="fz" style={{ left: mixFzLeft[0] + 44, width: MIX_FZ[0].w, minWidth: MIX_FZ[0].w, maxWidth: MIX_FZ[0].w, color: C.sub, fontWeight: 500 }}>
                                {idx + 1}
                              </td>
                              {/* Frozen: Lot # */}
                              <td className="fz" style={{ left: mixFzLeft[1] + 44, width: MIX_FZ[1].w, minWidth: MIX_FZ[1].w, maxWidth: MIX_FZ[1].w }}>
                                <span style={{ fontWeight: 600, color: C.text }}>LOT-{d.lot_number}</span>
                              </td>
                              {/* Frozen: Color */}
                              <td className="fz" style={{ left: mixFzLeft[2] + 44, width: MIX_FZ[2].w, minWidth: MIX_FZ[2].w, maxWidth: MIX_FZ[2].w, fontWeight: 600, color: C.text }}>
                                {d.color_category}
                              </td>
                              {/* Frozen: Size */}
                              <td className="fz" style={{ left: mixFzLeft[3] + 44, width: MIX_FZ[3].w, minWidth: MIX_FZ[3].w, maxWidth: MIX_FZ[3].w, fontWeight: 600, color: C.text }}>
                                {d.size_category}
                              </td>
                              {/* Frozen: Grade */}
                              <td className="fz fz-last" style={{ left: mixFzLeft[4] + 44, width: MIX_FZ[4].w, minWidth: MIX_FZ[4].w, maxWidth: MIX_FZ[4].w, fontWeight: 600, color: C.text }}>
                                <div className="cell-clamp" title={d.grade}>{d.grade}</div>
                              </td>
                            </>
                          ) : (
                            <>
                              {/* Frozen: # */}
                              <td className="fz" style={{ left: fzLeft[0] + 44, width: FZ[0].w, minWidth: FZ[0].w, maxWidth: FZ[0].w, color: C.sub, fontWeight: 500 }}>
                                {idx + 1}
                              </td>
                              {/* Frozen: Shape */}
                              <td className="fz" style={{ left: fzLeft[1] + 44, width: FZ[1].w, minWidth: FZ[1].w, maxWidth: FZ[1].w }}>
                                <span style={{ fontWeight: 600, color: C.text }}>{cap(d.shape)}</span>
                              </td>
                              {/* Frozen: Weight */}
                              <td className="fz" style={{ left: fzLeft[2] + 44, width: FZ[2].w, minWidth: FZ[2].w, maxWidth: FZ[2].w, fontWeight: 600, color: C.text }}>
                                {parseFloat(d.weight).toFixed(2)}
                              </td>
                              {/* Frozen: Color */}
                              <td className="fz" style={{ left: fzLeft[3] + 44, width: FZ[3].w, minWidth: FZ[3].w, maxWidth: FZ[3].w, fontWeight: 600, color: C.text }}>
                                {d.color?.toUpperCase() || "—"}
                              </td>
                              {/* Frozen: Clarity (last) */}
                              <td className="fz fz-last" style={{ left: fzLeft[4] + 44, width: FZ[4].w, minWidth: FZ[4].w, maxWidth: FZ[4].w, fontWeight: 600, color: C.text }}>
                                {d.clarity?.toUpperCase() || "—"}
                              </td>
                            </>
                          )}

                          {/* Scrollable */}
                          {(isLoose ? MIX_SCROLL_COLS : SCROLL_COLS).map((col) => (
                            <td key={col.key} style={{ minWidth: col.w, width: col.w }}>
                              {renderCell(d, col.key)}
                            </td>
                          ))}

                          {/* Actions (frozen right) */}
                          <td className="fz-r" style={{ width: ACT_W, minWidth: ACT_W, maxWidth: ACT_W }}>
                            <div style={{ display: "flex", gap: 6, justifyContent: "center", width: "100%" }}>
<Link href={`/loose-diamonds/${d.loose_diamond_id}`} className="act-btn view" title="View">
  <i className="bi bi-eye" />
</Link>
<Link href={`/loose-diamonds/edit/${d.loose_diamond_id}`} className="act-btn edit" title="Edit">
  <i className="bi bi-pencil" />
</Link>

                              {((!isLoose ? d.availability === "available" : true)) && (
                                <Link 
                                  href={`/sales/create?diamond_id=${d.id}`}
                                  className="act-btn sell act-tooltip" 
                                  data-tip="Create Sale" 
                                  title="Sell"
                                >
                                  <i className="bi bi-cart-plus" />
                                </Link>
                              )}

                              {((!isLoose ? d.availability === "available" : true)) && (
                                <Link 
                                  href={isLoose ? "#" : `/diamonds/${d.id}/memo`} 
                                  className="act-btn memo act-tooltip" 
                                  data-tip="Send on Memo" 
                                  title="Memo"
                                >
                                  <i className="bi bi-send" />
                                </Link>
                              )}

            <button suppressHydrationWarning className="act-btn del" title="Delete" onClick={() => handleDelete(d.id)}>
  <i className="bi bi-trash3" />
</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && rows.length > 0 && (
                <div style={{
                  padding: "12px 20px", borderTop: `0.5px solid ${C.light}`, display: "flex",
                  justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
                }}>
                  <span style={{ fontSize: ".72rem", color: C.sub }}>
                    Showing {rows.length} of {diamonds.length} diamonds
                  </span>
                  <span style={{ fontSize: ".68rem", color: C.sub }}>
                    <i className="bi bi-arrow-left-right" style={{ marginRight: 4 }} />
                    Scroll horizontally for more columns
                  </span>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <SearchModal
        show={showModal}
        onClose={() => {
          setFilters(activeFilters); // revert modal state if closed without applying
          setShowModal(false);
        }}
        filters={filters}
        setFilters={setFilters}
        onApply={() => {
          setActiveFilters(filters);
          setShowModal(false);
        }}
        isLoose={isLoose}
      />
    </div>
  );
}

export default function DiamondsIndexPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <DiamondsIndexPageContent />
    </Suspense>
  );
}
