// app/diamonds/DiamondsForm.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/* ------------------------------ Standards ------------------------------ */
const GIA_STANDARDS = {
  LABS: { GIA: "GIA", IGI: "IGI", HRD: "HRD", AGS: "AGS", GCAL: "GCAL", EGL: "EGL", OTHER: "Other" },
  SHAPES: {
    round: "Round",
    princess: "Princess",
    cushion: "Cushion",
    oval: "Oval",
    emerald: "Emerald",
    pear: "Pear",
    marquise: "Marquise",
    radiant: "Radiant",
    asscher: "Asscher",
    heart: "Heart",
  },
  COLORS: { D: "D", E: "E", F: "F", G: "G", H: "H", I: "I", J: "J", K: "K", L: "L", M: "M" },
  CLARITY: { FL: "FL", IF: "IF", VVS1: "VVS1", VVS2: "VVS2", VS1: "VS1", VS2: "VS2", SI1: "SI1", SI2: "SI2", I1: "I1", I2: "I2", I3: "I3" },
  CUT: { ideal: "Ideal", excellent: "Excellent", very_good: "Very Good", good: "Good", fair: "Fair", poor: "Poor" },
  POLISH: { excellent: "Excellent", very_good: "Very Good", good: "Good", fair: "Fair", poor: "Poor" },
  SYMMETRY: { excellent: "Excellent", very_good: "Very Good", good: "Good", fair: "Fair", poor: "Poor" },
  FLUORESCENCE: { none: "None", faint: "Faint", medium: "Medium", strong: "Strong", very_strong: "Very Strong" },
  FLUORESCENCE_COLORS: { blue: "Blue", yellow: "Yellow", green: "Green", white: "White", orange: "Orange" },
  EYE_CLEAN: { yes: "Yes", no: "No" },
  GIRDLE: {
    extremely_thin: "Extremely Thin",
    very_thin: "Very Thin",
    thin: "Thin",
    medium: "Medium",
    slightly_thick: "Slightly Thick",
    thick: "Thick",
    very_thick: "Very Thick",
    extremely_thick: "Extremely Thick",
  },
  CULET: { none: "None", very_small: "Very Small", small: "Small", medium: "Medium", slightly_large: "Slightly Large", large: "Large", very_large: "Very Large" },
  AVAILABILITY: { available: "Available", memo: "Out on Memo", sold: "Sold", subject_to_sale: "Subject to Prior Sale", at_lab: "At Lab" },
};

/* ------------------------------ Helpers ------------------------------ */
const toNum = (v) => {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim();
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

const toNumOrNull = (v) => {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const fixed2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

/* ------------------------------ Section Component ------------------------------ */
function Section({ title, icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16, overflow: "hidden" }}>
      <button
        type="button"
        className="btn w-100 text-start px-4 py-3 bg-white"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            <span
              className="d-inline-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(102,126,234,0.10)", color: "#667eea" }}
            >
              <i className={`bi ${icon}`} style={{ fontSize: "1.1rem" }} />
            </span>
            <div>
              <div className="fw-bold">{title}</div>
              <div className="text-muted small">Click to {open ? "collapse" : "expand"}</div>
            </div>
          </div>
          <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"} text-muted`} />
        </div>
      </button>
      {open && <div className="card-body p-4">{children}</div>}
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label className="form-label fw-medium">
      {children} {required ? <span className="text-danger">*</span> : null}
    </label>
  );
}

