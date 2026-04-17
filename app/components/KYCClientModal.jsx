// app/components/KYCClientModal.jsx
"use client";

import { useState } from "react";

/**
 * KYCClientModal
 * Full KYC client creation form — same fields and validation as ClientsForm.jsx —
 * presented inside a large scrollable modal overlay.
 *
 * Props:
 *   show      – boolean to show/hide
 *   onClose   – called when the user cancels
 *   onSuccess – called with the newly-created client object after save
 */
export default function KYCClientModal({ show, onClose, onSuccess }) {
  const EMPTY_FORM = {
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    owner_name: "",
    reg_address: "",
    bdb_address: "",
    organisation_nature: "",
    nature_of_business: "",
    gst_no: "",
    udyam_reg: "",
    pan_no: "",
    bank_name: "",
    branch: "",
    bank_address: "",
    account_type: "",
    account_number: "",
    ifsc_code: "",
    password: "",
    confirm_password: "",
  };

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  if (!show) return null;

  const setField = (name, value) => {
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const handleUppercaseBlur = (e) => {
    const { name, value } = e.target;
    if (!value) return;
    setField(name, value.toUpperCase());
  };

  const copyRegToBdb = () => setField("bdb_address", form.reg_address || "");

  const hasError = (field) => Boolean(validationErrors[field]);
  const controlClass = (field) => `form-control ${hasError(field) ? "is-invalid" : ""}`;
  const selectClass  = (field) => `form-select ${hasError(field) ? "is-invalid" : ""}`;

  const validateForm = () => {
    const errors = {};

    if (!form.company_name.trim())  errors.company_name  = "Company name is required";
    if (!form.contact_name.trim())  errors.contact_name  = "Contact name is required";
    if (!form.email.trim())         errors.email         = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errors.email = "Please enter a valid email address";
    if (!form.owner_name.trim())    errors.owner_name    = "Owner name is required";

    // Password
    if (!form.password)             errors.password         = "Password is required for new clients";
    if (form.password && form.password.length < 6)
      errors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm_password)
      errors.confirm_password = "Passwords do not match";
    if (!form.confirm_password)     errors.confirm_password = "Confirm Password is required";

    // Bank
    if (!form.bank_name.trim())     errors.bank_name     = "Bank name is required";
    if (!form.branch.trim())        errors.branch        = "Branch is required";
    if (!form.bank_address.trim())  errors.bank_address  = "Bank address is required";
    if (!form.account_type.trim())  errors.account_type  = "Account type is required";
    if (!form.account_number.trim()) errors.account_number = "Account number is required";
    if (!form.ifsc_code.trim())     errors.ifsc_code     = "IFSC code is required";
    else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc_code.toUpperCase()))
      errors.ifsc_code = "Please enter a valid IFSC code";

    // Optional validations
    if (form.gst_no && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gst_no.toUpperCase()))
      errors.gst_no = "Please enter a valid GST number";
    if (form.pan_no && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan_no.toUpperCase()))
      errors.pan_no = "Please enter a valid PAN number";

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
        company_name:        form.company_name.trim(),
        contact_name:        form.contact_name.trim(),
        email:               form.email.trim(),
        phone:               form.phone.trim() || null,
        owner_name:          form.owner_name.trim(),
        reg_address:         form.reg_address.trim() || null,
        bdb_address:         form.bdb_address.trim() || null,
        organisation_nature: form.organisation_nature.trim() || null,
        nature_of_business:  form.nature_of_business.trim() || null,
        gst_no:              form.gst_no ? form.gst_no.trim().toUpperCase() : null,
        udyam_reg:           form.udyam_reg.trim() || null,
        pan_no:              form.pan_no ? form.pan_no.trim().toUpperCase() : null,
        bank_name:           form.bank_name.trim(),
        branch:              form.branch.trim(),
        bank_address:        form.bank_address.trim(),
        account_type:        form.account_type.trim(),
        account_number:      form.account_number.trim(),
        ifsc_code:           form.ifsc_code.trim().toUpperCase(),
        password:            form.password,
        confirm_password:    form.confirm_password,
      };

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create client");
      }

      const created = await res.json();
      onSuccess(created);
      // Reset form
      setForm(EMPTY_FORM);
      setValidationErrors({});
      setError("");
    } catch (err) {
      setError(err.message || "Error saving client");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setValidationErrors({});
    setError("");
    onClose();
  };

  return (
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1060 }}
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" style={{ borderRadius: 20 }}>

          {/* HEADER */}
          <div
            className="modal-header border-0 px-4 py-3"
            style={{ background: "linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)", borderRadius: "20px 20px 0 0" }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 40, height: 40, backgroundColor: "rgba(255,255,255,0.12)" }}
              >
                <i className="bi bi-person-vcard-fill text-white" style={{ fontSize: "1.1rem" }} />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0">Add New KYC Client</h5>
                <div className="text-white-50 small">Complete KYC registration — same as the Clients page</div>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={handleClose} />
          </div>

          {/* BODY */}
          <div className="modal-body p-4" style={{ background: "#f8f9fc" }}>

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger border-0 shadow-sm d-flex align-items-start mb-4" style={{ borderRadius: 14 }}>
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

            <form onSubmit={handleSubmit} noValidate id="kyc-client-modal-form">

              {/* ── BASIC INFORMATION ── */}
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center" style={{ borderRadius: "16px 16px 0 0" }}>
                  <i className="bi bi-person-lines-fill me-2 text-dark opacity-50" />
                  <span className="fw-semibold">Basic Information</span>
                  <span className="ms-auto badge bg-dark bg-opacity-10 text-dark border border-secondary border-opacity-25">Required</span>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Company Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-building text-muted" /></span>
                        <input name="company_name" value={form.company_name} onChange={handleChange}
                          className={controlClass("company_name")} placeholder="Company / Firm name" required />
                      </div>
                      {hasError("company_name") && <div className="invalid-feedback d-block">{validationErrors.company_name}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Contact Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-person text-muted" /></span>
                        <input name="contact_name" value={form.contact_name} onChange={handleChange}
                          className={controlClass("contact_name")} placeholder="Primary contact person" required />
                      </div>
                      {hasError("contact_name") && <div className="invalid-feedback d-block">{validationErrors.contact_name}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Email <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-envelope text-muted" /></span>
                        <input type="email" name="email" value={form.email} onChange={handleChange}
                          className={controlClass("email")} placeholder="name@company.com" autoComplete="off" required />
                      </div>
                      {hasError("email") && <div className="invalid-feedback d-block">{validationErrors.email}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Phone</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-telephone text-muted" /></span>
                        <input name="phone" value={form.phone} onChange={handleChange}
                          className={controlClass("phone")} placeholder="Phone number" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Owner Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-person-badge text-muted" /></span>
                        <input name="owner_name" value={form.owner_name} onChange={handleChange}
                          className={controlClass("owner_name")} placeholder="Owner / Proprietor name" required />
                      </div>
                      {hasError("owner_name") && <div className="invalid-feedback d-block">{validationErrors.owner_name}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Password <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-lock text-muted" /></span>
                        <input type="password" name="password" value={form.password} onChange={handleChange}
                          className={controlClass("password")} placeholder="Set password" autoComplete="new-password"
                          required minLength={6} />
                      </div>
                      {hasError("password") && <div className="invalid-feedback d-block">{validationErrors.password}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Confirm Password <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-lock-fill text-muted" /></span>
                        <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange}
                          className={controlClass("confirm_password")} placeholder="Confirm password" required />
                      </div>
                      {hasError("confirm_password") && <div className="invalid-feedback d-block">{validationErrors.confirm_password}</div>}
                    </div>

                  </div>
                </div>
              </div>

              {/* ── ADDRESS ── */}
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center" style={{ borderRadius: "16px 16px 0 0" }}>
                  <i className="bi bi-geo-alt me-2 text-dark opacity-50" />
                  <span className="fw-semibold">Address Information</span>
                  <span className="ms-auto text-muted small">Optional</span>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Registered Address</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white align-items-start pt-2"><i className="bi bi-geo-alt text-muted" /></span>
                        <textarea name="reg_address" value={form.reg_address} onChange={handleChange}
                          className={controlClass("reg_address")} rows={3} placeholder="Registered address (optional)" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-medium mb-0">BDB Address</label>
                        <button type="button" className="btn btn-sm btn-outline-dark" onClick={copyRegToBdb} style={{ borderRadius: 10 }}>
                          <i className="bi bi-clipboard me-1" /> Copy Registered
                        </button>
                      </div>
                      <div className="input-group">
                        <span className="input-group-text bg-white align-items-start pt-2"><i className="bi bi-pin-map text-muted" /></span>
                        <textarea name="bdb_address" value={form.bdb_address} onChange={handleChange}
                          className={controlClass("bdb_address")} rows={3} placeholder="BDB address (optional)" />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* ── BUSINESS & KYC ── */}
              <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center" style={{ borderRadius: "16px 16px 0 0" }}>
                  <i className="bi bi-briefcase me-2 text-dark opacity-50" />
                  <span className="fw-semibold">Business & KYC</span>
                  <span className="ms-auto text-muted small">Optional</span>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Organisation Nature</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-diagram-3 text-muted" /></span>
                        <input name="organisation_nature" value={form.organisation_nature} onChange={handleChange}
                          className={controlClass("organisation_nature")} placeholder="e.g., Private Ltd, Partnership" />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Nature of Business</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-shop text-muted" /></span>
                        <input name="nature_of_business" value={form.nature_of_business} onChange={handleChange}
                          className={controlClass("nature_of_business")} placeholder="e.g., Trading, Manufacturing" />
                      </div>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium">GST Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-receipt text-muted" /></span>
                        <input name="gst_no" value={form.gst_no} onChange={handleChange} onBlur={handleUppercaseBlur}
                          className={controlClass("gst_no")} maxLength={15} placeholder="22AAAAA0000A1Z5" />
                      </div>
                      {hasError("gst_no") && <div className="invalid-feedback d-block">{validationErrors.gst_no}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium">PAN Number</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-credit-card-2-front text-muted" /></span>
                        <input name="pan_no" value={form.pan_no} onChange={handleChange} onBlur={handleUppercaseBlur}
                          className={controlClass("pan_no")} maxLength={10} placeholder="ABCDE1234F" />
                      </div>
                      {hasError("pan_no") && <div className="invalid-feedback d-block">{validationErrors.pan_no}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium">Udyam Registration</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-patch-check text-muted" /></span>
                        <input name="udyam_reg" value={form.udyam_reg} onChange={handleChange}
                          className={controlClass("udyam_reg")} placeholder="Udyam Registration No." />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* ── BANK DETAILS ── */}
              <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white border-0 py-3 px-4 d-flex align-items-center" style={{ borderRadius: "16px 16px 0 0" }}>
                  <i className="bi bi-bank me-2 text-dark opacity-50" />
                  <span className="fw-semibold">Bank Details</span>
                  <span className="ms-auto badge bg-dark bg-opacity-10 text-dark border border-secondary border-opacity-25">Required</span>
                </div>
                <div className="card-body p-4">
                  <div className="row g-3">

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Bank Name <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-bank text-muted" /></span>
                        <input name="bank_name" value={form.bank_name} onChange={handleChange}
                          className={controlClass("bank_name")} placeholder="Bank name" required />
                      </div>
                      {hasError("bank_name") && <div className="invalid-feedback d-block">{validationErrors.bank_name}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-medium">Branch <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-diagram-2 text-muted" /></span>
                        <input name="branch" value={form.branch} onChange={handleChange}
                          className={controlClass("branch")} placeholder="Branch" required />
                      </div>
                      {hasError("branch") && <div className="invalid-feedback d-block">{validationErrors.branch}</div>}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-medium">Bank Address <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white align-items-start pt-2"><i className="bi bi-geo-alt text-muted" /></span>
                        <textarea name="bank_address" value={form.bank_address} onChange={handleChange}
                          className={controlClass("bank_address")} rows={2} placeholder="Bank address" required />
                      </div>
                      {hasError("bank_address") && <div className="invalid-feedback d-block">{validationErrors.bank_address}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium">Account Type <span className="text-danger">*</span></label>
                      <select name="account_type" value={form.account_type} onChange={handleChange}
                        className={selectClass("account_type")} required>
                        <option value="">Select Account Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                        <option value="Overdraft">Overdraft</option>
                        <option value="Cash Credit">Cash Credit</option>
                      </select>
                      {hasError("account_type") && <div className="invalid-feedback d-block">{validationErrors.account_type}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium">Account Number <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-credit-card text-muted" /></span>
                        <input name="account_number" value={form.account_number} onChange={handleChange}
                          className={controlClass("account_number")} placeholder="Account number" required />
                      </div>
                      {hasError("account_number") && <div className="invalid-feedback d-block">{validationErrors.account_number}</div>}
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-medium">IFSC Code <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-white"><i className="bi bi-hash text-muted" /></span>
                        <input name="ifsc_code" value={form.ifsc_code} onChange={handleChange} onBlur={handleUppercaseBlur}
                          className={controlClass("ifsc_code")} maxLength={11} placeholder="SBIN0001234" required />
                      </div>
                      {hasError("ifsc_code") && <div className="invalid-feedback d-block">{validationErrors.ifsc_code}</div>}
                    </div>

                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-0 px-4 py-3 bg-white" style={{ borderRadius: "0 0 20px 20px" }}>
            <div className="text-muted small me-auto">
              <i className="bi bi-shield-check me-1 text-success" />
              Your data is saved securely.
            </div>
            <button type="button" className="btn btn-outline-secondary px-4" onClick={handleClose} style={{ borderRadius: 10 }}>
              Cancel
            </button>
            <button
              type="submit"
              form="kyc-client-modal-form"
              className="btn btn-success px-5 fw-bold"
              disabled={loading}
              style={{ borderRadius: 10, minWidth: 160 }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2" />
                  Create & Select
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      <style jsx global>{`
        .input-group-text {
          border-color: rgba(0,0,0,0.08) !important;
        }
        #kyc-client-modal-form .form-control,
        #kyc-client-modal-form .form-select {
          border-color: rgba(0,0,0,0.08) !important;
          border-radius: 12px;
        }
        #kyc-client-modal-form .input-group .form-control,
        #kyc-client-modal-form .input-group textarea {
          border-left: 0 !important;
          border-radius: 0 12px 12px 0;
        }
        #kyc-client-modal-form .input-group .input-group-text {
          border-radius: 12px 0 0 12px;
        }
        #kyc-client-modal-form .form-control:focus,
        #kyc-client-modal-form .form-select:focus {
          box-shadow: 0 0 0 0.2rem rgba(0,0,0,0.05) !important;
          border-color: rgba(0,0,0,0.25) !important;
        }
      `}</style>
    </div>
  );
}
