// app/diamonds/DiamondsForm.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// GIA Standards Constants
const GIA_STANDARDS = {
  LABS: {
    GIA: "GIA",
    IGI: "IGI",
    HRD: "HRD",
    AGS: "AGS",
    GCAL: "GCAL",
    EGL: "EGL",
    OTHER: "Other"
  },
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
    heart: "Heart"
  },
  COLORS: {
    D: "D",
    E: "E",
    F: "F",
    G: "G",
    H: "H",
    I: "I",
    J: "J",
    K: "K",
    L: "L",
    M: "M"
  },
  CLARITY: {
    FL: "FL",
    IF: "IF",
    VVS1: "VVS1",
    VVS2: "VVS2",
    VS1: "VS1",
    VS2: "VS2",
    SI1: "SI1",
    SI2: "SI2",
    I1: "I1",
    I2: "I2",
    I3: "I3"
  },
  CUT: {
    ideal: "Ideal",
    excellent: "Excellent",
    very_good: "Very Good",
    good: "Good",
    fair: "Fair",
    poor: "Poor"
  },
  POLISH: {
    excellent: "Excellent",
    very_good: "Very Good",
    good: "Good",
    fair: "Fair",
    poor: "Poor"
  },
  SYMMETRY: {
    excellent: "Excellent",
    very_good: "Very Good",
    good: "Good",
    fair: "Fair",
    poor: "Poor"
  },
  FLUORESCENCE: {
    none: "None",
    faint: "Faint",
    medium: "Medium",
    strong: "Strong",
    very_strong: "Very Strong"
  },
  FLUORESCENCE_COLORS: {
    blue: "Blue",
    yellow: "Yellow",
    green: "Green",
    white: "White",
    orange: "Orange"
  },
  EYE_CLEAN: {
    yes: "Yes",
    no: "No"
  },
  GIRDLE: {
    extremely_thin: "Extremely Thin",
    very_thin: "Very Thin",
    thin: "Thin",
    medium: "Medium",
    slightly_thick: "Slightly Thick",
    thick: "Thick",
    very_thick: "Very Thick",
    extremely_thick: "Extremely Thick"
  },
  CULET: {
    none: "None",
    very_small: "Very Small",
    small: "Small",
    medium: "Medium",
    slightly_large: "Slightly Large",
    large: "Large",
    very_large: "Very Large"
  },
  AVAILABILITY: {
    available: "Available",
    memo: "Out on Memo",
    sold: "Sold",
    subject_to_sale: "Subject to Prior Sale"
  }
};