/* ------------------------------ Main Component ------------------------------ */
export default function DiamondsForm({ initial = {}, clients: initialClients = [], brokers: initialBrokers = [], onSuccess = () => { } }) {
  const router = useRouter();

  const [form, setForm] = useState({
    // Basic
    stone_type: initial.stone_type || "",
    lab: initial.lab || "",
    diamond_id: initial.diamond_id || (initial.id ? "" : `DT${new Date().getFullYear().toString().slice(-2)}`),
    certificate_number: initial.certificate_number || "",
    shape: initial.shape || "",
    weight: initial.weight ?? "",
    color: initial.color || "",
    clarity: initial.clarity || "",
    cut: initial.cut || "",
    pol: initial.pol || "",
    sym: initial.sym || "",
    flor: initial.flor || "",
    eye_clean: initial.eye_clean || "",
    no_bgm: initial.no_bgm || "",

    // Report & Reference
    job_no: initial.job_no || "",
    control_no: initial.control_no || "",
    diamond_dossier: initial.diamond_dossier || "",
    report_no: initial.report_no || "",
    report_dt: initial.report_dt || "",
    client_ref: initial.client_ref || "",
    memo_no: initial.memo_no || "",

    // Quality
    color_descriptions: initial.color_descriptions || "",
    clarity_status: initial.clarity_status || "",
    final_cut: initial.final_cut || "",
    fluorescence_intensity: initial.fluorescence_intensity || "",
    fluorescence_color: initial.fluorescence_color || "",

    // Origin
    country_of_origin: initial.country_of_origin || "",
    rough_report_number: initial.rough_report_number || "",
    diamond_type: initial.diamond_type || "",
    disclosed_source: initial.disclosed_source || "",
    kimberley_process_number: initial.kimberley_process_number || "",
    rough_invoice_number: initial.rough_invoice_number || "",

    // Price inputs
    rap_rate: initial.rap_rate ?? "",
    rap_discount: initial.rap_discount ?? "",
    price_per_carat_usd: initial.price_per_carat_usd ?? "",
    amount_usd: initial.amount_usd ?? "",
    conversion_rate: initial.conversion_rate ?? "",
    amount_inr: initial.amount_inr ?? "",
    purchase_from: initial.purchase_from || "",
    pur_rap_discount: initial.pur_rap_discount ?? "",
    purchase_price: initial.purchase_price ?? "",
    purchase_conversion_rate: initial.purchase_conversion_rate ?? "",
    purchase_price_inr: initial.purchase_price_inr ?? "",
    client_id: initial.client_id || "",
    broker_id: initial.broker_id || "",
    availability: initial.availability || "available",
    location: initial.location || "Surat",

    // Payment Information
    payment_status: initial.payment_status || "",
    buying_date: initial.buying_date ? initial.buying_date.split("T")[0] : "",
    terms_days: initial.terms_days || "",
    payment_amount_done: initial.payment_amount_done || "",

    // Dimensions & Measurements
    measurement: initial.measurement || "",
    length: initial.length ?? "",
    width: initial.width ?? "",
    depth: initial.depth ?? "",
    table_percentage: initial.table_percentage ?? "",
    depth_percentage: initial.depth_percentage ?? "",
    ratio: initial.ratio ?? "",
    crn_ag: initial.crn_ag ?? "",
    crn_ht: initial.crn_ht ?? "",
    pav_ag: initial.pav_ag ?? "",
    pav_dp: initial.pav_dp ?? "",
    str_ln: initial.str_ln ?? "",
    lr_half: initial.lr_half ?? "",
    girdle: initial.girdle || "",
    girdle_condition: initial.girdle_condition || "",
    girdle_pct: initial.girdle_pct || "",
    culet_size: initial.culet_size || "",

    // Features
    polish_features: initial.polish_features || "",
    symmetry_features: initial.symmetry_features || "",
    painting: initial.painting || "",
    proportion: initial.proportion || "",
    paint_comm: initial.paint_comm || "",
    key_to_symbols: initial.key_to_symbols || "",
    report_comments: initial.report_comments || "",

    // Technical
    inscription: initial.inscription || "",
    synthetic_indicator: initial.synthetic_indicator || "",
    agsi_aset: initial.agsi_aset || "",
    shape_description: initial.shape_description || "",
    report_type: initial.report_type || "",
    sorting: initial.sorting || "",
    basket_status: initial.basket_status || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Dropdown options
  const [clients, setClients] = useState(initialClients);
  const [brokers, setBrokers] = useState(initialBrokers);

  // Sync state with props
  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  useEffect(() => {
    setBrokers(initialBrokers);
  }, [initialBrokers]);

  // Price calculator
  const calculatePrices = useCallback((f) => {
    const rapRate = toNum(f.rap_rate);
    const rapDiscount = toNum(f.rap_discount);
    const weight = toNum(f.weight);
    const conversionRate = toNum(f.conversion_rate);
    const purRapDiscount = toNum(f.pur_rap_discount);
    const purchaseConversionRate = toNum(f.purchase_conversion_rate);

    const pricePerCarat = rapRate * (1 - rapDiscount / 100);
    const amountUsd = weight * pricePerCarat;
    const amountInr = conversionRate > 0 ? amountUsd * conversionRate : "";

    const purchasePrice = weight * rapRate * (1 - purRapDiscount / 100);
    const purchasePriceInr = purchaseConversionRate > 0 ? purchasePrice * purchaseConversionRate : "";

    return {
      price_per_carat_usd: fixed2(pricePerCarat),
      amount_usd: fixed2(amountUsd),
      amount_inr: amountInr === "" ? "" : fixed2(amountInr),
      purchase_price: fixed2(purchasePrice),
      purchase_price_inr: purchasePriceInr === "" ? "" : fixed2(purchasePriceInr),
    };
  }, []);

  // Initial calculation on mount
  useEffect(() => {
    setForm((prev) => ({ ...prev, ...calculatePrices(prev) }));
  }, [calculatePrices]);

  // Change handler with auto-recalculation
  const change = (e) => {
    const { name, value } = e.target;

    // Clear validation error for this field
    setValidationErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });

    // Update form and recalculate prices
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-set availability based on location
      if (name === "location") {
        if (["GIA Lab", "IGI Lab", "Other Labs"].includes(value)) {
          updated.availability = "at_lab";
        }
      }

      const calc = calculatePrices(updated);
      return { ...updated, ...calc };
    });
  };

  // Helper functions for validation styling
  const hasError = (field) => Boolean(validationErrors[field]);
  const inputClass = (field) => `form-control ${hasError(field) ? "is-invalid" : ""}`;
  const selectClass = (field) => `form-select ${hasError(field) ? "is-invalid" : ""}`;

  // Validate form before submit
  const validateForm = () => {
    const errors = {};

    if (!form.shape) errors.shape = "Shape is required";
    if (!form.color) errors.color = "Color is required";
    if (!form.clarity) errors.clarity = "Clarity is required";
    if (!form.cut) errors.cut = "Cut is required";

    const w = toNum(form.weight);
    if (!String(form.weight ?? "").trim() || w <= 0) {
      errors.weight = "Weight is required and must be > 0";
    }

    if (String(form.rap_rate ?? "").trim() === "") {
      errors.rap_rate = "Rap Rate is required";
    }
    if (String(form.rap_discount ?? "").trim() === "") {
      errors.rap_discount = "Rap Discount is required";
    }
    if (String(form.pur_rap_discount ?? "").trim() === "") {
      errors.pur_rap_discount = "Purchase Rap Discount is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);

    const calc = calculatePrices(form);
    const method = initial.id ? "PUT" : "POST";
    const url = initial.id ? `/api/diamonds/${initial.id}` : `/api/diamonds`;

    const payload = {
      // Basic
      stone_type: form.stone_type || null,
      lab: form.lab || null,
      certificate_number: form.certificate_number || null,
      shape: form.shape,
      weight: toNum(form.weight),
      color: form.color,
      clarity: form.clarity,
      cut: form.cut,
      pol: form.pol || null,
      sym: form.sym || null,
      flor: form.flor || null,
      eye_clean: form.eye_clean || null,
      no_bgm: form.no_bgm || null,

      // Report & Reference
      job_no: form.job_no || null,
      control_no: form.control_no || null,
      diamond_dossier: form.diamond_dossier || null,
      report_no: form.report_no || null,
      report_dt: form.report_dt || null,
      client_ref: form.client_ref || null,
      memo_no: form.memo_no || null,

      // Quality
      color_descriptions: form.color_descriptions || null,
      clarity_status: form.clarity_status || null,
      final_cut: form.final_cut || null,
      fluorescence_intensity: form.fluorescence_intensity || null,
      fluorescence_color: form.fluorescence_color || null,

      // Origin
      country_of_origin: form.country_of_origin || null,
      rough_report_number: form.rough_report_number || null,
      diamond_type: form.diamond_type || null,
      disclosed_source: form.disclosed_source || null,
      kimberley_process_number: form.kimberley_process_number || null,
      rough_invoice_number: form.rough_invoice_number || null,

      // Price (computed values)
      rap_rate: toNum(form.rap_rate),
      rap_discount: toNum(form.rap_discount),
      price_per_carat_usd: toNum(calc.price_per_carat_usd),
      amount_usd: toNum(calc.amount_usd),
      conversion_rate: toNumOrNull(form.conversion_rate),
      amount_inr: calc.amount_inr === "" ? null : toNum(calc.amount_inr),
      purchase_from: form.purchase_from || null,
      pur_rap_discount: toNum(form.pur_rap_discount),
      purchase_price: toNum(calc.purchase_price),
      purchase_conversion_rate: toNumOrNull(form.purchase_conversion_rate),
      purchase_price_inr: calc.purchase_price_inr === "" ? null : toNum(calc.purchase_price_inr),
      client_id: form.client_id ? parseInt(form.client_id) : null,
      broker_id: form.broker_id ? parseInt(form.broker_id) : null,
      availability: form.availability || "available",

      // Payment Information
      payment_status: form.payment_status || null,
      buying_date: form.buying_date || null,
      terms_days: form.payment_status === "On Terms" ? parseInt(form.terms_days) || 0 : null,
      payment_amount_done: form.payment_status === "On Terms" ? parseFloat(form.payment_amount_done) || 0 : null,

      // Dimensions
      measurement: form.measurement || null,
      length: toNumOrNull(form.length),
      width: toNumOrNull(form.width),
      depth: toNumOrNull(form.depth),
      table_percentage: toNumOrNull(form.table_percentage),
      depth_percentage: toNumOrNull(form.depth_percentage),
      ratio: toNumOrNull(form.ratio),
      crn_ag: toNumOrNull(form.crn_ag),
      crn_ht: toNumOrNull(form.crn_ht),
      pav_ag: toNumOrNull(form.pav_ag),
      pav_dp: toNumOrNull(form.pav_dp),
      str_ln: toNumOrNull(form.str_ln),
      lr_half: toNumOrNull(form.lr_half),
      girdle: form.girdle || null,
      girdle_condition: form.girdle_condition || null,
      girdle_pct: form.girdle_pct || null,
      culet_size: form.culet_size || null,

      // Features
      polish_features: form.polish_features || null,
      symmetry_features: form.symmetry_features || null,
      painting: form.painting || null,
      proportion: form.proportion || null,
      paint_comm: form.paint_comm || null,
      key_to_symbols: form.key_to_symbols || null,
      report_comments: form.report_comments || null,

      // Technical
      inscription: form.inscription || null,
      synthetic_indicator: form.synthetic_indicator || null,
      agsi_aset: form.agsi_aset || null,
      shape_description: form.shape_description || null,
      report_type: form.report_type || null,
      sorting: form.sorting || null,
      basket_status: form.basket_status || null,
      location: form.location || "Surat",
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      const saved = await res.json();
      onSuccess(saved);
      router.push("/diamonds");
    } catch (err) {
      setError(err?.message || "Failed to save diamond");
    } finally {
      setSaving(false);
    }
  };

  // Summary for display
  const summary = useMemo(() => {
    return {
      ppc: form.price_per_carat_usd,
      usd: form.amount_usd,
      inr: form.amount_inr || "-",
      pUsd: form.purchase_price,
      pInr: form.purchase_price_inr || "-",
    };
  }, [form.price_per_carat_usd, form.amount_usd, form.amount_inr, form.purchase_price, form.purchase_price_inr]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Top Summary */}
      <div
        className="p-3 mb-4"
        style={{
          borderRadius: 14,
          border: "1px solid rgba(102,126,234,0.14)",
          background: "linear-gradient(135deg, rgba(102,126,234,0.06) 0%, rgba(118,75,162,0.05) 50%, rgba(14,165,233,0.05) 100%)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex flex-wrap gap-2">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ borderRadius: 999 }}>
              <i className="bi bi-currency-dollar me-2" />
              $/ct: <span className="fw-semibold ms-1">{summary.ppc}</span>
            </span>
            <span className="badge bg-info bg-opacity-10 text-info px-3 py-2" style={{ borderRadius: 999 }}>
              <i className="bi bi-cash-stack me-2" />
              USD: <span className="fw-semibold ms-1">{summary.usd}</span>
            </span>
            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2" style={{ borderRadius: 999 }}>
              <i className="bi bi-currency-rupee me-2" />
              INR: <span className="fw-semibold ms-1">{summary.inr}</span>
            </span>
            <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2" style={{ borderRadius: 999 }}>
              <i className="bi bi-bag-check me-2" />
              Purchase USD: <span className="fw-semibold ms-1">{summary.pUsd}</span>
            </span>
          </div>
          <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2" style={{ borderRadius: 999 }}>
            <i className="bi bi-check-circle me-2" />
            {GIA_STANDARDS.AVAILABILITY[form.availability] || form.availability}
          </span>
        </div>
        <div className="text-muted small mt-2">
          Totals are calculated from <span className="fw-semibold">Weight</span>, <span className="fw-semibold">Rap Rate</span> and discounts.
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start" style={{ borderRadius: 14 }}>
          <i className="bi bi-exclamation-triangle me-2 mt-1" />
          <div className="flex-grow-1">
            <div className="fw-semibold">{error}</div>
            {Object.keys(validationErrors).length > 0 && (
              <ul className="mb-0 mt-2 small">
                {Object.entries(validationErrors).map(([k, v]) => (
                  <li key={k}>{v}</li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" className="btn-close ms-2" onClick={() => setError("")} />
        </div>
      )}

      {/* Basic Information */}
      <Section title="Basic Information" icon="bi-gem" defaultOpen>
        <div className="row g-3">
          <div className="col-md-4">
            <Label>Stone Type</Label>
            <input name="stone_type" value={form.stone_type} onChange={change} className="form-control" />
          </div>

          <div className="col-md-4">
            <Label>Lab</Label>
            <select name="lab" value={form.lab} onChange={change} className="form-select">
              <option value="">Select Lab</option>
              {Object.entries(GIA_STANDARDS.LABS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <Label>Diamond ID</Label>
            <input name="diamond_id" value={form.diamond_id} onChange={change} className="form-control" placeholder="e.g., DT24" />
          </div>

          <div className="col-md-4">
            <Label>Certificate Number</Label>
            <input name="certificate_number" value={form.certificate_number} onChange={change} className="form-control" />
          </div>

          <div className="col-md-3">
            <Label required>Shape</Label>
            <select name="shape" value={form.shape} onChange={change} className={selectClass("shape")}>
              <option value="">Select Shape</option>
              {Object.entries(GIA_STANDARDS.SHAPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError("shape") && <div className="invalid-feedback d-block">{validationErrors.shape}</div>}
          </div>

          <div className="col-md-3">
            <Label required>Weight (Carats)</Label>
            <input
              name="weight"
              value={form.weight}
              onChange={change}
              type="number"
              step="0.01"
              min="0.01"
              className={inputClass("weight")}
              placeholder="e.g., 1.25"
            />
            {hasError("weight") && <div className="invalid-feedback d-block">{validationErrors.weight}</div>}
          </div>

          <div className="col-md-3">
            <Label required>Color</Label>
            <select name="color" value={form.color} onChange={change} className={selectClass("color")}>
              <option value="">Select Color</option>
              {Object.entries(GIA_STANDARDS.COLORS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError("color") && <div className="invalid-feedback d-block">{validationErrors.color}</div>}
          </div>

          <div className="col-md-3">
            <Label required>Clarity</Label>
            <select name="clarity" value={form.clarity} onChange={change} className={selectClass("clarity")}>
              <option value="">Select Clarity</option>
              {Object.entries(GIA_STANDARDS.CLARITY).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError("clarity") && <div className="invalid-feedback d-block">{validationErrors.clarity}</div>}
          </div>

          <div className="col-md-3">
            <Label required>Cut</Label>
            <select name="cut" value={form.cut} onChange={change} className={selectClass("cut")}>
              <option value="">Select Cut</option>
              {Object.entries(GIA_STANDARDS.CUT).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError("cut") && <div className="invalid-feedback d-block">{validationErrors.cut}</div>}
          </div>

          <div className="col-md-3">
            <Label>Polish</Label>
            <select name="pol" value={form.pol} onChange={change} className="form-select">
              <option value="">Select Polish</option>
              {Object.entries(GIA_STANDARDS.POLISH).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <Label>Symmetry</Label>
            <select name="sym" value={form.sym} onChange={change} className="form-select">
              <option value="">Select Symmetry</option>
              {Object.entries(GIA_STANDARDS.SYMMETRY).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <Label>Fluorescence</Label>
            <select name="flor" value={form.flor} onChange={change} className="form-select">
              <option value="">Select Fluorescence</option>
              {Object.entries(GIA_STANDARDS.FLUORESCENCE).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <Label>Eye Clean</Label>
            <select name="eye_clean" value={form.eye_clean} onChange={change} className="form-select">
              <option value="">Select Eye Clean</option>
              {Object.entries(GIA_STANDARDS.EYE_CLEAN).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <Label>No BGM</Label>
            <select name="no_bgm" value={form.no_bgm} onChange={change} className="form-select">
              <option value="">Select Option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Price Information */}
      <Section title="Price Information" icon="bi-cash-stack" defaultOpen>
        <div className="alert alert-warning mb-3">
          <strong>Required:</strong> Please fill in Rap Rate, Rap Discount, and Purchase Rap Discount. These fields cannot be empty.
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <Label required>Rap Rate</Label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input name="rap_rate" value={form.rap_rate} onChange={change} type="number" step="0.01" min="0" className={inputClass("rap_rate")} placeholder="e.g., 5000" />
            </div>
            {hasError("rap_rate") && <div className="invalid-feedback d-block">{validationErrors.rap_rate}</div>}
          </div>

          <div className="col-md-4">
            <Label required>Rap Discount (%)</Label>
            <div className="input-group">
              <input name="rap_discount" value={form.rap_discount} onChange={change} type="number" step="0.01" className={inputClass("rap_discount")} placeholder="e.g., 35" />
              <span className="input-group-text">%</span>
            </div>
            {hasError("rap_discount") && <div className="invalid-feedback d-block">{validationErrors.rap_discount}</div>}
          </div>

          <div className="col-md-4">
            <Label>Price per Carat (USD)</Label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input readOnly className="form-control bg-light" value={form.price_per_carat_usd} />
            </div>
          </div>

          <div className="col-md-4">
            <Label>Amount (USD)</Label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input readOnly className="form-control bg-light" value={form.amount_usd} />
            </div>
          </div>

          <div className="col-md-4">
            <Label>Conversion Rate (USD to INR)</Label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-arrow-left-right" /></span>
              <input name="conversion_rate" value={form.conversion_rate} onChange={change} type="number" step="0.01" className="form-control" placeholder="e.g., 83.50" />
            </div>
          </div>

          <div className="col-md-4">
            <Label>Amount (INR)</Label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input readOnly className="form-control bg-light" value={form.amount_inr} />
            </div>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row g-3">
          <div className="col-md-4">
            <Label>Purchase From (Client)</Label>
            <select
              name="client_id"
              value={form.client_id}
              onChange={change}
              className="form-select"
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.contact_name})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <Label>Broker (Purchase)</Label>
            <select
              name="broker_id"
              value={form.broker_id}
              onChange={change}
              className="form-select"
            >
              <option value="">Select Broker</option>
              {brokers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.company_name})
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <Label required>Purchase Rap Discount (%)</Label>
            <div className="input-group">
              <input name="pur_rap_discount" value={form.pur_rap_discount} onChange={change} type="number" step="0.01" className={inputClass("pur_rap_discount")} placeholder="e.g., 40" />
              <span className="input-group-text">%</span>
            </div>
            {hasError("pur_rap_discount") && <div className="invalid-feedback d-block">{validationErrors.pur_rap_discount}</div>}
          </div>

          <div className="col-md-4">
            <Label>Purchase Price (USD)</Label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input readOnly className="form-control bg-light" value={form.purchase_price} />
            </div>
          </div>

          <div className="col-md-4">
            <Label>Purchase Conversion Rate</Label>
            <input name="purchase_conversion_rate" value={form.purchase_conversion_rate} onChange={change} type="number" step="0.01" className="form-control" placeholder="e.g., 83.50" />
          </div>

          <div className="col-md-4">
            <Label>Purchase Price (INR)</Label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input readOnly className="form-control bg-light" value={form.purchase_price_inr} />
            </div>
          </div>

          <div className="col-md-2">
            <Label>Location</Label>
            <select name="location" value={form.location} onChange={change} className="form-select">
              <option value="Mumbai">Mumbai</option>
              <option value="Surat">Surat</option>
              <option value="GIA Lab">GIA Lab</option>
              <option value="IGI Lab">IGI Lab</option>
              <option value="Other Labs">Other Labs</option>
            </select>
          </div>
          <div className="col-md-2">
            <Label>Availability</Label>
            <select name="availability" value={form.availability} onChange={change} className="form-select">
              {Object.entries(GIA_STANDARDS.AVAILABILITY).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="my-4" />

        <div className="row g-3">
          <div className="col-md-3">
            <Label>Payment Status</Label>
            <select name="payment_status" value={form.payment_status} onChange={change} className="form-select">
              <option value="">Select Status</option>
              <option value="On Terms">On Terms</option>
              <option value="Bill Cleared">Bill Cleared</option>
            </select>
          </div>

          <div className="col-md-3">
            <Label>Buying Date</Label>
            <input type="date" name="buying_date" value={form.buying_date} onChange={change} className="form-control" />
          </div>

          {form.payment_status === "On Terms" && (
            <>
              <div className="col-md-2">
                <Label>Terms (Days)</Label>
                <input type="number" name="terms_days" value={form.terms_days} onChange={change} className="form-control" placeholder="e.g. 30" />
              </div>
              <div className="col-md-2">
                <Label>Expiry Date</Label>
                <input
                  type="date"
                  value={(() => {
                    if (!form.buying_date || !form.terms_days) return "";
                    const date = new Date(form.buying_date);
                    if (isNaN(date.getTime())) return "";
                    date.setDate(date.getDate() + (parseInt(form.terms_days) || 0));
                    return date.toISOString().split("T")[0];
                  })()}
                  className="form-control bg-light"
                  readOnly
                />
              </div>
              <div className="col-md-2">
                <Label>Payment Amount Done</Label>
                <input type="number" step="0.01" name="payment_amount_done" value={form.payment_amount_done} onChange={change} className="form-control" />
              </div>
            </>
          )}
        </div>
      </Section>

      {/* Quality Characteristics */}
      <Section title="Quality Characteristics" icon="bi-stars" defaultOpen={false}>
        <div className="row g-3">
          <div className="col-md-6">
            <Label>Color Descriptions</Label>
            <textarea name="color_descriptions" value={form.color_descriptions} onChange={change} rows={2} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Clarity Status</Label>
            <input name="clarity_status" value={form.clarity_status} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Final Cut</Label>
            <select name="final_cut" value={form.final_cut} onChange={change} className="form-select">
              <option value="">Select Final Cut</option>
              {Object.entries(GIA_STANDARDS.CUT).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <Label>Fluorescence Intensity</Label>
            <select name="fluorescence_intensity" value={form.fluorescence_intensity} onChange={change} className="form-select">
              <option value="">Select Intensity</option>
              {Object.entries(GIA_STANDARDS.FLUORESCENCE).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4">
            <Label>Fluorescence Color</Label>
            <select name="fluorescence_color" value={form.fluorescence_color} onChange={change} className="form-select">
              <option value="">Select Color</option>
              {Object.entries(GIA_STANDARDS.FLUORESCENCE_COLORS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Origin & Source Information */}
      <Section title="Origin & Source Information" icon="bi-globe2" defaultOpen={false}>
        <div className="row g-3">
          <div className="col-md-4">
            <Label>Country of Origin</Label>
            <input name="country_of_origin" value={form.country_of_origin} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Rough Report Number</Label>
            <input name="rough_report_number" value={form.rough_report_number} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Diamond Type</Label>
            <input name="diamond_type" value={form.diamond_type} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Disclosed Source</Label>
            <input name="disclosed_source" value={form.disclosed_source} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Kimberley Process Number</Label>
            <input name="kimberley_process_number" value={form.kimberley_process_number} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Rough Invoice Number</Label>
            <input name="rough_invoice_number" value={form.rough_invoice_number} onChange={change} className="form-control" />
          </div>
        </div>
      </Section>

      {/* Dimensions & Measurements */}
      <Section title="Dimensions & Measurements" icon="bi-rulers" defaultOpen={false}>
        <div className="row g-3">
          <div className="col-12">
            <Label>Measurement (L x W x D)</Label>
            <input name="measurement" value={form.measurement} onChange={change} className="form-control" placeholder="e.g., 6.52 x 6.55 x 4.03" />
          </div>
          <div className="col-md-4">
            <Label>Length</Label>
            <input type="number" step="0.01" name="length" value={form.length} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Width</Label>
            <input type="number" step="0.01" name="width" value={form.width} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Depth</Label>
            <input type="number" step="0.01" name="depth" value={form.depth} onChange={change} className="form-control" />
          </div>

          <div className="col-md-4">
            <Label>Table (%)</Label>
            <input type="number" step="0.01" name="table_percentage" value={form.table_percentage} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Depth (%)</Label>
            <input type="number" step="0.01" name="depth_percentage" value={form.depth_percentage} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Ratio</Label>
            <input type="number" step="0.01" name="ratio" value={form.ratio} onChange={change} className="form-control" />
          </div>

          <div className="col-md-3">
            <Label>Crown Angle</Label>
            <input type="number" step="0.01" name="crn_ag" value={form.crn_ag} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Crown Height</Label>
            <input type="number" step="0.01" name="crn_ht" value={form.crn_ht} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Pavilion Angle</Label>
            <input type="number" step="0.01" name="pav_ag" value={form.pav_ag} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Pavilion Depth</Label>
            <input type="number" step="0.01" name="pav_dp" value={form.pav_dp} onChange={change} className="form-control" />
          </div>

          <div className="col-md-3">
            <Label>Star Length</Label>
            <input type="number" step="0.01" name="str_ln" value={form.str_ln} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Lower Half</Label>
            <input type="number" step="0.01" name="lr_half" value={form.lr_half} onChange={change} className="form-control" />
          </div>

          <div className="col-md-3">
            <Label>Girdle</Label>
            <select name="girdle" value={form.girdle} onChange={change} className="form-select">
              <option value="">Select Girdle</option>
              {Object.entries(GIA_STANDARDS.GIRDLE).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3">
            <Label>Culet Size</Label>
            <select name="culet_size" value={form.culet_size} onChange={change} className="form-select">
              <option value="">Select Culet Size</option>
              {Object.entries(GIA_STANDARDS.CULET).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <Label>Girdle Condition</Label>
            <input name="girdle_condition" value={form.girdle_condition} onChange={change} className="form-control" />
          </div>
          <div className="col-md-6">
            <Label>Girdle %</Label>
            <input name="girdle_pct" value={form.girdle_pct} onChange={change} className="form-control" />
          </div>
        </div>
      </Section>

      {/* Additional Features & Comments */}
      <Section title="Additional Features & Comments" icon="bi-chat-left-text" defaultOpen={false}>
        <div className="row g-3">
          <div className="col-md-6">
            <Label>Polish Features</Label>
            <textarea name="polish_features" value={form.polish_features} onChange={change} rows={2} className="form-control" />
          </div>
          <div className="col-md-6">
            <Label>Symmetry Features</Label>
            <textarea name="symmetry_features" value={form.symmetry_features} onChange={change} rows={2} className="form-control" />
          </div>

          <div className="col-md-4">
            <Label>Painting</Label>
            <input name="painting" value={form.painting} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Proportion</Label>
            <textarea name="proportion" value={form.proportion} onChange={change} rows={2} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Paint Comments</Label>
            <textarea name="paint_comm" value={form.paint_comm} onChange={change} rows={2} className="form-control" />
          </div>

          <div className="col-md-6">
            <Label>Key to Symbols</Label>
            <textarea name="key_to_symbols" value={form.key_to_symbols} onChange={change} rows={2} className="form-control" />
          </div>
          <div className="col-md-6">
            <Label>Report Comments</Label>
            <textarea name="report_comments" value={form.report_comments} onChange={change} rows={2} className="form-control" />
          </div>
        </div>
      </Section>

      {/* Additional Technical Details */}
      <Section title="Additional Technical Details" icon="bi-tools" defaultOpen={false}>
        <div className="row g-3">
          <div className="col-md-4">
            <Label>Inscription</Label>
            <input name="inscription" value={form.inscription} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>Synthetic Indicator</Label>
            <input name="synthetic_indicator" value={form.synthetic_indicator} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4">
            <Label>AGSI/ASET</Label>
            <input name="agsi_aset" value={form.agsi_aset} onChange={change} className="form-control" />
          </div>

          <div className="col-md-6">
            <Label>Shape Description</Label>
            <input name="shape_description" value={form.shape_description} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Report Type</Label>
            <input name="report_type" value={form.report_type} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3">
            <Label>Sorting</Label>
            <input name="sorting" value={form.sorting} onChange={change} className="form-control" />
          </div>

          <div className="col-12">
            <Label>Basket Status</Label>
            <input name="basket_status" value={form.basket_status} onChange={change} className="form-control" />
          </div>
        </div>
      </Section>

      {/* Submit Buttons */}
      <div className="row mt-4 mb-5">
        <div className="col-12 d-flex gap-3">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2" />
                {initial.id ? "Update Diamond" : "Save Diamond"}
              </>
            )}
          </button>
          <Link href="/diamonds" className="btn btn-outline-secondary btn-lg">
            Cancel
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .btn:focus,
        .form-control:focus,
        .form-select:focus {
          box-shadow: none !important;
        }
        .form-control,
        .form-select,
        .input-group-text {
          border-color: rgba(0, 0, 0, 0.10) !important;
        }
        .form-control,
        .form-select {
          border-radius: 12px;
        }
      `}</style>
    </form>
  );
}