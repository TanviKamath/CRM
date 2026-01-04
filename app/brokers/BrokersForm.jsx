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
    email: initial.email || "",
    phone: initial.phone || "",
    address: initial.address || "",
    native_address: initial.native_address || "",
    broking_since: initial.broking_since || "",
    bdb_id: initial.bdb_id || "",
    aadhaar: initial.aadhaar || "",
    commission_rate: initial.commission_rate || "",
    notes: initial.notes || "",

    bank_name: initial.bank_name || "",
    branch: initial.branch || "",
    bank_address: initial.bank_address || "",
    account_type: initial.account_type || "",
    account_no: initial.account_no || "",
    ifsc_code: initial.ifsc_code || "",
  });

  const [references, setReferences] = useState(
    initial.reference || [{ company_name: "", contact_person: "" }]
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* ---------- Reference (Company + Contact) ---------- */

  const addReference = () => {
    setReferences((prev) => [...prev, { company_name: "", contact_person: "" }]);
  };

  const updateReference = (index, field, value) => {
    setReferences((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const removeReference = (index) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  /* ---------- Validation ---------- */

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) errors.email = "Email is required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ---------- Submit ---------- */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fill required fields.");
      return;
    }

    setLoading(true);

    try {
      const dataToSend = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        address: form.address || null,
        native_address: form.native_address || null,
        broking_since: form.broking_since
          ? parseInt(form.broking_since)
          : null,
        bdb_id: form.bdb_id || null,
        aadhaar: form.aadhaar || null,
        commission_rate:
          form.commission_rate !== ""
            ? parseFloat(form.commission_rate)
            : null,

        reference: references.filter(
          (r) => r.company_name || r.contact_person
        ),

        bank_name: form.bank_name || null,
        branch: form.branch || null,
        bank_address: form.bank_address || null,
        account_type: form.account_type || null,
        account_no: form.account_no || null,
        ifsc_code: form.ifsc_code || null,

        notes: form.notes || null,
      };

      if (onSubmit) {
        await onSubmit(dataToSend);
        return;
      }

      const method = initial.id ? "PUT" : "POST";
      const url = initial.id
        ? `/api/brokers/${initial.id}`
        : `/api/brokers`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) throw new Error("Failed to save broker");

      const saved = await res.json();
      router.push(`/brokers/show/${saved.id}`);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Basic Info */}
      <h5 className="mb-3">Basic Information</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label className="form-label">Name *</label>
          <input
            name="name"
            className="form-control"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Email *</label>
          <input
            name="email"
            type="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input
            name="phone"
            className="form-control"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Aadhaar</label>
          <input
            name="aadhaar"
            className="form-control"
            value={form.aadhaar}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Addresses */}
      <h5 className="mb-3">Address</h5>
      <div className="mb-4">
        <textarea
          name="address"
          className="form-control mb-2"
          placeholder="Current Address"
          value={form.address}
          onChange={handleChange}
        />
        <textarea
          name="native_address"
          className="form-control"
          placeholder="Native Address"
          value={form.native_address}
          onChange={handleChange}
        />
      </div>

      {/* Business */}
      <h5 className="mb-3">Business Details</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <input
            name="broking_since"
            className="form-control"
            placeholder="Broking Since (Years)"
            value={form.broking_since}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <input
            name="bdb_id"
            className="form-control"
            placeholder="BDB ID"
            value={form.bdb_id}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <input
            name="commission_rate"
            className="form-control"
            placeholder="Commission %"
            value={form.commission_rate}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Reference JSON */}
      <h5 className="mb-3">Associated Companies</h5>
      {references.map((ref, i) => (
        <div className="row g-2 mb-2" key={i}>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Company Name"
              value={ref.company_name}
              onChange={(e) =>
                updateReference(i, "company_name", e.target.value)
              }
            />
          </div>
          <div className="col-md-5">
            <input
              className="form-control"
              placeholder="Contact Person"
              value={ref.contact_person}
              onChange={(e) =>
                updateReference(i, "contact_person", e.target.value)
              }
            />
          </div>
          <div className="col-md-2">
            {references.length > 1 && (
              <button
                type="button"
                className="btn btn-outline-danger w-100"
                onClick={() => removeReference(i)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm btn-outline-primary mb-4"
        onClick={addReference}
      >
        + Add Company
      </button>

      {/* Bank */}
      <h5 className="mb-3">Bank Details</h5>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <input
            name="bank_name"
            className="form-control"
            placeholder="Bank Name"
            value={form.bank_name}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <input
            name="branch"
            className="form-control"
            placeholder="Branch"
            value={form.branch}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <input
            name="ifsc_code"
            className="form-control"
            placeholder="IFSC Code"
            value={form.ifsc_code}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <input
            name="account_no"
            className="form-control"
            placeholder="Account Number"
            value={form.account_no}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <input
            name="account_type"
            className="form-control"
            placeholder="Account Type"
            value={form.account_type}
            onChange={handleChange}
          />
        </div>
        <div className="col-12">
          <textarea
            name="bank_address"
            className="form-control"
            placeholder="Bank Address"
            value={form.bank_address}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Notes */}
      <textarea
        name="notes"
        className="form-control mb-4"
        placeholder="Notes"
        value={form.notes}
        onChange={handleChange}
      />

      {/* Actions */}
      <div className="d-flex justify-content-between">
        <Link href="/brokers" className="btn btn-outline-secondary">
          Cancel
        </Link>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : submitButtonText}
        </button>
      </div>
    </form>
  );
}