// Collapsible Section Component
function CollapsibleSection({ title, id, isOpen: defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="card mb-3">
      <div 
        className="card-header d-flex justify-content-between align-items-center" 
        style={{ cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <h5 className="mb-0">{title}</h5>
        <span>{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <div className="card-body">
          {children}
        </div>
      )}
    </div>
  );
}

export default function DiamondsForm({ initial = {}, onSuccess = () => {} }) {
  const router = useRouter();

  const [form, setForm] = useState({
    // Basic Information
    stone_type: initial.stone_type || "",
    lab: initial.lab || "",
    certificate_number: initial.certificate_number || "",
    shape: initial.shape || "",
    weight: initial.weight || "",
    color: initial.color || "",
    clarity: initial.clarity || "",
    cut: initial.cut || "",
    pol: initial.pol || "",
    sym: initial.sym || "",
    flor: initial.flor || "",
    eye_clean: initial.eye_clean || "",
    no_bgm: initial.no_bgm || "",

    // Report & Reference Information
    job_no: initial.job_no || "",
    control_no: initial.control_no || "",
    diamond_dossier: initial.diamond_dossier || "",
    report_no: initial.report_no || "",
    report_dt: initial.report_dt || "",
    client_ref: initial.client_ref || "",
    memo_no: initial.memo_no || "",

    // Quality Characteristics
    color_descriptions: initial.color_descriptions || "",
    clarity_status: initial.clarity_status || "",
    final_cut: initial.final_cut || "",
    fluorescence_intensity: initial.fluorescence_intensity || "",
    fluorescence_color: initial.fluorescence_color || "",

    // Origin & Source Information
    country_of_origin: initial.country_of_origin || "",
    rough_report_number: initial.rough_report_number || "",
    diamond_type: initial.diamond_type || "",
    disclosed_source: initial.disclosed_source || "",
    kimberley_process_number: initial.kimberley_process_number || "",
    rough_invoice_number: initial.rough_invoice_number || "",

    // Price Information - REQUIRED FIELDS
    rap_rate: initial.rap_rate || "0",
    rap_discount: initial.rap_discount || "0",
    price_per_carat_usd: initial.price_per_carat_usd || "0",
    amount_usd: initial.amount_usd || "0",
    conversion_rate: initial.conversion_rate || "",
    amount_inr: initial.amount_inr || "",
    purchase_from: initial.purchase_from || "",
    pur_rap_discount: initial.pur_rap_discount || "0",
    purchase_price: initial.purchase_price || "",
    purchase_conversion_rate: initial.purchase_conversion_rate || "",
    purchase_price_inr: initial.purchase_price_inr || "",
    availability: initial.availability || "available",

    // Dimensions & Measurements
    measurement: initial.measurement || "",
    length: initial.length || "",
    width: initial.width || "",
    depth: initial.depth || "",
    table_percentage: initial.table_percentage || "",
    depth_percentage: initial.depth_percentage || "",
    ratio: initial.ratio || "",
    crn_ag: initial.crn_ag || "",
    crn_ht: initial.crn_ht || "",
    pav_ag: initial.pav_ag || "",
    pav_dp: initial.pav_dp || "",
    str_ln: initial.str_ln || "",
    lr_half: initial.lr_half || "",
    girdle: initial.girdle || "",
    girdle_condition: initial.girdle_condition || "",
    girdle_pct: initial.girdle_pct || "",
    culet_size: initial.culet_size || "",

    // Additional Features & Comments
    polish_features: initial.polish_features || "",
    symmetry_features: initial.symmetry_features || "",
    painting: initial.painting || "",
    proportion: initial.proportion || "",
    paint_comm: initial.paint_comm || "",
    key_to_symbols: initial.key_to_symbols || "",
    report_comments: initial.report_comments || "",

    // Additional Technical Details
    inscription: initial.inscription || "",
    synthetic_indicator: initial.synthetic_indicator || "",
    agsi_aset: initial.agsi_aset || "",
    shape_description: initial.shape_description || "",
    report_type: initial.report_type || "",
    sorting: initial.sorting || "",
    basket_status: initial.basket_status || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate derived values
  const calculatePrices = useCallback((updatedForm) => {
    const rapRate = parseFloat(updatedForm.rap_rate) || 0;
    const rapDiscount = parseFloat(updatedForm.rap_discount) || 0;
    const weight = parseFloat(updatedForm.weight) || 0;
    const conversionRate = parseFloat(updatedForm.conversion_rate) || 0;
    const purRapDiscount = parseFloat(updatedForm.pur_rap_discount) || 0;
    const purchaseConversionRate = parseFloat(updatedForm.purchase_conversion_rate) || 0;

    // Calculate price per carat: Rap Rate * (1 - Discount/100)
    let pricePerCarat = rapRate * (1 - rapDiscount / 100);

    // Calculate amount USD: Weight * Price Per Carat
    const amountUsd = weight * pricePerCarat;

    // Calculate amount INR: Amount USD * Conversion Rate
    const amountInr = conversionRate > 0 ? amountUsd * conversionRate : null;

    // Calculate purchase price: Weight * Rap Rate * (1 - Purchase Discount/100)
    const purchasePrice = weight * rapRate * (1 - purRapDiscount / 100);

    // Calculate purchase price INR
    const purchasePriceInr = purchaseConversionRate > 0 ? purchasePrice * purchaseConversionRate : null;

    return {
      price_per_carat_usd: pricePerCarat.toFixed(2),
      amount_usd: amountUsd.toFixed(2),
      amount_inr: amountInr !== null ? amountInr.toFixed(2) : "",
      purchase_price: purchasePrice.toFixed(2),
      purchase_price_inr: purchasePriceInr !== null ? purchasePriceInr.toFixed(2) : "",
    };
  }, []);

  const change = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Recalculate prices if relevant fields change
    const priceFields = ['rap_rate', 'rap_discount', 'weight', 'conversion_rate', 'pur_rap_discount', 'purchase_conversion_rate'];
    if (priceFields.includes(name)) {
      const calculatedValues = calculatePrices(updatedForm);
      setForm({ ...updatedForm, ...calculatedValues });
    } else {
      setForm(updatedForm);
    }
  };

  // Initial calculation on mount
  useEffect(() => {
    const calculatedValues = calculatePrices(form);
    setForm(prev => ({ ...prev, ...calculatedValues }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Validate form before submit
  const validateForm = () => {
    const errors = {};
    
    // Required string fields
    if (!form.shape) errors.shape = "Shape is required";
    if (!form.color) errors.color = "Color is required";
    if (!form.clarity) errors.clarity = "Clarity is required";
    if (!form.cut) errors.cut = "Cut is required";
    
    // Required numeric fields
    if (!form.weight || parseFloat(form.weight) <= 0) {
      errors.weight = "Weight is required and must be greater than 0";
    }
    if (form.rap_rate === "" || form.rap_rate === null || form.rap_rate === undefined) {
      errors.rap_rate = "Rap Rate is required";
    }
    if (form.rap_discount === "" || form.rap_discount === null || form.rap_discount === undefined) {
      errors.rap_discount = "Rap Discount is required";
    }
    if (form.pur_rap_discount === "" || form.pur_rap_discount === null || form.pur_rap_discount === undefined) {
      errors.pur_rap_discount = "Purchase Rap Discount is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!validateForm()) {
      setError("Please fill in all required fields");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const method = initial.id ? "PUT" : "POST";
    const url = initial.id ? `/api/diamonds/${initial.id}` : `/api/diamonds`;

    // Prepare the data object with ALL fields explicitly
    const dataToSend = {
      // Basic Info
      stone_type: form.stone_type || null,
      lab: form.lab || null,
      certificate_number: form.certificate_number || null,
      shape: form.shape,
      weight: parseFloat(form.weight),
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

      // Price - REQUIRED FIELDS (NOT NULL in DB)
      rap_rate: parseFloat(form.rap_rate) || 0,
      rap_discount: parseFloat(form.rap_discount) || 0,
      price_per_carat_usd: parseFloat(form.price_per_carat_usd) || 0,
      amount_usd: parseFloat(form.amount_usd) || 0,
      pur_rap_discount: parseFloat(form.pur_rap_discount) || 0,
      
      // Price - NULLABLE FIELDS
      conversion_rate: form.conversion_rate ? parseFloat(form.conversion_rate) : null,
      amount_inr: form.amount_inr ? parseFloat(form.amount_inr) : null,
      purchase_from: form.purchase_from || null,
      purchase_price: form.purchase_price ? parseFloat(form.purchase_price) : null,
      purchase_conversion_rate: form.purchase_conversion_rate ? parseFloat(form.purchase_conversion_rate) : null,
      purchase_price_inr: form.purchase_price_inr ? parseFloat(form.purchase_price_inr) : null,
      availability: form.availability || "available",

      // Dimensions
      measurement: form.measurement || null,
      length: form.length ? parseFloat(form.length) : null,
      width: form.width ? parseFloat(form.width) : null,
      depth: form.depth ? parseFloat(form.depth) : null,
      table_percentage: form.table_percentage ? parseFloat(form.table_percentage) : null,
      depth_percentage: form.depth_percentage ? parseFloat(form.depth_percentage) : null,
      ratio: form.ratio ? parseFloat(form.ratio) : null,
      crn_ag: form.crn_ag ? parseFloat(form.crn_ag) : null,
      crn_ht: form.crn_ht ? parseFloat(form.crn_ht) : null,
      pav_ag: form.pav_ag ? parseFloat(form.pav_ag) : null,
      pav_dp: form.pav_dp ? parseFloat(form.pav_dp) : null,
      str_ln: form.str_ln ? parseFloat(form.str_ln) : null,
      lr_half: form.lr_half ? parseFloat(form.lr_half) : null,
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
    };

    // DEBUG: Log the data being sent
    console.log("=== FORM DATA BEING SENT ===");
    console.log("rap_rate:", dataToSend.rap_rate, typeof dataToSend.rap_rate);
    console.log("rap_discount:", dataToSend.rap_discount, typeof dataToSend.rap_discount);
    console.log("price_per_carat_usd:", dataToSend.price_per_carat_usd, typeof dataToSend.price_per_carat_usd);
    console.log("amount_usd:", dataToSend.amount_usd, typeof dataToSend.amount_usd);
    console.log("pur_rap_discount:", dataToSend.pur_rap_discount, typeof dataToSend.pur_rap_discount);
    console.log("Full data:", JSON.stringify(dataToSend, null, 2));

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error("API Error Response:", txt);
        throw new Error(txt);
      }

      const data = await res.json();
      onSuccess(data);
      router.push("/diamonds");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to save diamond");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const hasError = (field) => validationErrors[field];
  const getErrorClass = (field) => hasError(field) ? 'is-invalid' : '';

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
          {Object.keys(validationErrors).length > 0 && (
            <ul className="mb-0 mt-2">
              {Object.entries(validationErrors).map(([field, msg]) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Basic Information Section */}
      <CollapsibleSection title="Basic Information" id="basic-info" isOpen={true}>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Stone Type</label>
            <input 
              type="text" 
              name="stone_type" 
              value={form.stone_type} 
              onChange={change} 
              className="form-control" 
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Lab</label>
            <select 
              name="lab" 
              value={form.lab} 
              onChange={change} 
              className="form-select"
            >
              <option value="">Select Lab</option>
              {Object.entries(GIA_STANDARDS.LABS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Certificate Number</label>
            <input 
              type="text" 
              name="certificate_number" 
              value={form.certificate_number} 
              onChange={change} 
              className="form-control" 
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Shape <span className="text-danger">*</span></label>
            <select 
              name="shape" 
              value={form.shape} 
              onChange={change} 
              className={`form-select ${getErrorClass('shape')}`}
            >
              <option value="">Select Shape</option>
              {Object.entries(GIA_STANDARDS.SHAPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError('shape') && <div className="invalid-feedback">{validationErrors.shape}</div>}
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">Weight (Carats) <span className="text-danger">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              name="weight" 
              value={form.weight} 
              onChange={change} 
              className={`form-control ${getErrorClass('weight')}`}
            />
            {hasError('weight') && <div className="invalid-feedback">{validationErrors.weight}</div>}
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">Color <span className="text-danger">*</span></label>
            <select 
              name="color" 
              value={form.color} 
              onChange={change} 
              className={`form-select ${getErrorClass('color')}`}
            >
              <option value="">Select Color</option>
              {Object.entries(GIA_STANDARDS.COLORS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError('color') && <div className="invalid-feedback">{validationErrors.color}</div>}
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">Clarity <span className="text-danger">*</span></label>
            <select 
              name="clarity" 
              value={form.clarity} 
              onChange={change} 
              className={`form-select ${getErrorClass('clarity')}`}
            >
              <option value="">Select Clarity</option>
              {Object.entries(GIA_STANDARDS.CLARITY).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError('clarity') && <div className="invalid-feedback">{validationErrors.clarity}</div>}
          </div>
        </div>

        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Cut <span className="text-danger">*</span></label>
            <select 
              name="cut" 
              value={form.cut} 
              onChange={change} 
              className={`form-select ${getErrorClass('cut')}`}
            >
              <option value="">Select Cut</option>
              {Object.entries(GIA_STANDARDS.CUT).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {hasError('cut') && <div className="invalid-feedback">{validationErrors.cut}</div>}
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">Polish</label>
            <select 
              name="pol" 
              value={form.pol} 
              onChange={change} 
              className="form-select"
            >
              <option value="">Select Polish</option>
              {Object.entries(GIA_STANDARDS.POLISH).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">Symmetry</label>
            <select 
              name="sym" 
              value={form.sym} 
              onChange={change} 
              className="form-select"
            >
              <option value="">Select Symmetry</option>
              {Object.entries(GIA_STANDARDS.SYMMETRY).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">Fluorescence</label>
            <select 
              name="flor" 
              value={form.flor} 
              onChange={change} 
              className="form-select"
            >
              <option value="">Select Fluorescence</option>
              {Object.entries(GIA_STANDARDS.FLUORESCENCE).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Eye Clean</label>
            <select 
              name="eye_clean" 
              value={form.eye_clean} 
              onChange={change} 
              className="form-select"
            >
              <option value="">Select Eye Clean</option>
              {Object.entries(GIA_STANDARDS.EYE_CLEAN).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-3 mb-3">
            <label className="form-label">No BGM</label>
            <select 
              name="no_bgm" 
              value={form.no_bgm} 
              onChange={change} 
              className="form-select"
            >
              <option value="">Select Option</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Price Information - OPEN BY DEFAULT */}
      <CollapsibleSection title="Price Information (Required)" id="price-info" isOpen={true}>
        <div className="alert alert-warning mb-3">
          <strong>Required:</strong> Please fill in Rap Rate, Rap Discount, and Purchase Rap Discount. These fields cannot be empty.
        </div>
        
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Rap Rate <span className="text-danger">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              min="0"
              name="rap_rate" 
              value={form.rap_rate} 
              onChange={change} 
              className={`form-control ${getErrorClass('rap_rate')}`}
              placeholder="Enter Rap Rate (e.g., 5000)"
            />
            {hasError('rap_rate') && <div className="invalid-feedback">{validationErrors.rap_rate}</div>}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Rap Discount (%) <span className="text-danger">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="rap_discount" 
              value={form.rap_discount} 
              onChange={change} 
              className={`form-control ${getErrorClass('rap_discount')}`}
              placeholder="Enter Discount % (e.g., 35)"
            />
            {hasError('rap_discount') && <div className="invalid-feedback">{validationErrors.rap_discount}</div>}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Price per Carat (USD)</label>
            <input 
              type="number" 
              step="0.01" 
              name="price_per_carat_usd" 
              value={form.price_per_carat_usd} 
              readOnly 
              className="form-control bg-light" 
            />
            {/* <small className="text-muted">Auto-calculated: Rap × (1 - Discount%)</small> */}
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Amount (USD)</label>
            <input 
              type="number" 
              step="0.01" 
              name="amount_usd" 
              value={form.amount_usd} 
              readOnly 
              className="form-control bg-light" 
            />
            {/* <small className="text-muted">Auto-calculated: Weight × Price/Carat</small> */}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Conversion Rate (USD to INR)</label>
            <input 
              type="number" 
              step="0.01" 
              name="conversion_rate" 
              value={form.conversion_rate} 
              onChange={change} 
              className="form-control" 
              placeholder="e.g., 83.50"
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Amount (INR)</label>
            <input 
              type="number" 
              step="0.01" 
              name="amount_inr" 
              value={form.amount_inr} 
              readOnly 
              className="form-control bg-light" 
            />
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Purchase From</label>
            <input 
              type="text" 
              name="purchase_from" 
              value={form.purchase_from} 
              onChange={change} 
              className="form-control" 
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Purchase Rap Discount (%) <span className="text-danger">*</span></label>
            <input 
              type="number" 
              step="0.01" 
              name="pur_rap_discount" 
              value={form.pur_rap_discount} 
              onChange={change} 
              className={`form-control ${getErrorClass('pur_rap_discount')}`}
              placeholder="Enter Purchase Discount % (e.g., 40)"
            />
            {hasError('pur_rap_discount') && <div className="invalid-feedback">{validationErrors.pur_rap_discount}</div>}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Purchase Price (USD)</label>
            <input 
              type="number" 
              step="0.01" 
              name="purchase_price" 
              value={form.purchase_price} 
              readOnly 
              className="form-control bg-light" 
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Purchase Conversion Rate</label>
            <input 
              type="number" 
              step="0.01" 
              name="purchase_conversion_rate" 
              value={form.purchase_conversion_rate} 
              onChange={change} 
              className="form-control" 
              placeholder="e.g., 83.50"
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Purchase Price (INR)</label>
            <input 
              type="number" 
              step="0.01" 
              name="purchase_price_inr" 
              value={form.purchase_price_inr} 
              readOnly 
              className="form-control bg-light" 
            />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Availability</label>
            <select 
              name="availability" 
              value={form.availability} 
              onChange={change} 
              className="form-select"
            >
              {Object.entries(GIA_STANDARDS.AVAILABILITY).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Report & Reference Information */}
      {/* <CollapsibleSection title="Report & Reference Information" id="report-info" isOpen={false}>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Job No</label>
            <input type="text" name="job_no" value={form.job_no} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Control No</label>
            <input type="text" name="control_no" value={form.control_no} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Diamond Dossier</label>
            <input type="text" name="diamond_dossier" value={form.diamond_dossier} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Report No</label>
            <input type="text" name="report_no" value={form.report_no} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Report Date</label>
            <input type="date" name="report_dt" value={form.report_dt} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Client Reference</label>
            <input type="text" name="client_ref" value={form.client_ref} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Memo No</label>
            <input type="text" name="memo_no" value={form.memo_no} onChange={change} className="form-control" />
          </div>
        </div>
      </CollapsibleSection> */}

      {/* Quality Characteristics */}
      <CollapsibleSection title="Quality Characteristics" id="quality-characteristics" isOpen={false}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Color Descriptions</label>
            <textarea name="color_descriptions" value={form.color_descriptions} onChange={change} rows="2" className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Clarity Status</label>
            <input type="text" name="clarity_status" value={form.clarity_status} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Final Cut</label>
            <select name="final_cut" value={form.final_cut} onChange={change} className="form-select">
              <option value="">Select Final Cut</option>
              {Object.entries(GIA_STANDARDS.CUT).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Fluorescence Intensity</label>
            <select name="fluorescence_intensity" value={form.fluorescence_intensity} onChange={change} className="form-select">
              <option value="">Select Intensity</option>
              {Object.entries(GIA_STANDARDS.FLUORESCENCE).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Fluorescence Color</label>
            <select name="fluorescence_color" value={form.fluorescence_color} onChange={change} className="form-select">
              <option value="">Select Color</option>
              {Object.entries(GIA_STANDARDS.FLUORESCENCE_COLORS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Origin & Source Information */}
      <CollapsibleSection title="Origin & Source Information" id="origin-source" isOpen={false}>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Country of Origin</label>
            <input type="text" name="country_of_origin" value={form.country_of_origin} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Rough Report Number</label>
            <input type="text" name="rough_report_number" value={form.rough_report_number} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Diamond Type</label>
            <input type="text" name="diamond_type" value={form.diamond_type} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Disclosed Source</label>
            <input type="text" name="disclosed_source" value={form.disclosed_source} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Kimberley Process Number</label>
            <input type="text" name="kimberley_process_number" value={form.kimberley_process_number} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Rough Invoice Number</label>
            <input type="text" name="rough_invoice_number" value={form.rough_invoice_number} onChange={change} className="form-control" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Dimensions & Measurements */}
      <CollapsibleSection title="Dimensions & Measurements" id="dimensions-measurements" isOpen={false}>
        <div className="row">
          <div className="col-md-12 mb-3">
            <label className="form-label">Measurement (L x W x D)</label>
            <input type="text" name="measurement" value={form.measurement} onChange={change} placeholder="e.g., 6.52 x 6.55 x 4.03" className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Length (mm)</label>
            <input type="number" step="0.01" name="length" value={form.length} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Width (mm)</label>
            <input type="number" step="0.01" name="width" value={form.width} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Depth (mm)</label>
            <input type="number" step="0.01" name="depth" value={form.depth} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Table (%)</label>
            <input type="number" step="0.01" name="table_percentage" value={form.table_percentage} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Depth (%)</label>
            <input type="number" step="0.01" name="depth_percentage" value={form.depth_percentage} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Ratio</label>
            <input type="number" step="0.01" name="ratio" value={form.ratio} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Crown Angle</label>
            <input type="number" step="0.01" name="crn_ag" value={form.crn_ag} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Crown Height</label>
            <input type="number" step="0.01" name="crn_ht" value={form.crn_ht} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Pavilion Angle</label>
            <input type="number" step="0.01" name="pav_ag" value={form.pav_ag} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Pavilion Depth</label>
            <input type="number" step="0.01" name="pav_dp" value={form.pav_dp} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-3 mb-3">
            <label className="form-label">Star Length</label>
            <input type="number" step="0.01" name="str_ln" value={form.str_ln} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Lower Half</label>
            <input type="number" step="0.01" name="lr_half" value={form.lr_half} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Girdle</label>
            <select name="girdle" value={form.girdle} onChange={change} className="form-select">
              <option value="">Select Girdle</option>
              {Object.entries(GIA_STANDARDS.GIRDLE).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Culet Size</label>
            <select name="culet_size" value={form.culet_size} onChange={change} className="form-select">
              <option value="">Select Culet Size</option>
              {Object.entries(GIA_STANDARDS.CULET).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Girdle Condition</label>
            <input type="text" name="girdle_condition" value={form.girdle_condition} onChange={change} className="form-control" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Girdle Percentage</label>
            <input type="text" name="girdle_pct" value={form.girdle_pct} onChange={change} className="form-control" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Additional Features & Comments */}
      <CollapsibleSection title="Additional Features & Comments" id="additional-features" isOpen={false}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Polish Features</label>
            <textarea name="polish_features" value={form.polish_features} onChange={change} rows="2" className="form-control" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Symmetry Features</label>
            <textarea name="symmetry_features" value={form.symmetry_features} onChange={change} rows="2" className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Painting</label>
            <input type="text" name="painting" value={form.painting} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Proportion</label>
            <textarea name="proportion" value={form.proportion} onChange={change} rows="2" className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Paint Comments</label>
            <textarea name="paint_comm" value={form.paint_comm} onChange={change} rows="2" className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Key to Symbols</label>
            <textarea name="key_to_symbols" value={form.key_to_symbols} onChange={change} rows="2" className="form-control" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Report Comments</label>
            <textarea name="report_comments" value={form.report_comments} onChange={change} rows="2" className="form-control" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Additional Technical Details */}
      <CollapsibleSection title="Additional Technical Details" id="technical-details" isOpen={false}>
        <div className="row">
          <div className="col-md-4 mb-3">
            <label className="form-label">Inscription</label>
            <input type="text" name="inscription" value={form.inscription} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">Synthetic Indicator</label>
            <input type="text" name="synthetic_indicator" value={form.synthetic_indicator} onChange={change} className="form-control" />
          </div>
          <div className="col-md-4 mb-3">
            <label className="form-label">AGSI/ASET</label>
            <input type="text" name="agsi_aset" value={form.agsi_aset} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Shape Description</label>
            <input type="text" name="shape_description" value={form.shape_description} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Report Type</label>
            <input type="text" name="report_type" value={form.report_type} onChange={change} className="form-control" />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Sorting</label>
            <input type="text" name="sorting" value={form.sorting} onChange={change} className="form-control" />
          </div>
        </div>
        <div className="row">
          <div className="col-md-12 mb-3">
            <label className="form-label">Basket Status</label>
            <input type="text" name="basket_status" value={form.basket_status} onChange={change} className="form-control" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Submit Buttons */}
      <div className="row mt-4 mb-5">
        <div className="col-12">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              initial.id ? "Update Diamond" : "Save Diamond"
            )}
          </button>
          <a href="/diamonds" className="btn btn-secondary btn-lg ms-2">Cancel</a>
        </div>
      </div>
    </form>
  );
}