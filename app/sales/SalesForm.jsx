// app/sales/SalesForm.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

/**
 * Modern Sales Form
 * - Same fields + same calculations + same submit payload
 * - Cleaner layout: section headers + input groups with icons + summary panel
 * - No outer card (your pages already wrap it)
 */
export default function SalesForm({
  initial = {},
  diamonds = [],
  clients = [],
  brokers = [],
  preSelectedDiamondId = "",
  submitButtonText = "Create Sale",
  onSubmit,
}) {
  const [form, setForm] = useState({
    diamond_id: initial.diamond_id || preSelectedDiamondId || "",
    client_id: initial.client_id || "",
    broker_id: initial.broker_id || "",
    status: initial.status || "pending",
    sale_rap_discount: initial.sale_rap_discount || "",
    sale_amount: initial.sale_amount || "",
    conversion_rate: initial.conversion_rate || "",
    sale_amount_inr: initial.sale_amount_inr || "",
    brokerage_rate: initial.brokerage_rate || "",
    brokerage_amount: initial.brokerage_amount || "",
    notes: initial.notes || "",
  });

  const [diamondInfo, setDiamondInfo] = useState({ weight: "", rap_rate: "" });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const getSelectedDiamond = useCallback(() => {
    if (!form.diamond_id) return null;
    return diamonds.find((d) => String(d.id) === String(form.diamond_id)) || null;
  }, [form.diamond_id, diamonds]);

  const selectedDiamond = useMemo(() => getSelectedDiamond(), [getSelectedDiamond]);

  const selectedClient = useMemo(() => {
    if (!form.client_id) return null;
    return clients.find((c) => String(c.id) === String(form.client_id)) || null;
  }, [clients, form.client_id]);

  const selectedBroker = useMemo(() => {
    if (!form.broker_id) return null;
    return brokers.find((b) => String(b.id) === String(form.broker_id)) || null;
  }, [brokers, form.broker_id]);

  // Calculate sale amount: Weight * Rap Rate * (1 - Discount/100)
  const calculateSaleAmount = (weight, rapRate, discount) => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(rapRate) || 0;
    const d = parseFloat(discount) || 0;
    const saleAmount = w * r * (1 - d / 100);

    setForm((prev) => ({
      ...prev,
      sale_amount: saleAmount > 0 ? saleAmount.toFixed(2) : "",
    }));
  };

  const calculateSaleAmountInr = useCallback((saleAmount, conversionRate) => {
    const amount = parseFloat(saleAmount) || 0;
    const rate = parseFloat(conversionRate) || 0;
    if (rate > 0) return (amount * rate).toFixed(2);
    return "";
  }, []);

  const calculateBrokerageAmount = useCallback((saleAmount, brokerageRate) => {
    const amount = parseFloat(saleAmount) || 0;
    const rate = parseFloat(brokerageRate) || 0;
    if (rate > 0) return (amount * (rate / 100)).toFixed(2);
    return "";
  }, []);

  // Update diamond info when diamond changes
  useEffect(() => {
    if (selectedDiamond) {
      setDiamondInfo({
        weight: selectedDiamond.weight || "",
        rap_rate: selectedDiamond.rap_rate || "",
      });
      calculateSaleAmount(selectedDiamond.weight, selectedDiamond.rap_rate, form.sale_rap_discount);
    } else {
      setDiamondInfo({ weight: "", rap_rate: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.diamond_id, diamonds]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    const updated = { ...form, [name]: value };

    // Discount changes -> recompute amounts
    if (name === "sale_rap_discount") {
      const d = selectedDiamond;
      if (d) {
        const w = parseFloat(d.weight) || 0;
        const r = parseFloat(d.rap_rate) || 0;
        const disc = parseFloat(value) || 0;

        const saleAmount = w * r * (1 - disc / 100);
        updated.sale_amount = saleAmount > 0 ? saleAmount.toFixed(2) : "";
        updated.sale_amount_inr = calculateSaleAmountInr(saleAmount, updated.conversion_rate);
        updated.brokerage_amount = calculateBrokerageAmount(saleAmount, updated.brokerage_rate);
      }
    }

    if (name === "conversion_rate") {
      updated.sale_amount_inr = calculateSaleAmountInr(updated.sale_amount, value);
    }

    if (name === "brokerage_rate") {
      updated.brokerage_amount = calculateBrokerageAmount(updated.sale_amount, value);
    }

    setForm(updated);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.diamond_id) errors.diamond_id = "Diamond is required";
    if (!form.client_id) errors.client_id = "Client is required";
    if (!form.status) errors.status = "Status is required";
    if (form.sale_rap_discount === "" || form.sale_rap_discount === null || form.sale_rap_discount === undefined) {
      errors.sale_rap_discount = "Sale RAP Discount is required";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        diamond_id: parseInt(form.diamond_id),
        client_id: parseInt(form.client_id),
        broker_id: form.broker_id ? parseInt(form.broker_id) : null,
        status: form.status,
        sale_rap_discount: parseFloat(form.sale_rap_discount) || 0,
        sale_amount: parseFloat(form.sale_amount) || 0,
        conversion_rate: form.conversion_rate ? parseFloat(form.conversion_rate) : null,
        sale_amount_inr: form.sale_amount_inr ? parseFloat(form.sale_amount_inr) : null,
        brokerage_rate: form.brokerage_rate ? parseFloat(form.brokerage_rate) : null,
        brokerage_amount: form.brokerage_amount ? parseFloat(form.brokerage_amount) : null,
        notes: form.notes || null,
      };

      await onSubmit(dataToSend);
    } catch (err) {
      setError(err.message || "Failed to save sale");
    } finally {
      setLoading(false);
    }
  };

  const hasError = (field) => Boolean(validationErrors[field]);
  const controlClass = (field) => `form-control ${hasError(field) ? "is-invalid" : ""}`;
  const selectClass = (field) => `form-select ${hasError(field) ? "is-invalid" : ""}`;

  const summary = useMemo(() => {
    const usd = parseFloat(form.sale_amount);
    const inr = parseFloat(form.sale_amount_inr);
    const bro = parseFloat(form.brokerage_amount);
    return {
      usd: Number.isNaN(usd) ? "-" : `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      inr: Number.isNaN(inr) ? "-" : `₹${inr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      bro: Number.isNaN(bro) ? "-" : `$${bro.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }, [form.sale_amount, form.sale_amount_inr, form.brokerage_amount]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start" style={{ borderRadius: 14 }}>
          <i className="bi bi-exclamation-triangle me-2 mt-1" />
          <div className="flex-grow-1">
            <div className="fw-semibold">{error}</div>
            {Object.keys(validationErrors).length > 0 && (
              <ul className="mb-0 mt-2 small">
                {Object.entries(validationErrors).map(([field, msg]) => (
                  <li key={field}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" className="btn-close ms-2" onClick={() => setError("")} />
        </div>
      )}

      {/* Summary strip */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 p-3"
        style={{
          background: "linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(37,99,235,0.05) 100%)",
          border: "1px solid rgba(14,165,233,0.12)",
          borderRadius: 14,
        }}
      >
        <div className="d-flex flex-wrap gap-2">
          <span className="badge bg-info bg-opacity-10 text-info px-3 py-2" style={{ borderRadius: 999 }}>
            <i className="bi bi-cash-stack me-2" />
            Sale (USD): <span className="fw-semibold ms-1">{summary.usd}</span>
          </span>

          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2" style={{ borderRadius: 999 }}>
            <i className="bi bi-currency-rupee me-2" />
            Sale (INR): <span className="fw-semibold ms-1">{summary.inr}</span>
          </span>

          <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2" style={{ borderRadius: 999 }}>
            <i className="bi bi-percent me-2" />
            Brokerage: <span className="fw-semibold ms-1">{summary.bro}</span>
          </span>
        </div>

        <div className="text-muted small">
          <i className="bi bi-lightning-charge me-2" />
          Amounts update automatically as you type.
        </div>
      </div>

      {/* Section: Parties */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(14,165,233,0.10)" }}>
            <i className="bi bi-people text-info" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Parties</div>
            <div className="text-muted small">Select diamond, client and optional broker</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="diamond_id" className="form-label fw-medium">
              Diamond <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-gem text-muted" />
              </span>
              <select
                id="diamond_id"
                name="diamond_id"
                value={form.diamond_id}
                onChange={handleChange}
                className={selectClass("diamond_id")}
                required
              >
                <option value="">Select Diamond</option>
                {diamonds.map((d) => (
                  <option key={d.id} value={d.id} data-weight={d.weight} data-rap-rate={d.rap_rate}>
                    {d.certificate_number} ({d.shape} {d.weight}ct {d.color}/{d.clarity})
                  </option>
                ))}
              </select>
            </div>
            {hasError("diamond_id") && <div className="invalid-feedback d-block">{validationErrors.diamond_id}</div>}
            {selectedDiamond && (
              <div className="text-muted small mt-2">
                Selected: <span className="fw-semibold">{selectedDiamond.certificate_number}</span>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="client_id" className="form-label fw-medium">
              Client <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-building text-muted" />
              </span>
              <select
                id="client_id"
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                className={selectClass("client_id")}
                required
              >
                <option value="">Select Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>
            {hasError("client_id") && <div className="invalid-feedback d-block">{validationErrors.client_id}</div>}
            {selectedClient && (
              <div className="text-muted small mt-2">
                Selected: <span className="fw-semibold">{selectedClient.company_name}</span>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="broker_id" className="form-label fw-medium">
              Broker <span className="text-muted">(Optional)</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-person-badge text-muted" />
              </span>
              <select id="broker_id" name="broker_id" value={form.broker_id} onChange={handleChange} className="form-select">
                <option value="">Select Broker</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.company_name})
                  </option>
                ))}
              </select>
            </div>
            {selectedBroker && (
              <div className="text-muted small mt-2">
                Selected: <span className="fw-semibold">{selectedBroker.name}</span>
              </div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="status" className="form-label fw-medium">
              Status <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-flag text-muted" />
              </span>
              <select id="status" name="status" value={form.status} onChange={handleChange} className={selectClass("status")} required>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {hasError("status") && <div className="invalid-feedback d-block">{validationErrors.status}</div>}
          </div>
        </div>
      </div>

      {/* Section: Calculation */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(14,165,233,0.10)" }}>
            <i className="bi bi-calculator text-info" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Pricing & Calculations</div>
            <div className="text-muted small">Discount drives totals; INR and brokerage are derived fields</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label fw-medium">Diamond Weight</label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-speedometer2 text-muted" />
              </span>
              <input value={diamondInfo.weight} className="form-control bg-light" readOnly />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-medium">RAP Rate</label>
            <div className="input-group">
              <span className="input-group-text bg-white">$</span>
              <input value={diamondInfo.rap_rate} className="form-control bg-light" readOnly />
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="sale_rap_discount" className="form-label fw-medium">
              Sale RAP Discount (%) <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-percent text-muted" />
              </span>
              <input
                type="number"
                step="0.01"
                id="sale_rap_discount"
                name="sale_rap_discount"
                value={form.sale_rap_discount}
                onChange={handleChange}
                className={controlClass("sale_rap_discount")}
                placeholder="e.g., 35"
                required
              />
            </div>
            {hasError("sale_rap_discount") && <div className="invalid-feedback d-block">{validationErrors.sale_rap_discount}</div>}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-medium">Sale Amount (USD)</label>
            <div className="input-group">
              <span className="input-group-text bg-white">$</span>
              <input value={form.sale_amount} className="form-control bg-light" readOnly />
            </div>
            <div className="text-muted small mt-1">Auto-calculated</div>
          </div>

          <div className="col-md-4">
            <label htmlFor="conversion_rate" className="form-label fw-medium">
              Conversion Rate (USD to INR)
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-arrow-left-right text-muted" />
              </span>
              <input
                type="number"
                step="0.01"
                id="conversion_rate"
                name="conversion_rate"
                value={form.conversion_rate}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g., 83.50"
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label fw-medium">Sale Amount (INR)</label>
            <div className="input-group">
              <span className="input-group-text bg-white">₹</span>
              <input value={form.sale_amount_inr} className="form-control bg-light" readOnly />
            </div>
            <div className="text-muted small mt-1">Auto-calculated</div>
          </div>

          <div className="col-md-4">
            <label htmlFor="brokerage_rate" className="form-label fw-medium">
              Brokerage Rate (%)
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-percent text-muted" />
              </span>
              <input
                type="number"
                step="0.01"
                id="brokerage_rate"
                name="brokerage_rate"
                value={form.brokerage_rate}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g., 1.0"
              />
            </div>
          </div>

          <div className="col-md-4">
            <label className="form-label fw-medium">Brokerage Amount (USD)</label>
            <div className="input-group">
              <span className="input-group-text bg-white">$</span>
              <input value={form.brokerage_amount} className="form-control bg-light" readOnly />
            </div>
            <div className="text-muted small mt-1">Auto-calculated</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(108,117,125,0.12)" }}>
            <i className="bi bi-journal-text text-secondary" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Notes</div>
            <div className="text-muted small">Optional internal notes for this sale</div>
          </div>
        </div>

        <div className="input-group">
          <span className="input-group-text bg-white align-items-start pt-2">
            <i className="bi bi-sticky text-muted" />
          </span>
          <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} className="form-control" rows={3} placeholder="Add any notes (optional)" />
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
        <div className="text-muted small">
          <i className="bi bi-shield-check me-2" />
          Values are calculated automatically and saved securely.
        </div>

        <div className="d-flex gap-2">
          <Link href="/sales" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
            <i className="bi bi-x-lg me-2" />
            Cancel
          </Link>

          <button type="submit" className="btn btn-info text-white px-4" style={{ borderRadius: 10 }} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2" />
                {submitButtonText}
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .input-group-text {
          border-color: rgba(0, 0, 0, 0.08) !important;
        }
        .form-control,
        .form-select {
          border-color: rgba(0, 0, 0, 0.08) !important;
          border-radius: 12px;
        }
        .input-group .form-control,
        .input-group .form-select {
          border-left: 0 !important;
        }
        .input-group .input-group-text {
          border-radius: 12px 0 0 12px;
        }
        .input-group .form-control,
        .input-group textarea,
        .input-group .form-select {
          border-radius: 0 12px 12px 0;
        }
        .form-control:focus,
        .form-select:focus {
          box-shadow: 0 0 0 0.2rem rgba(14, 165, 233, 0.15) !important;
          border-color: rgba(14, 165, 233, 0.35) !important;
        }
        .btn:focus {
          box-shadow: none !important;
        }
      `}</style>
    </form>
  );
}