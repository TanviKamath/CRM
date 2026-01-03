// app/clients/ClientsForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientsForm({ 
  initial = {}, 
  submitButtonText = "Save Client",
  onSubmit 
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    company_name: initial.company_name || "",
    contact_name: initial.contact_name || "",
    email: initial.email || "",
    phone: initial.phone || "",
    address: initial.address || "",
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

    if (!form.company_name.trim()) {
      errors.company_name = "Company name is required";
    }

    if (!form.contact_name.trim()) {
      errors.contact_name = "Contact name is required";
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
        company_name: form.company_name.trim(),
        contact_name: form.contact_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };

      // If onSubmit prop is provided, use it
      if (onSubmit) {
        await onSubmit(dataToSend);
      } else {
        // Default behavior
        const method = initial.id ? "PUT" : "POST";
        const url = initial.id ? `/api/clients/${initial.id}` : `/api/clients`;

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
        router.push(`/clients/show/${data.id}?success=${encodeURIComponent(initial.id ? "Client updated successfully!" : "Client created successfully!")}`);
      }
    } catch (err) {
      setError(err.message || "Error saving client");
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
          {/* Row 1: Company Name & Contact Name */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="company_name" className="form-label">
                Company Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                className={`form-control ${getErrorClass("company_name")}`}
                required
              />
              {hasError("company_name") && (
                <div className="invalid-feedback">{validationErrors.company_name}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="contact_name" className="form-label">
                Contact Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                className={`form-control ${getErrorClass("contact_name")}`}
                required
              />
              {hasError("contact_name") && (
                <div className="invalid-feedback">{validationErrors.contact_name}</div>
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

          {/* Row 3: Address */}
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
                rows="3"
              />
              {hasError("address") && (
                <div className="invalid-feedback">{validationErrors.address}</div>
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
        <Link href="/clients" className="btn btn-secondary ms-2">
          Cancel
        </Link>
      </div>
    </form>
  );
}