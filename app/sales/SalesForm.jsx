// app/frontend/sales/form.js
"use client";

import { useEffect, useState } from "react";
import axios from "../lib/bootstrap";
import { useRouter } from "next/navigation";

export default function SalesForm({ initial = {}, onSuccess = () => {} }) {
  const router = useRouter();

  const [form, setForm] = useState({
    diamond_id: initial.diamond_id || "",
    client_id: initial.client_id || "",
    broker_id: initial.broker_id || "",
    status: initial.status || "pending",
    sale_rap_discount: initial.sale_rap_discount ?? "",
    sale_amount: initial.sale_amount ?? "",
    conversion_rate: initial.conversion_rate ?? "",
    sale_amount_inr: initial.sale_amount_inr ?? "",
    brokerage_rate: initial.brokerage_rate ?? "",
    brokerage_amount: initial.brokerage_amount ?? "",
    notes: initial.notes || "",
  });

  const [errors, setErrors] = useState({});
  const [diamonds, setDiamonds] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [selectedDiamondMeta, setSelectedDiamondMeta] = useState({ weight: "", rap_rate: "" });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch selects data
  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      try {
        const [dRes, cRes, bRes] = await Promise.all([
          axios.get("/api/diamonds"),
          axios.get("/api/clients"),
          axios.get("/api/brokers"),
        ]);
        if (!mounted) return;
        // assume API returns array or { data: [...] }
        const d = dRes.data?.data ?? dRes.data ?? [];
        const c = cRes.data?.data ?? cRes.data ?? [];
        const b = bRes.data?.data ?? bRes.data ?? [];
        setDiamonds(d);
        setClients(c);
        setBrokers(b);

        // if initial diamond_id present, set meta
        if (form.diamond_id) {
          const sel = d.find((x) => String(x.id) === String(form.diamond_id));
          if (sel) setSelectedDiamondMeta({ weight: sel.weight, rap_rate: sel.rap_rate });
        }
      } catch (err) {
        console.error("Failed to load sales options", err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selected diamond meta when diamond_id changes
  useEffect(() => {
    const sel = diamonds.find((d) => String(d.id) === String(form.diamond_id));
    if (sel) {
      setSelectedDiamondMeta({ weight: sel.weight ?? "", rap_rate: sel.rap_rate ?? "" });
    } else {
      setSelectedDiamondMeta({ weight: "", rap_rate: "" });
    }
  }, [form.diamond_id, diamonds]);

  // Helper parse/format
  const toNumber = (v) => {
    const n = parseFloat(String(v).replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  };
  const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : "");

  // Calculations: when weight/rap_rate/discount change, update sale_amount
  useEffect(() => {
    calculateSaleAmount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDiamondMeta, form.sale_rap_discount]);

  // Calculate sale amount (USD) = weight * rap_rate * (1 - discount/100)
  function calculateSaleAmount() {
    const weight = toNumber(selectedDiamondMeta.weight);
    const rapRate = toNumber(selectedDiamondMeta.rap_rate);
    const discount = toNumber(form.sale_rap_discount);
    let saleAmount = 0;
    if (weight > 0 && rapRate > 0) {
      saleAmount = weight * rapRate * (1 - discount / 100);
    }
    const saleAmountStr = fmt(saleAmount, 2);
    setForm((f) => ({ ...f, sale_amount: saleAmountStr }));
    calculateSaleAmountInr(saleAmount, form.conversion_rate);
    calculateBrokerageAmount(saleAmount, form.brokerage_rate);
  }

  function calculateSaleAmountInr(saleAmount = null, conversionRate = null) {
    const sa = saleAmount === null ? toNumber(form.sale_amount) : toNumber(saleAmount);
    const conv = conversionRate === null ? toNumber(form.conversion_rate) : toNumber(conversionRate);
    if (conv > 0 && sa > 0) {
      setForm((f) => ({ ...f, sale_amount_inr: fmt(sa * conv, 2) }));
    } else {
      setForm((f) => ({ ...f, sale_amount_inr: "" }));
    }
  }

  function calculateBrokerageAmount(saleAmount = null, brokerageRate = null) {
    const sa = saleAmount === null ? toNumber(form.sale_amount) : toNumber(saleAmount);
    const br = brokerageRate === null ? toNumber(form.brokerage_rate) : toNumber(brokerageRate);
    if (br > 0 && sa > 0) {
      setForm((f) => ({ ...f, brokerage_amount: fmt((sa * br) / 100, 2) }));
    } else {
      setForm((f) => ({ ...f, brokerage_amount: "" }));
    }
  }

  // Inputs handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // live calculations
    if (name === "conversion_rate") {
      calculateSaleAmountInr(null, value);
    } else if (name === "brokerage_rate") {
      calculateBrokerageAmount(null, value);
    } else if (name === "sale_rap_discount") {
      // handled via effect
    }
  };

  // Submit: expects to be used by parent with proper endpoint
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    if (!form.diamond_id || !form.client_id) {
      setErrors({ _global: "Diamond and Client are required." });
      setSubmitting(false);
      return;
    }

    try {
      // parents will call axios; but for convenience we return the form
      await onSuccess(form); // parent will handle POST/PUT
    } catch (err) {
      if (err?.response?.data?.errors) setErrors(err.response.data.errors);
      else setErrors({ _global: "Submission failed." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {errors._global && <div className="alert alert-danger">{errors._global}</div>}

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Diamond</label>
          <select
            name="diamond_id"
            value={form.diamond_id}
            onChange={handleChange}
            className={`form-select ${errors.diamond_id ? "is-invalid" : ""}`}
            required
          >
            <option value="">Select Diamond</option>
            {diamonds.map((d) => (
              <option
                key={d.id}
                value={d.id}
                data-weight={d.weight}
                data-rap-rate={d.rap_rate}
              >
                {d.certificate_number} ({d.shape} {d.weight}ct {d.color}/{d.clarity})
              </option>
            ))}
          </select>
          {errors.diamond_id && <div className="invalid-feedback">{errors.diamond_id[0]}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Client</label>
          <select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            className={`form-select ${errors.client_id ? "is-invalid" : ""}`}
            required
          >
            <option value="">Select Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name} ({c.contact_name})
              </option>
            ))}
          </select>
          {errors.client_id && <div className="invalid-feedback">{errors.client_id[0]}</div>}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-6">
          <label className="form-label">Broker (Optional)</label>
          <select name="broker_id" value={form.broker_id} onChange={handleChange} className={`form-select ${errors.broker_id ? "is-invalid" : ""}`}>
            <option value="">Select Broker</option>
            {brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.company_name})
              </option>
            ))}
          </select>
          {errors.broker_id && <div className="invalid-feedback">{errors.broker_id[0]}</div>}
        </div>

        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={`form-select ${errors.status ? "is-invalid" : ""}`} required>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {errors.status && <div className="invalid-feedback">{errors.status[0]}</div>}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Diamond Weight (carats)</label>
          <input type="text" className="form-control" value={selectedDiamondMeta.weight || ""} readOnly />
        </div>

        <div className="col-md-4">
          <label className="form-label">RAP Rate</label>
          <input type="text" className="form-control" value={selectedDiamondMeta.rap_rate || ""} readOnly />
        </div>

        <div className="col-md-4">
          <label className="form-label">Sale RAP Discount (%)</label>
          <input
            name="sale_rap_discount"
            type="number"
            step="0.01"
            className={`form-control ${errors.sale_rap_discount ? "is-invalid" : ""}`}
            value={form.sale_rap_discount}
            onChange={handleChange}
            required
          />
          {errors.sale_rap_discount && <div className="invalid-feedback">{errors.sale_rap_discount[0]}</div>}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Sale Amount (USD)</label>
          <input name="sale_amount" type="number" step="0.01" className={`form-control ${errors.sale_amount ? "is-invalid" : ""}`} value={form.sale_amount} readOnly />
          {errors.sale_amount && <div className="invalid-feedback">{errors.sale_amount[0]}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label">Conversion Rate (USD to INR)</label>
          <input name="conversion_rate" type="number" step="0.01" className={`form-control ${errors.conversion_rate ? "is-invalid" : ""}`} value={form.conversion_rate} onChange={handleChange} />
          {errors.conversion_rate && <div className="invalid-feedback">{errors.conversion_rate[0]}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label">Sale Amount (INR)</label>
          <input name="sale_amount_inr" type="number" step="0.01" className={`form-control ${errors.sale_amount_inr ? "is-invalid" : ""}`} value={form.sale_amount_inr} readOnly />
          {errors.sale_amount_inr && <div className="invalid-feedback">{errors.sale_amount_inr[0]}</div>}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Brokerage Rate (%)</label>
          <input name="brokerage_rate" type="number" step="0.01" className={`form-control ${errors.brokerage_rate ? "is-invalid" : ""}`} value={form.brokerage_rate} onChange={handleChange} />
          {errors.brokerage_rate && <div className="invalid-feedback">{errors.brokerage_rate[0]}</div>}
        </div>

        <div className="col-md-4">
          <label className="form-label">Brokerage Amount (USD)</label>
          <input name="brokerage_amount" type="number" step="0.01" className={`form-control ${errors.brokerage_amount ? "is-invalid" : ""}`} value={form.brokerage_amount} readOnly />
          {errors.brokerage_amount && <div className="invalid-feedback">{errors.brokerage_amount[0]}</div>}
        </div>
      </div>

      <div className="row mb-3">
        <div className="col-12">
          <label className="form-label">Notes</label>
          <textarea name="notes" className={`form-control ${errors.notes ? "is-invalid" : ""}`} rows="3" value={form.notes} onChange={handleChange} />
          {errors.notes && <div className="invalid-feedback">{errors.notes[0]}</div>}
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : (initial.id ? "Update Sale" : "Create Sale")}
          </button>
          <button type="button" className="btn btn-secondary ms-2" onClick={() => router.push("/frontend/sales/index")}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
