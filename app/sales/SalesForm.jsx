// app/sales/SalesForm.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

  // Diamond info (readonly display fields)
  const [diamondInfo, setDiamondInfo] = useState({
    weight: "",
    rap_rate: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Get selected diamond data
  const getSelectedDiamond = useCallback(() => {
    if (!form.diamond_id) return null;
    return diamonds.find((d) => d.id.toString() === form.diamond_id.toString());
  }, [form.diamond_id, diamonds]);

  // Update diamond info when diamond changes
  useEffect(() => {
    const diamond = getSelectedDiamond();
    if (diamond) {
      setDiamondInfo({
        weight: diamond.weight || "",
        rap_rate: diamond.rap_rate || "",
      });
      // Recalculate sale amount
      calculateSaleAmount(diamond.weight, diamond.rap_rate, form.sale_rap_discount);
    } else {
      setDiamondInfo({ weight: "", rap_rate: "" });
    }
  }, [form.diamond_id, diamonds]);

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

  // Calculate sale amount INR
  const calculateSaleAmountInr = useCallback((saleAmount, conversionRate) => {
    const amount = parseFloat(saleAmount) || 0;
    const rate = parseFloat(conversionRate) || 0;

    if (rate > 0) {
      return (amount * rate).toFixed(2);
    }
    return "";
  }, []);

  // Calculate brokerage amount
  const calculateBrokerageAmount = useCallback((saleAmount, brokerageRate) => {
    const amount = parseFloat(saleAmount) || 0;
    const rate = parseFloat(brokerageRate) || 0;

    if (rate > 0) {
      return (amount * (rate / 100)).toFixed(2);
    }
    return "";
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    const updatedForm = { ...form, [name]: value };

    // Recalculate based on which field changed
    if (name === "sale_rap_discount") {
      const diamond = getSelectedDiamond();
      if (diamond) {
        const w = parseFloat(diamond.weight) || 0;
        const r = parseFloat(diamond.rap_rate) || 0;
        const d = parseFloat(value) || 0;
        const saleAmount = w * r * (1 - d / 100);
        updatedForm.sale_amount = saleAmount > 0 ? saleAmount.toFixed(2) : "";
        updatedForm.sale_amount_inr = calculateSaleAmountInr(saleAmount, updatedForm.conversion_rate);
        updatedForm.brokerage_amount = calculateBrokerageAmount(saleAmount, updatedForm.brokerage_rate);
      }
    }

    if (name === "conversion_rate") {
      updatedForm.sale_amount_inr = calculateSaleAmountInr(updatedForm.sale_amount, value);
    }

    if (name === "brokerage_rate") {
      updatedForm.brokerage_amount = calculateBrokerageAmount(updatedForm.sale_amount, value);
    }

    setForm(updatedForm);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!form.diamond_id) errors.diamond_id = "Diamond is required";
    if (!form.client_id) errors.client_id = "Client is required";
    if (!form.status) errors.status = "Status is required";
    if (!form.sale_rap_discount && form.sale_rap_discount !== 0) {
      errors.sale_rap_discount = "Sale RAP Discount is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Prepare data
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

  const hasError = (field) => validationErrors[field];
  const getErrorClass = (field) => (hasError(field) ? "is-invalid" : "");

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger">
          {error}
          {Object.keys(validationErrors).length > 0 && (
            <ul className="mb-0 mt-2">
              {Object.entries(validationErrors).map(([field, msg]) => (
                <li key={field}>{msg}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Diamond & Client Selection */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="diamond_id" className="form-label">
            Diamond <span className="text-danger">*</span>
          </label>
          <select
            id="diamond_id"
            name="diamond_id"
            value={form.diamond_id}
            onChange={handleChange}
            className={`form-select ${getErrorClass("diamond_id")}`}
            required
          >
            <option value="">Select Diamond</option>
            {diamonds.map((diamond) => (
              <option
                key={diamond.id}
                value={diamond.id}
                data-weight={diamond.weight}
                data-rap-rate={diamond.rap_rate}
              >
                {diamond.certificate_number} ({diamond.shape} {diamond.weight}ct{" "}
                {diamond.color}/{diamond.clarity})
              </option>
            ))}
          </select>
          {hasError("diamond_id") && (
            <div className="invalid-feedback">{validationErrors.diamond_id}</div>
          )}
        </div>

        <div className="col-md-6">
          <label htmlFor="client_id" className="form-label">
            Client <span className="text-danger">*</span>
          </label>
          <select
            id="client_id"
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            className={`form-select ${getErrorClass("client_id")}`}
            required
          >
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company_name} ({client.contact_name})
              </option>
            ))}
          </select>
          {hasError("client_id") && (
            <div className="invalid-feedback">{validationErrors.client_id}</div>
          )}
        </div>
      </div>

      {/* Broker & Status */}
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="broker_id" className="form-label">
            Broker (Optional)
          </label>
          <select
            id="broker_id"
            name="broker_id"
            value={form.broker_id}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select Broker</option>
            {brokers.map((broker) => (
              <option key={broker.id} value={broker.id}>
                {broker.name} ({broker.company_name})
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label htmlFor="status" className="form-label">
            Status <span className="text-danger">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={form.status}
            onChange={handleChange}
            className={`form-select ${getErrorClass("status")}`}
            required
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {hasError("status") && (
            <div className="invalid-feedback">{validationErrors.status}</div>
          )}
        </div>
      </div>

      {/* Diamond Info & RAP Discount */}
      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="diamond_weight" className="form-label">
            Diamond Weight (carats)
          </label>
          <input
            type="text"
            id="diamond_weight"
            value={diamondInfo.weight}
            className="form-control bg-light"
            readOnly
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="rap_rate" className="form-label">
            RAP Rate
          </label>
          <input
            type="text"
            id="rap_rate"
            value={diamondInfo.rap_rate}
            className="form-control bg-light"
            readOnly
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="sale_rap_discount" className="form-label">
            Sale RAP Discount (%) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            id="sale_rap_discount"
            name="sale_rap_discount"
            value={form.sale_rap_discount}
            onChange={handleChange}
            className={`form-control ${getErrorClass("sale_rap_discount")}`}
            required
          />
          {hasError("sale_rap_discount") && (
            <div className="invalid-feedback">{validationErrors.sale_rap_discount}</div>
          )}
        </div>
      </div>

      {/* Sale Amounts */}
      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="sale_amount" className="form-label">
            Sale Amount (USD)
          </label>
          <input
            type="number"
            step="0.01"
            id="sale_amount"
            name="sale_amount"
            value={form.sale_amount}
            className="form-control bg-light"
            readOnly
          />
          {/* <small className="text-muted">Auto-calculated</small> */}
        </div>

        <div className="col-md-4">
          <label htmlFor="conversion_rate" className="form-label">
            Conversion Rate (USD to INR)
          </label>
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

        <div className="col-md-4">
          <label htmlFor="sale_amount_inr" className="form-label">
            Sale Amount (INR)
          </label>
          <input
            type="number"
            step="0.01"
            id="sale_amount_inr"
            name="sale_amount_inr"
            value={form.sale_amount_inr}
            className="form-control bg-light"
            readOnly
          />
          <small className="text-muted">Auto-calculated</small>
        </div>
      </div>

      {/* Brokerage */}
      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="brokerage_rate" className="form-label">
            Brokerage Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            id="brokerage_rate"
            name="brokerage_rate"
            value={form.brokerage_rate}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="col-md-4">
          <label htmlFor="brokerage_amount" className="form-label">
            Brokerage Amount (USD)
          </label>
          <input
            type="number"
            step="0.01"
            id="brokerage_amount"
            name="brokerage_amount"
            value={form.brokerage_amount}
            className="form-control bg-light"
            readOnly
          />
          <small className="text-muted">Auto-calculated</small>
        </div>
      </div>

      {/* Notes */}
      <div className="row mb-3">
        <div className="col-md-12">
          <label htmlFor="notes" className="form-label">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="form-control"
            rows="3"
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="row">
        <div className="col-12">
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
          <Link href="/sales" className="btn btn-secondary ms-2">
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}