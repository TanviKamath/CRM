// app/sales/SalesForm.jsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import QuickAddEntityModal from "../components/QuickAddEntityModal";

export default function SalesForm({
  user,
  initial = {},
  diamonds = [],
  clients = [],
  brokers = [],
  preSelectedDiamondId = "",
  submitButtonText = "Create Sale",
  onSubmit,
}) {
  const [form, setForm] = useState({
    diamond_id: (user?.client_type === "Loose" ? initial.loose_diamond_item_id : initial.diamond_id) || preSelectedDiamondId || "",
    client_id: initial.client_id || "",
    broker_id: initial.broker_id || "",
    status: initial.status || "pending",
    sale_rap_discount: initial.sale_rap_discount ?? "",
    sale_amount: initial.sale_amount ?? "",
    sale_amount_inr: initial.sale_amount_inr ?? "",
    brokerage_rate: initial.brokerage_rate ?? "",
    brokerage_amount: initial.brokerage_amount ?? "", // Now in INR
    notes: initial.notes || "",

    // Payment fields
    selling_date: initial.selling_date ? initial.selling_date.split('T')[0] : new Date().toISOString().split('T')[0],
    payment_status: initial.payment_status || "on_terms",
    terms_days: initial.terms_days ?? "30",
    advance_amount: initial.advance_amount ?? "",
    sold_carats: initial.sold_carats ?? "",
    payment_mode: initial.payment_mode || "",
    invoice_number: initial.invoice_number || "",
  });

  const [diamondInfo, setDiamondInfo] = useState({ weight: "", rap_rate: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Dropdown Options State
  const [clientList, setClientList] = useState(clients);
  const [brokerList, setBrokerList] = useState(brokers);

  // Invoice States
  const [invoiceSeq, setInvoiceSeq] = useState(""); // The middle number part
  const [invoicePrefix, setInvoicePrefix] = useState(""); // LS/O/ or LS/C/
  const [invoiceYear, setInvoiceYear] = useState(""); // /2026-2027
  const [isInvoiceAvailable, setIsInvoiceAvailable] = useState(true);
  const [invoiceChecking, setInvoiceChecking] = useState(false);
  const isInitialMount = useRef(true);

  // Sync with props
  useEffect(() => {
    setClientList(clients);
  }, [clients]);

  useEffect(() => {
    setBrokerList(brokers);
  }, [brokers]);

  // Quick Add Modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("client");

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const handleModalSuccess = (newEntity) => {
    if (modalType === "client") {
      setClientList((prev) => [newEntity, ...prev]);
      setForm((prev) => ({ ...prev, client_id: newEntity.id }));
    } else {
      setBrokerList((prev) => [newEntity, ...prev]);
      setForm((prev) => ({ ...prev, broker_id: newEntity.id }));
    }
  };

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

  // Calculate sale amount (USD)
  const calculateSaleAmount = (weight, rapRate, discount) => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(rapRate) || 0;
    const d = parseFloat(discount) || 0;
    return w * r * (1 - d / 100);
  };

  // Calculate sale amount in INR
  const calculateSaleAmountInr = useCallback((saleAmount) => {
    const amount = parseFloat(saleAmount) || 0;
    return amount > 0 ? amount.toFixed(2) : "";
  }, []);

  // Calculate brokerage amount in INR (based on INR sale amount)
  const calculateBrokerageAmount = useCallback((saleAmountInr, brokerageRate) => {
    const amount = parseFloat(saleAmountInr) || 0;
    const rate = parseFloat(brokerageRate) || 0;
    if (rate > 0 && amount > 0) return (amount * (rate / 100)).toFixed(2);
    return "";
  }, []);

  // Calculate due date
  const calculateDueDate = useMemo(() => {
    if (!form.selling_date || !form.terms_days || form.payment_status !== 'on_terms') return null;
    const date = new Date(form.selling_date);
    if (isNaN(date.getTime())) return null;
    date.setDate(date.getDate() + (parseInt(form.terms_days) || 0));
    return date;
  }, [form.selling_date, form.terms_days, form.payment_status]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const outstandingAmount = useMemo(() => {
    const saleAmount = parseFloat(form.sale_amount) || 0;
    const advance = parseFloat(form.advance_amount) || 0;
    return Math.max(0, saleAmount - advance);
  }, [form.sale_amount, form.advance_amount]);

  // Update diamond info when diamond changes
  useEffect(() => {
    if (selectedDiamond) {
      const isLoose = user?.client_type === "Loose";

      setDiamondInfo({
        weight: isLoose ? selectedDiamond.carats : (selectedDiamond.weight || ""),
        rap_rate: isLoose ? "" : (selectedDiamond.rap_rate || ""),
      });

     let saleAmount = 0;
if (!isLoose) {
  saleAmount = calculateSaleAmount(selectedDiamond.weight, selectedDiamond.rap_rate, form.sale_rap_discount);
}

      const saleAmountInr = calculateSaleAmountInr(saleAmount);
      const brokerageAmount = calculateBrokerageAmount(saleAmountInr, form.brokerage_rate);

      setForm(prev => ({
        ...prev,
        sold_carats: isLoose ? selectedDiamond.carats : "",
        sale_amount: saleAmount > 0 ? saleAmount.toFixed(2) : "",
        sale_amount_inr: saleAmountInr,
        brokerage_amount: brokerageAmount,
      }));
    } else {
      setDiamondInfo({ weight: "", rap_rate: "" });
    }
  }, [form.diamond_id, diamonds, form.brokerage_rate, user, form.sale_rap_discount]);

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

    // Amount changes -> recompute INR
    if (name === "sale_amount") {
      updated.sale_amount_inr = calculateSaleAmountInr(value);
      updated.brokerage_amount = calculateBrokerageAmount(updated.sale_amount_inr, updated.brokerage_rate);
    }

    // Brokerage rate changes -> recalculate brokerage amount in INR
    if (name === "brokerage_rate") {
      updated.brokerage_amount = calculateBrokerageAmount(updated.sale_amount_inr, value);
    }

    // If payment status changes to completed, clear terms fields
    if (name === "payment_status" && value === "completed") {
      updated.terms_days = "";
      updated.advance_amount = updated.sale_amount;
    }

    // If payment status changes to on_terms, set default terms
    if (name === "payment_status" && value === "on_terms") {
      updated.terms_days = "30";
      updated.advance_amount = "";
    }

 

    setForm(updated);
  };

  // Fetch next invoice sequence when payment mode changes
  useEffect(() => {
    const isLoose = user?.client_type === "Loose";
    if (!isLoose || !form.payment_mode) {
      setInvoicePrefix("");
      setInvoiceYear("");
      setInvoiceSeq("");
      return;
    }

    const fetchSequence = async () => {
      // Don't re-fetch if we already have a sequence and modes match (unless manually cleared)
      if (invoiceSeq && invoicePrefix && form.invoice_number.startsWith(invoicePrefix)) {
          return;
      }

      // If we are editing and this is the first load, parse existing instead of fetching new
      if (isInitialMount.current && initial.invoice_number && form.payment_mode === initial.payment_mode) {
        const regex = /^(LS\/[OC]\/)([0-9]+)(\/.*)$/;
        const match = initial.invoice_number.match(regex);
        if (match) {
          setInvoicePrefix(match[1]);
          setInvoiceSeq(match[2]);
          setInvoiceYear(match[3]);
          isInitialMount.current = false;
          return;
        }
      }

      try {
        const res = await fetch(`/api/sales/invoice-sequence?mode=${form.payment_mode}`);
        const data = await res.json();
        if (data.nextSequence) {
          setInvoicePrefix(data.prefix);
          setInvoiceYear(data.yearSuffix);
          setInvoiceSeq(data.nextSequence.toString());

          // Initial auto-fill of the full invoice number
          setForm(prev => ({
            ...prev,
            invoice_number: `${data.prefix}${data.nextSequence}${data.yearSuffix}`
          }));
        }
      } catch (err) {
        console.error("Failed to fetch invoice sequence:", err);
      } finally {
        isInitialMount.current = false;
      }
    };

    fetchSequence();
  }, [form.payment_mode, user?.client_type, initial?.id]);

  // Update full invoice string when sequence part is edited manually
  const handleInvoiceSeqChange = (e) => {
    const seq = e.target.value;
    setInvoiceSeq(seq);
    setForm(prev => ({
      ...prev,
      invoice_number: `${invoicePrefix}${seq}${invoiceYear}`
    }));
  };

  // Real-time invoice uniqueness check
  useEffect(() => {
    if (!form.invoice_number || !user?.client_type === "Loose") {
      setIsInvoiceAvailable(true);
      return;
    }

    const timer = setTimeout(async () => {
      setInvoiceChecking(true);
      try {
        const excludeId = initial?.id || "";
        const res = await fetch(`/api/sales/validate-invoice?invoice_number=${encodeURIComponent(form.invoice_number)}&exclude_sale_id=${excludeId}`);
        const data = await res.json();
        setIsInvoiceAvailable(data.available);
      } catch (err) {
        console.error("Error validating invoice:", err);
      } finally {
        setInvoiceChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.invoice_number, form.payment_mode, user?.client_type]);

  const validateForm = () => {
    const errors = {};
    if (!form.diamond_id) errors.diamond_id = "Item is required";
    if (!form.client_id) errors.client_id = "Client is required";
    if (user?.client_type === "Loose") {
    if (!form.sale_amount || parseFloat(form.sale_amount) <= 0) {
      errors.sale_amount = "Selling price is required";
    }
  }
    if (!form.status) errors.status = "Status is required";
    if (user?.client_type !== "Loose") {
      if (form.sale_rap_discount === "" || form.sale_rap_discount === null) {
        errors.sale_rap_discount = "Sale RAP Discount is required";
      }
    }
    if (!form.selling_date) errors.selling_date = "Selling date is required";
    if (!form.payment_status) errors.payment_status = "Payment status is required";

    if (form.payment_status === "on_terms") {
      if (!form.terms_days || parseInt(form.terms_days) <= 0) {
        errors.terms_days = "Terms days is required for On Terms payment";
      }
    }

    if (user?.client_type === "Loose") {
      const currentStock = parseFloat(selectedDiamond?.carats || 0);
      const originalSale = initial?.id ? (parseFloat(initial.sold_carats) || 0) : 0;
      const maxAvailable = currentStock + originalSale;
      
      if (!form.sold_carats || parseFloat(form.sold_carats) <= 0) {
        errors.sold_carats = "Sold carats is required";
      } else if (selectedDiamond && parseFloat(form.sold_carats) > maxAvailable) {
        errors.sold_carats = `Cannot sell more than available (${maxAvailable.toFixed(3)} ct)`;
      }

      // Mode of Payment validation
      if (!form.payment_mode) {
        errors.payment_mode = "Mode of Payment is required";
      }

      if (form.payment_mode) {
        if (!invoiceSeq) {
          errors.invoice_number = "Invoice sequence is required";
        } else if (!isInvoiceAvailable) {
          errors.invoice_number = "This invoice number already exists. Please choose the next number.";
        }
      }
    }

    if (form.payment_status === "on_terms" && form.advance_amount && form.sale_amount) {
      if (parseFloat(form.advance_amount) > parseFloat(form.sale_amount)) {
        errors.advance_amount = "Advance amount cannot exceed sale amount";
      }
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
      // Calculate due date for payload
      let dueDate = null;
      if (form.payment_status === 'on_terms' && form.selling_date && form.terms_days) {
        const date = new Date(form.selling_date);
        date.setDate(date.getDate() + parseInt(form.terms_days));
        dueDate = date.toISOString().split('T')[0];
      }

      const dataToSend = {
        diamond_id: user?.client_type === "Loose" ? null : parseInt(form.diamond_id),
        loose_diamond_item_id: user?.client_type === "Loose" ? parseInt(form.diamond_id) : null,
        client_id: parseInt(form.client_id),
        broker_id: form.broker_id ? parseInt(form.broker_id) : null,
        status: form.status,
        sale_rap_discount: 0,
        sale_amount: parseFloat(form.sale_amount) || 0,
        conversion_rate: 1,
        sale_amount_inr: parseFloat(form.sale_amount) || 0,
        brokerage_rate: form.brokerage_rate ? parseFloat(form.brokerage_rate) : null,
        brokerage_amount: form.brokerage_amount ? parseFloat(form.brokerage_amount) : null,
        notes: form.notes || null,

        // Payment fields
        selling_date: form.selling_date || null,
        payment_status: form.payment_status,
        terms_days: form.payment_status === 'on_terms' ? parseInt(form.terms_days) || 30 : null,
        // Backend expects advance_amount in INR
        advance_amount: parseFloat(form.advance_amount) || 0,
        due_date: dueDate,
        sold_carats: user?.client_type === "Loose" ? parseFloat(form.sold_carats) : null,
        payment_mode: form.payment_mode || null,
        invoice_number: form.invoice_number || null,
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
    const amt = parseFloat(form.sale_amount) || 0;
    const bro = parseFloat(form.brokerage_amount) || 0;
    const adv = parseFloat(form.advance_amount) || 0;
    const out = Math.max(0, amt - adv);

    return {
      amt: `₹${amt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      bro: `₹${bro.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      advance: `₹${adv.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      outstanding: `₹${out.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }, [form.sale_amount, form.brokerage_amount, form.advance_amount]);

  return (
    <>
      <QuickAddEntityModal
        show={showModal}
        type={modalType}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
      />
      <form onSubmit={handleSubmit} noValidate>
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

      {/* Summary strip - Slimmed down to match reference image */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4 p-2 px-3"
        style={{
          background: "linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)",
          border: "1px solid #e9ecef",
          borderRadius: 20,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div className="d-flex flex-wrap gap-2 py-1">
          {/* Total Sale Pill - Slim Version */}
          <div 
            className="d-flex align-items-center px-3 py-2" 
            style={{ 
              backgroundColor: "#e2e8f0", 
              borderRadius: "12px",
              border: "1px solid rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: "700", marginRight: "10px", color: "#1e293b" }}>
              ₹
            </div>
            <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#1e293b" }}>
              Total Sale: <span className="ms-1">{summary.amt}</span>
            </div>
          </div>

          <div 
            className="d-flex align-items-center px-3 py-2" 
            style={{ 
              backgroundColor: "#1e293b", 
              borderRadius: "12px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <i className="bi bi-arrow-down-circle me-2 text-white opacity-75" style={{ fontSize: "0.9rem" }} />
            <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f8fafc" }}>
              Advance: <span className="ms-1 text-white">{summary.advance}</span>
            </div>
          </div>

          <div 
            className="d-flex align-items-center px-3 py-2" 
            style={{ 
              backgroundColor: "#1e293b", 
              borderRadius: "12px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <i className="bi bi-hourglass-split me-2 text-white opacity-75" style={{ fontSize: "0.9rem" }} />
            <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#f8fafc" }}>
              Outstanding: <span className="ms-1 text-white fw-bold">{summary.outstanding}</span>
            </div>
          </div>

          {form.brokerage_amount && (
             <div 
              className="d-flex align-items-center px-3 py-2" 
              style={{ 
                backgroundColor: "rgba(79, 70, 229, 0.05)", 
                borderRadius: "12px",
                border: "1px solid rgba(79, 70, 229, 0.1)"
              }}
            >
              <i className="bi bi-percent me-2 text-indigo" style={{ fontSize: "0.9rem", color: "#4f46e5" }} />
              <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4338ca" }}>
                Brokerage: <span className="ms-1">{summary.bro}</span>
              </div>
            </div>
          )}
        </div>

        <div
          className={`d-flex align-items-center px-3 py-2 ${form.payment_status === 'completed' ? 'text-white bg-success' : 'text-dark bg-warning'}`}
          style={{ 
            borderRadius: "12px",
            fontWeight: "700",
            fontSize: "0.85rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}
        >
          <i className={`bi ${form.payment_status === 'completed' ? 'bi-check-circle-fill' : 'bi-clock-history'} me-2`} />
          {form.payment_status === 'completed' ? 'PAID IN FULL' : 'On Terms'}
        </div>
      </div>

      {/* Section: Parties */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(0,0,0,0.06)" }}>
            <i className="bi bi-people text-dark opacity-50" style={{ fontSize: "1.1rem" }} />
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
                <option value="">Select {user?.client_type === "Loose" ? "Lot Item" : "Diamond"}</option>
                {diamonds.map((d) => {
                  const isCurrentItem = initial?.id && String(d.id) === String(initial.loose_diamond_item_id || initial.diamond_id);
                  const displayWeight = isCurrentItem ? (parseFloat(d.carats || 0) + (parseFloat(initial.sold_carats) || 0)) : (d.carats || d.weight || 0);

                  return (
                    <option key={d.id} value={d.id}>
                      {user?.client_type === "Loose"
                        ? `LOT-${d.lot_number} (${d.color_category} ${d.size_category} / ${d.grade} - ${parseFloat(displayWeight).toFixed(3)}ct)`
                        : `${d.certificate_number} (${d.shape} ${displayWeight}ct ${d.color}/${d.clarity})`
                      }
                    </option>
                  );
                })}
              </select>
            </div>
            {hasError("diamond_id") && <div className="invalid-feedback d-block">{validationErrors.diamond_id}</div>}
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
                onChange={(e) => {
                  if (e.target.value === "ADD_NEW") {
                    openModal("client");
                  } else {
                    handleChange(e);
                  }
                }}
                className={selectClass("client_id")}
                required
              >
                <option value="">Select Client</option>
                <option value="ADD_NEW" className="fw-bold text-primary">+ Add New Client</option>
                <hr />
                {clientList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>
            {hasError("client_id") && <div className="invalid-feedback d-block">{validationErrors.client_id}</div>}
          </div>

          <div className="col-md-6">
            <label htmlFor="broker_id" className="form-label fw-medium">
              Broker <span className="text-muted">(Optional)</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-person-badge text-muted" />
              </span>
              <select
                id="broker_id"
                name="broker_id"
                value={form.broker_id}
                onChange={(e) => {
                  if (e.target.value === "ADD_NEW") {
                    openModal("broker");
                  } else {
                    handleChange(e);
                  }
                }}
                className="form-select"
              >
                <option value="">Select Broker</option>
                <option value="ADD_NEW" className="fw-bold text-primary">+ Add New Broker</option>
                <hr />
                {brokerList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.company_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-md-6">
            <label htmlFor="status" className="form-label fw-medium">
              Sale Status <span className="text-danger">*</span>
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

      {/* Section: Pricing & Calculations */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(0,0,0,0.06)" }}>
            <i className="bi bi-calculator text-dark opacity-50" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Pricing & Calculations</div>
            <div className="text-muted small">Discount drives totals; brokerage is calculated on INR amount</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label fw-medium">{user?.client_type === "Loose" ? "Available Carats" : "Diamond Weight"}</label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-speedometer2 text-muted" />
              </span>
              <input 
                value={(() => {
 
                  if (user?.client_type === "Loose" && initial?.id) {
                    const currentStock = parseFloat(selectedDiamond?.carats || 0);
                    const thisSale = parseFloat(initial.sold_carats || 0);
                    return (currentStock + thisSale).toFixed(3);
                  }
                  return diamondInfo.weight;
                })()} 
                className="form-control bg-light" 
                readOnly 
              />
              <span className="input-group-text bg-white">ct</span>
            </div>
          </div>

          {user?.client_type === "Loose" && (
            <div className="col-md-3">
              <label htmlFor="sold_carats" className="form-label fw-medium">
                Sold Carats <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-cart-check text-muted" />
                </span>
                <input
                  type="number"
                  step="0.001"
                  id="sold_carats"
                  name="sold_carats"
                  value={form.sold_carats}
                  onChange={handleChange}
                  className={controlClass("sold_carats")}
                  placeholder="e.g. 2.50"
                  required
                />
              </div>
              {hasError("sold_carats") && <div className="invalid-feedback d-block">{validationErrors.sold_carats}</div>}
            </div>
          )}

          {user?.client_type !== "Loose" && (
            <>
              <div className="col-md-3">
                <label className="form-label fw-medium">RAP Rate</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">₹</span>
                  <input value={diamondInfo.rap_rate} className="form-control bg-light" readOnly />
                </div>
              </div>

              <div className="col-md-3">
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
            </>
          )}

          <div className="col-md-12">
         <label className="form-label fw-medium">
  Selling Price (INR) {user?.client_type === "Loose" && <span className="text-danger">*</span>}
</label>

            <div className="input-group">
              <span className="input-group-text bg-white">₹</span>
              <input
                type="number"
                step="0.01"
                name="sale_amount"
                value={form.sale_amount}
                onChange={handleChange}
              className={`form-control fw-semibold ${hasError("sale_amount") ? "is-invalid" : ""}`}
              />
            </div>
            {hasError("sale_amount") && <div className="invalid-feedback d-block">{validationErrors.sale_amount}</div>}
          </div>

        </div>

        {/* Brokerage Section */}
        <div className="row g-3 mt-2">
          <div className="col-12">
            <div className="p-4" style={{ backgroundColor: "rgba(79, 70, 229, 0.04)", borderRadius: 20, border: "1px solid rgba(79, 70, 229, 0.1)" }}>
              <div className="d-flex align-items-center mb-3">
                <i className="bi bi-person-badge text-indigo me-2" style={{ color: "#4f46e5" }} />
                <span className="fw-bold" style={{ color: "#3730a3" }}>Brokerage (Calculated on INR)</span>
              </div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="brokerage_rate" className="form-label fw-medium text-dark">
                    Brokerage Rate (%)
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-percent" />
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
                  <div className="text-muted small mt-1">Applied on INR sale amount</div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-medium text-dark">Brokerage Amount (INR)</label>
                  <div className="input-group">
                    <span className="input-group-text border-end-0">₹</span>
                    <input
                      value={form.brokerage_amount}
                      className="form-control fw-bold border-start-0"
                      readOnly
                      style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    />
                  </div>
                  <div className="text-muted small mt-1">
                    {form.brokerage_rate && form.sale_amount_inr
                      ? `${form.brokerage_rate}% of ₹${parseFloat(form.sale_amount_inr).toLocaleString('en-IN')}`
                      : "Auto-calculated from INR amount"
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Payment Information */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(16,185,129,0.10)" }}>
            <i className="bi bi-credit-card text-success" style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">Payment Information</div>
            <div className="text-muted small">Set payment terms and track receivables</div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="selling_date" className="form-label fw-medium">
              Selling Date <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-calendar-event text-muted" />
              </span>
              <input
                type="date"
                id="selling_date"
                name="selling_date"
                value={form.selling_date}
                onChange={handleChange}
                className={controlClass("selling_date")}
                required
              />
            </div>
            {hasError("selling_date") && <div className="invalid-feedback d-block">{validationErrors.selling_date}</div>}
          </div>

          <div className="col-md-4">
            <label htmlFor="payment_status" className="form-label fw-medium">
              Payment Status <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-wallet2 text-muted" />
              </span>
              <select
                id="payment_status"
                name="payment_status"
                value={form.payment_status}
                onChange={handleChange}
                className={selectClass("payment_status")}
                required
              >
                <option value="on_terms">On Terms</option>
                <option value="completed">Completed - Full Payment</option>
              </select>
            </div>
            {hasError("payment_status") && <div className="invalid-feedback d-block">{validationErrors.payment_status}</div>}
          </div>

          {/* Conditional fields for On Terms */}
          {form.payment_status === "on_terms" && (
            <>
              <div className="col-md-4">
                <label htmlFor="terms_days" className="form-label fw-medium">
                  Terms (Days) <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-clock text-muted" />
                  </span>
                  <input
                    type="number"
                    id="terms_days"
                    name="terms_days"
                    value={form.terms_days}
                    onChange={handleChange}
                    className={controlClass("terms_days")}
                    placeholder="e.g., 30"
                    min="1"
                  />
                  <span className="input-group-text bg-white">days</span>
                </div>
                {hasError("terms_days") && <div className="invalid-feedback d-block">{validationErrors.terms_days}</div>}
              </div>

              <div className="col-md-4">
                <label htmlFor="advance_amount" className="form-label fw-medium">
                  Advance Amount (INR)
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    id="advance_amount"
                    name="advance_amount"
                    value={form.advance_amount}
                    onChange={handleChange}
                    className={controlClass("advance_amount")}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                {hasError("advance_amount") && <div className="invalid-feedback d-block">{validationErrors.advance_amount}</div>}
              </div>

              <div className="col-md-4">
                <label className="form-label fw-medium">Due Date</label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-calendar-check text-muted" />
                  </span>
                  <input
                    type="text"
                    value={calculateDueDate ? formatDate(calculateDueDate) : "N/A"}
                    className="form-control bg-light"
                    readOnly
                  />
                </div>
              </div>

              <div className="col-md-4">
                <label className="form-label fw-medium">Outstanding Amount (INR)</label>
                <div className="input-group">
                  <span className="input-group-text bg-warning bg-opacity-25">₹</span>
                  <input
                    type="text"
                    value={outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    className="form-control bg-warning bg-opacity-10 fw-bold text-warning"
                    readOnly
                  />
                </div>
              </div>
            </>
          )}

          <div className="col-md-4">
            <label htmlFor="payment_mode" className="form-label fw-medium">
              Mode of Payment <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-credit-card-2-front text-muted" />
              </span>
              <select
                id="payment_mode"
                name="payment_mode"
                value={form.payment_mode}
                onChange={handleChange}
                className={selectClass("payment_mode")}
                required
              >
                <option value="">Select Mode</option>
                <option value="Online">Online</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            {hasError("payment_mode") && <div className="invalid-feedback d-block">{validationErrors.payment_mode}</div>}
          </div>

          {user?.client_type === "Loose" && form.payment_mode && (
            <div className="col-12 mt-3">
              <div
                className="p-3 shadow-sm"
                style={{
                  backgroundColor: !isInvoiceAvailable ? "rgba(239, 68, 68, 0.04)" : "rgba(255, 193, 7, 0.04)",
                  border: !isInvoiceAvailable ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(255, 193, 7, 0.2)",
                  borderRadius: 14
                }}
              >
                <div className="d-flex align-items-center mb-3">
                  <span className={`${!isInvoiceAvailable ? "text-danger" : "text-warning"} me-2 fw-bold`}>#</span>
                  <div className="fw-bold me-2">Invoice Number</div>
                  <div className="text-muted small">— system generated, you can edit the sequence</div>
                </div>

                <div className="d-flex align-items-center flex-wrap gap-3">
                  <div
                    className="px-3 py-2 bg-white border rounded-3 text-muted fw-medium shadow-sm"
                    style={{ minWidth: 80, textAlign: 'center' }}
                  >
                    {invoicePrefix}
                  </div>

                  <input
                    type="number"
                    value={invoiceSeq}
                    onChange={handleInvoiceSeqChange}
                    className={`form-control shadow-sm fw-bold text-center ${!isInvoiceAvailable ? "is-invalid" : ""}`}
                    style={{ width: 120, height: 42, borderRadius: 10 }}
                    placeholder="SEQ"
                  />

                  <div
                    className="px-3 py-2 bg-white border rounded-3 text-muted fw-medium shadow-sm"
                    style={{ minWidth: 100, textAlign: 'center' }}
                  >
                    {invoiceYear}
                  </div>

                  <div className="d-flex align-items-center ms-md-2 fw-bold">
                    {invoiceChecking ? (
                      <span className="spinner-border spinner-border-sm text-secondary me-2" />
                    ) : isInvoiceAvailable ? (
                      <span className="text-success">
                        <i className="bi bi-check-circle-fill me-2" />
                        {form.invoice_number}
                      </span>
                    ) : (
                      <span className="text-danger small">
                        <i className="bi bi-exclamation-circle-fill me-2" />
                        Already exists! Use next number
                      </span>
                    )}
                  </div>
                </div>

                {!isInvoiceAvailable && (
                  <div className="mt-2 text-danger small fw-medium">
                    This invoice number is already taken. Please choose the next numeric sequence.
                  </div>
                )}

                <input type="hidden" name="invoice_number" value={form.invoice_number} />
              </div>
            </div>
          )}

          {/* Full payment confirmation */}
          {form.payment_status === "completed" && (
            <div className="col-12">
              <div
                className="p-3 d-flex align-items-center gap-3"
                style={{
                  borderRadius: 12,
                  backgroundColor: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.2)"
                }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 40, height: 40, backgroundColor: "rgba(16,185,129,0.15)" }}
                >
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <div className="fw-semibold text-success">Full Payment Received</div>
                  <div className="text-muted small">
                    Amount: ₹{parseFloat(form.sale_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} - No outstanding balance
                  </div>
                </div>
              </div>
            </div>
          )}
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
          <i className="bi bi-info-circle me-2" />
          Brokerage is calculated as a percentage of the INR sale amount.
        </div>

        <div className="d-flex gap-2">
          <Link href="/sales" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
            <i className="bi bi-x-lg me-2" />
            Cancel
          </Link>

          <button type="submit" className="btn text-white px-4" style={{ borderRadius: 10, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }} disabled={loading}>
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
          border-color: rgba(0, 0, 0, 0.06) !important;
          background-color: #fbfbfb !important;
        }
        .form-control,
        .form-select {
          border-color: rgba(0, 0, 0, 0.06) !important;
          border-radius: 12px;
          padding: 0.65rem 1rem;
          font-size: 0.95rem;
        }
        .input-group .form-control,
        .input-group .form-select {
          border-left: 0 !important;
        }
        .input-group .input-group-text {
          border-radius: 12px 0 0 12px;
          color: #64748b;
        }
        .input-group .input-group-text:last-child {
          border-radius: 0 12px 12px 0;
          border-left: 0 !important;
        }
        .input-group .form-control,
        .input-group textarea,
        .input-group .form-select {
          border-radius: 0 12px 12px 0;
        }
        .input-group .form-control:not(:last-child),
        .input-group .form-select:not(:last-child) {
          border-radius: 0;
        }
        .form-control:focus,
        .form-select:focus {
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08) !important;
          border-color: rgba(79, 70, 229, 0.3) !important;
          background-color: #fff !important;
        }
        .btn:focus {
          box-shadow: none !important;
        }
      `}</style>
    </form>
    </>
  );
}
