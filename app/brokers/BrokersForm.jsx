// app/brokers/BrokersForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    setForm({ ...form, [name]: value });
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Name is required";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fill in all required fields correctly");
      return;
    }

    setLoading(true);

    try {
      // Prepare data
      const dataToSend = {
        name: form.name.trim(),
        company_name: form.company_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        commission_rate: form.commission_rate ? parseFloat(form.commission_rate) : null,
        tax_number: form.tax_number.trim() || null,
        address: form.address.trim() || null,
        bank_details: form.bank_details.trim() || null,
        notes: form.notes.trim() || null,
      };

      // If onSubmit prop is provided, use it
      if (onSubmit) {
        await onSubmit(dataToSend);
      } else {
        // Default behavior
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

        const data = await res.json();
        router.push(
          `/brokers/show/${data.id}?success=${encodeURIComponent(
            initial.id ? "Broker updated successfully!" : "Broker created successfully!"
          )}`
        );
      }
    } catch (err) {
      setError(err.message || "Error saving broker");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for validation styling
  const hasError = (field) => validationErrors[field];
  const getErrorClass = (field) => (hasError(field) ? "is-invalid" : "");

  return (
    <form onSubmit={handleSubmit}>
      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          {Object.keys(validationErrors).length > 0 && (
            <ul className="mb-0 mt-2">
              {Object.entries(validationErrors).map(([field, msg]) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {/* Row 1: Name & Company Name */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">
                Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`form-control ${getErrorClass("name")}`}
                required
              />
              {hasError("name") && (
                <div className="invalid-feedback">{validationErrors.name}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="company_name" className="form-label">
                Company Name
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                className={`form-control ${getErrorClass("company_name")}`}
              />
              {hasError("company_name") && (
                <div className="invalid-feedback">{validationErrors.company_name}</div>
              )}
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="email" className="form-label">
                Email <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`form-control ${getErrorClass("email")}`}
                required
              />
              {hasError("email") && (
                <div className="invalid-feedback">{validationErrors.email}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="phone" className="form-label">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className={`form-control ${getErrorClass("phone")}`}
              />
              {hasError("phone") && (
                <div className="invalid-feedback">{validationErrors.phone}</div>
              )}
            </div>
          </div>

          {/* Row 3: Commission Rate & Tax Number */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="commission_rate" className="form-label">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                id="commission_rate"
                name="commission_rate"
                value={form.commission_rate}
                onChange={handleChange}
                className={`form-control ${getErrorClass("commission_rate")}`}
                placeholder="e.g., 2.5"
              />
              {hasError("commission_rate") && (
                <div className="invalid-feedback">{validationErrors.commission_rate}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="tax_number" className="form-label">
                Tax Number
              </label>
              <input
                type="text"
                id="tax_number"
                name="tax_number"
                value={form.tax_number}
                onChange={handleChange}
                className={`form-control ${getErrorClass("tax_number")}`}
              />
              {hasError("tax_number") && (
                <div className="invalid-feedback">{validationErrors.tax_number}</div>
              )}
            </div>
          </div>

          {/* Row 4: Address */}
          <div className="row">
            <div className="col-12 mb-3">
              <label htmlFor="address" className="form-label">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                className={`form-control ${getErrorClass("address")}`}
                rows="2"
              />
              {hasError("address") && (
                <div className="invalid-feedback">{validationErrors.address}</div>
              )}
            </div>
          </div>

          {/* Row 5: Bank Details */}
          <div className="row">
            <div className="col-12 mb-3">
              <label htmlFor="bank_details" className="form-label">
                Bank Details
              </label>
              <textarea
                id="bank_details"
                name="bank_details"
                value={form.bank_details}
                onChange={handleChange}
                className={`form-control ${getErrorClass("bank_details")}`}
                rows="2"
              />
              {hasError("bank_details") && (
                <div className="invalid-feedback">{validationErrors.bank_details}</div>
              )}
            </div>
          </div>

          {/* Row 6: Notes */}
          <div className="row">
            <div className="col-12 mb-3">
              <label htmlFor="notes" className="form-label">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className={`form-control ${getErrorClass("notes")}`}
                rows="3"
              />
              {hasError("notes") && (
                <div className="invalid-feedback">{validationErrors.notes}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="mt-4">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Saving...
            </>
          ) : (
            submitButtonText
          )}
        </button>
        <Link href="/brokers" className="btn btn-secondary ms-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}