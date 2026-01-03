// app/brokers/BrokersForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Modern Brokers Form (Bootstrap + Bootstrap Icons)
 * - Same fields + same submit behavior
 * - Cleaner layout: sections + icon input groups
 * - No extra outer card (your create/edit pages already wrap it)
 */
export default function BrokersForm({
  initial = {},
  submitButtonText = "Save Broker",
  onSubmit,
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial.name || "",
    company_name: initial.company_name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    commission_rate: initial.commission_rate || "",
    tax_number: initial.tax_number || "",
    address: initial.address || "",
    bank_details: initial.bank_details || "",
    notes: initial.notes || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = "Name is required";

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fill in the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: form.name.trim(),
        company_name: form.company_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,

        // accepts "2.5" or "2.5%" as input because parseFloat handles both
        commission_rate:
          form.commission_rate !== "" && form.commission_rate !== null && form.commission_rate !== undefined
            ? (Number.isNaN(parseFloat(form.commission_rate)) ? null : parseFloat(form.commission_rate))
            : null,

        tax_number: form.tax_number.trim() || null,
        address: form.address.trim() || null,
        bank_details: form.bank_details.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (onSubmit) {
        await onSubmit(dataToSend);
        return;
      }

      const method = initial.id ? "PUT" : "POST";
      const url = initial.id ? `/api/brokers/${initial.id}` : `/api/brokers`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const saved = await res.json();
      router.push(
        `/brokers/show/${saved.id}?success=${encodeURIComponent(
          initial.id ? "Broker updated successfully!" : "Broker created successfully!"
        )}`
      );
    } catch (err) {
      setError(err?.message || "Error saving broker");
    } finally {
      setLoading(false);
    }
  };

  const hasError = (field) => Boolean(validationErrors[field]);
  const inputClass = (field) => `form-control ${hasError(field) ? "is-invalid" : ""}`;
  const selectClass = (field) => `form-select ${hasError(field) ? "is-invalid" : ""}`;

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

      {/* Section: Basic */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40, backgroundColor: "rgba(102,126,234,0.10)" }}
          >
            <i className="bi bi-person-vcard text-primary" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Basic Information</div>
            <div className="text-muted small">Required fields: Name and Email</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="name" className="form-label fw-medium">
              Name <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-person text-muted" />
              </span>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass("name")}
                placeholder="Broker full name"
                required
              />
            </div>
            {hasError("name") && <div className="invalid-feedback d-block">{validationErrors.name}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="company_name" className="form-label fw-medium">
              Company Name
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-building text-muted" />
              </span>
              <input
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                className={inputClass("company_name")}
                placeholder="Company / Firm (optional)"
              />
            </div>
            {hasError("company_name") && <div className="invalid-feedback d-block">{validationErrors.company_name}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="email" className="form-label fw-medium">
              Email <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-envelope text-muted" />
              </span>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={inputClass("email")}
                placeholder="name@company.com"
                required
              />
            </div>
            {hasError("email") && <div className="invalid-feedback d-block">{validationErrors.email}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="phone" className="form-label fw-medium">
              Phone
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-telephone text-muted" />
              </span>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={inputClass("phone")}
                placeholder="Phone (optional)"
              />
            </div>
            {hasError("phone") && <div className="invalid-feedback d-block">{validationErrors.phone}</div>}
          </div>
        </div>
      </div>

      {/* Section: Business */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40, backgroundColor: "rgba(245,158,11,0.12)" }}
          >
            <i className="bi bi-briefcase text-warning" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Business Details</div>
            <div className="text-muted small">Commission, tax and payment information</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label htmlFor="commission_rate" className="form-label fw-medium">
              Commission Rate
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-percent text-muted" />
              </span>
              <input
                id="commission_rate"
                name="commission_rate"
                value={form.commission_rate}
                onChange={handleChange}
                className={inputClass("commission_rate")}
                placeholder="e.g., 2.5 or 2.5%"
                inputMode="decimal"
              />
            </div>
            <div className="form-text">You can type 2.5 or 2.5%.</div>
            {hasError("commission_rate") && (
              <div className="invalid-feedback d-block">{validationErrors.commission_rate}</div>
            )}
          </div>

          <div className="col-md-6">
            <label htmlFor="tax_number" className="form-label fw-medium">
              Tax Number
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-receipt text-muted" />
              </span>
              <input
                id="tax_number"
                name="tax_number"
                value={form.tax_number}
                onChange={handleChange}
                className={inputClass("tax_number")}
                placeholder="GST / PAN / VAT (optional)"
              />
            </div>
            {hasError("tax_number") && <div className="invalid-feedback d-block">{validationErrors.tax_number}</div>}
          </div>

          <div className="col-12">
            <label htmlFor="address" className="form-label fw-medium">
              Address
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white align-items-start pt-2">
                <i className="bi bi-geo-alt text-muted" />
              </span>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                className={inputClass("address")}
                rows={2}
                placeholder="Address (optional)"
              />
            </div>
            {hasError("address") && <div className="invalid-feedback d-block">{validationErrors.address}</div>}
          </div>

          <div className="col-12">
            <label htmlFor="bank_details" className="form-label fw-medium">
              Bank Details
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white align-items-start pt-2">
                <i className="bi bi-bank text-muted" />
              </span>
              <textarea
                id="bank_details"
                name="bank_details"
                value={form.bank_details}
                onChange={handleChange}
                className={inputClass("bank_details")}
                rows={2}
                placeholder="Account name, number, IFSC, bank name (optional)"
              />
            </div>
            {hasError("bank_details") && <div className="invalid-feedback d-block">{validationErrors.bank_details}</div>}
          </div>
        </div>
      </div>

      {/* Section: Notes */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40, backgroundColor: "rgba(108,117,125,0.12)" }}
          >
            <i className="bi bi-journal-text text-secondary" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Notes</div>
            <div className="text-muted small">Optional internal notes about the broker</div>
          </div>
        </div>

        <div className="input-group">
          <span className="input-group-text bg-white align-items-start pt-2">
            <i className="bi bi-sticky text-muted" />
          </span>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className={inputClass("notes")}
            rows={3}
            placeholder="Add any important notes (optional)"
          />
        </div>
        {hasError("notes") && <div className="invalid-feedback d-block">{validationErrors.notes}</div>}
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2">
        <div className="text-muted small">
          <i className="bi bi-shield-check me-2" />
          Your data is saved securely.
        </div>

        <div className="d-flex gap-2">
          <Link href="/brokers" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
            <i className="bi bi-x-lg me-2" />
            Cancel
          </Link>

          <button type="submit" className="btn btn-primary px-4" style={{ borderRadius: 10 }} disabled={loading}>
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
        .input-group textarea {
          border-radius: 0 12px 12px 0;
        }
        .form-control:focus,
        .form-select:focus {
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.15) !important;
          border-color: rgba(102, 126, 234, 0.35) !important;
        }
        .btn:focus {
          box-shadow: none !important;
        }
      `}</style>
    </form>
  );
}