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
    owner_name: initial.owner_name || "",
    reg_address: initial.reg_address || "",
    bdb_address: initial.bdb_address || "",
    organisation_nature: initial.organisation_nature || "",
    gst_no: initial.gst_no || "",
    udyam_reg: initial.udyam_reg || "",
    pan_no: initial.pan_no || "",
    nature_of_business: initial.nature_of_business || "",
    bank_name: initial.bank_name || "",
    branch: initial.branch || "",
    bank_address: initial.bank_address || "",
    account_type: initial.account_type || "",
    account_number: initial.account_number || "",
    ifsc_code: initial.ifsc_code || "",
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

    // Required fields
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

    if (!form.owner_name.trim()) {
      errors.owner_name = "Owner name is required";
    }

    // Bank details - all required
    if (!form.bank_name.trim()) {
      errors.bank_name = "Bank name is required";
    }

    if (!form.branch.trim()) {
      errors.branch = "Branch is required";
    }

    if (!form.bank_address.trim()) {
      errors.bank_address = "Bank address is required";
    }

    if (!form.account_type.trim()) {
      errors.account_type = "Account type is required";
    }

    if (!form.account_number.trim()) {
      errors.account_number = "Account number is required";
    }

    if (!form.ifsc_code.trim()) {
      errors.ifsc_code = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code.toUpperCase())) {
      errors.ifsc_code = "Please enter a valid IFSC code";
    }

    // Optional field validations
    if (form.gst_no && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gst_no.toUpperCase())) {
      errors.gst_no = "Please enter a valid GST number";
    }

    if (form.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan_no.toUpperCase())) {
      errors.pan_no = "Please enter a valid PAN number";
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
        owner_name: form.owner_name.trim(),
        reg_address: form.reg_address.trim() || null,
        bdb_address: form.bdb_address.trim() || null,
        organisation_nature: form.organisation_nature.trim() || null,
        gst_no: form.gst_no.trim().toUpperCase() || null,
        udyam_reg: form.udyam_reg.trim() || null,
        pan_no: form.pan_no.trim().toUpperCase() || null,
        nature_of_business: form.nature_of_business.trim() || null,
        bank_name: form.bank_name.trim(),
        branch: form.branch.trim(),
        bank_address: form.bank_address.trim(),
        account_type: form.account_type.trim(),
        account_number: form.account_number.trim(),
        ifsc_code: form.ifsc_code.trim().toUpperCase(),
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

      {/* Basic Information Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Basic Information</h5>
        </div>
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

          {/* Row 3: Owner Name */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="owner_name" className="form-label">
                Owner Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="owner_name"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                className={`form-control ${getErrorClass("owner_name")}`}
                required
              />
              {hasError("owner_name") && (
                <div className="invalid-feedback">{validationErrors.owner_name}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Address Information</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="reg_address" className="form-label">
                Registered Address
              </label>
              <textarea
                id="reg_address"
                name="reg_address"
                value={form.reg_address}
                onChange={handleChange}
                className={`form-control ${getErrorClass("reg_address")}`}
                rows="3"
              />
              {hasError("reg_address") && (
                <div className="invalid-feedback">{validationErrors.reg_address}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="bdb_address" className="form-label">
                BDB Address
              </label>
              <textarea
                id="bdb_address"
                name="bdb_address"
                value={form.bdb_address}
                onChange={handleChange}
                className={`form-control ${getErrorClass("bdb_address")}`}
                rows="3"
              />
              {hasError("bdb_address") && (
                <div className="invalid-feedback">{validationErrors.bdb_address}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business Information Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Business Information</h5>
        </div>
        <div className="card-body">
          {/* Row 1: Organisation Nature & Nature of Business */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="organisation_nature" className="form-label">
                Organisation Nature
              </label>
              <input
                type="text"
                id="organisation_nature"
                name="organisation_nature"
                value={form.organisation_nature}
                onChange={handleChange}
                className={`form-control ${getErrorClass("organisation_nature")}`}
                placeholder="e.g., Private Limited, Partnership, Proprietorship"
              />
              {hasError("organisation_nature") && (
                <div className="invalid-feedback">{validationErrors.organisation_nature}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="nature_of_business" className="form-label">
                Nature of Business
              </label>
              <input
                type="text"
                id="nature_of_business"
                name="nature_of_business"
                value={form.nature_of_business}
                onChange={handleChange}
                className={`form-control ${getErrorClass("nature_of_business")}`}
                placeholder="e.g., Manufacturing, Trading, Services"
              />
              {hasError("nature_of_business") && (
                <div className="invalid-feedback">{validationErrors.nature_of_business}</div>
              )}
            </div>
          </div>

          {/* Row 2: GST & PAN */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="gst_no" className="form-label">
                GST Number
              </label>
              <input
                type="text"
                id="gst_no"
                name="gst_no"
                value={form.gst_no}
                onChange={handleChange}
                className={`form-control ${getErrorClass("gst_no")}`}
                maxLength="15"
                placeholder="e.g., 22AAAAA0000A1Z5"
              />
              {hasError("gst_no") && (
                <div className="invalid-feedback">{validationErrors.gst_no}</div>
              )}
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="pan_no" className="form-label">
                PAN Number
              </label>
              <input
                type="text"
                id="pan_no"
                name="pan_no"
                value={form.pan_no}
                onChange={handleChange}
                className={`form-control ${getErrorClass("pan_no")}`}
                maxLength="10"
                placeholder="e.g., ABCDE1234F"
              />
              {hasError("pan_no") && (
                <div className="invalid-feedback">{validationErrors.pan_no}</div>
              )}
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="udyam_reg" className="form-label">
                Udyam Registration
              </label>
              <input
                type="text"
                id="udyam_reg"
                name="udyam_reg"
                value={form.udyam_reg}
                onChange={handleChange}
                className={`form-control ${getErrorClass("udyam_reg")}`}
                placeholder="Udyam Registration Number"
              />
              {hasError("udyam_reg") && (
                <div className="invalid-feedback">{validationErrors.udyam_reg}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Section */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Bank Details</h5>
        </div>
        <div className="card-body">
          {/* Row 1: Bank Name & Branch */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="bank_name" className="form-label">
                Bank Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="bank_name"
                name="bank_name"
                value={form.bank_name}
                onChange={handleChange}
                className={`form-control ${getErrorClass("bank_name")}`}
                required
              />
              {hasError("bank_name") && (
                <div className="invalid-feedback">{validationErrors.bank_name}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="branch" className="form-label">
                Branch <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="branch"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className={`form-control ${getErrorClass("branch")}`}
                required
              />
              {hasError("branch") && (
                <div className="invalid-feedback">{validationErrors.branch}</div>
              )}
            </div>
          </div>

          {/* Row 2: Bank Address */}
          <div className="row">
            <div className="col-12 mb-3">
              <label htmlFor="bank_address" className="form-label">
                Bank Address <span className="text-danger">*</span>
              </label>
              <textarea
                id="bank_address"
                name="bank_address"
                value={form.bank_address}
                onChange={handleChange}
                className={`form-control ${getErrorClass("bank_address")}`}
                rows="2"
                required
              />
              {hasError("bank_address") && (
                <div className="invalid-feedback">{validationErrors.bank_address}</div>
              )}
            </div>
          </div>

          {/* Row 3: Account Type, Account Number & IFSC */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="account_type" className="form-label">
                Account Type <span className="text-danger">*</span>
              </label>
              <select
                id="account_type"
                name="account_type"
                value={form.account_type}
                onChange={handleChange}
                className={`form-select ${getErrorClass("account_type")}`}
                required
              >
                <option value="">Select Account Type</option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
                <option value="Overdraft">Overdraft</option>
                <option value="Cash Credit">Cash Credit</option>
              </select>
              {hasError("account_type") && (
                <div className="invalid-feedback">{validationErrors.account_type}</div>
              )}
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="account_number" className="form-label">
                Account Number <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="account_number"
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                className={`form-control ${getErrorClass("account_number")}`}
                required
              />
              {hasError("account_number") && (
                <div className="invalid-feedback">{validationErrors.account_number}</div>
              )}
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="ifsc_code" className="form-label">
                IFSC Code <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                id="ifsc_code"
                name="ifsc_code"
                value={form.ifsc_code}
                onChange={handleChange}
                className={`form-control ${getErrorClass("ifsc_code")}`}
                maxLength="11"
                placeholder="e.g., SBIN0001234"
                required
              />
              {hasError("ifsc_code") && (
                <div className="invalid-feedback">{validationErrors.ifsc_code}</div>
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