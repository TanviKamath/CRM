// app/expenses/ExpenseForm.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Expense categories
const EXPENSE_CATEGORIES = {
  brokerage: "Brokerage",
  salaries: "Salaries & Wages",
  rent: "Rent & Lease",
  utilities: "Utilities (Electric, Water, Internet)",
  office_supplies: "Office Supplies",
  snacks: "Snacks & Refreshments",
  travel: "Travel & Transportation",
  marketing: "Marketing & Advertising",
  insurance: "Insurance",
  maintenance: "Repairs & Maintenance",
  professional_fees: "Professional Fees",
  taxes: "Taxes & Licenses",
  miscellaneous: "Miscellaneous",
};

// Payment methods
const PAYMENT_METHODS = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  upi: "UPI",
  other: "Other",
};

export default function ExpenseForm({
  initial = {},
  submitButtonText = "Save Expense",
  onSubmit,
}) {
  const router = useRouter();

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    expense_date: initial.expense_date?.split("T")[0] || today,
    category: initial.category || "",
    description: initial.description || "",
    amount: initial.amount || "",
    payment_method: initial.payment_method || "",
    reference_number: initial.reference_number || "",
    paid_to: initial.paid_to || "",
    notes: initial.notes || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Broker autocomplete states
  const [brokerName, setBrokerName] = useState(initial.category === "brokerage" ? initial.description : "");
  const [brokerSuggestions, setBrokerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const brokerInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Check if brokerage category is selected
  const isBrokerage = form.category === "brokerage";

  // Fetch broker suggestions based on input
  useEffect(() => {
    const fetchBrokers = async () => {
      if (!brokerName || brokerName.length < 1) {
        setBrokerSuggestions([]);
        return;
      }

      setLoadingBrokers(true);
      try {
        const res = await fetch(`/api/brokers/search?q=${encodeURIComponent(brokerName)}`);
        if (res.ok) {
          const data = await res.json();
          setBrokerSuggestions(data);
        }
      } catch (err) {
        console.error("Error fetching brokers:", err);
      } finally {
        setLoadingBrokers(false);
      }
    };

    const debounceTimer = setTimeout(fetchBrokers, 300);
    return () => clearTimeout(debounceTimer);
  }, [brokerName]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        brokerInputRef.current &&
        !brokerInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

    // If category changes, reset broker name if switching away from brokerage
    if (name === "category") {
      if (value === "brokerage") {
        // Switching to brokerage - clear description and paid_to
        setForm({ ...form, [name]: value, description: "", paid_to: "" });
        setBrokerName("");
      } else {
        // Switching away from brokerage
        setForm({ ...form, [name]: value });
        setBrokerName("");
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle broker name input change
  const handleBrokerNameChange = (e) => {
    const value = e.target.value;
    setBrokerName(value);
    setShowSuggestions(true);

    // Clear validation error
    if (validationErrors.description) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  };

  // Handle broker selection from suggestions
  const handleSelectBroker = (broker) => {
    setBrokerName(broker.name);
    setShowSuggestions(false);
  };

  // Handle keyboard navigation in suggestions
  const handleBrokerKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (brokerSuggestions.length > 0 && showSuggestions) {
        // Select first suggestion
        handleSelectBroker(brokerSuggestions[0]);
      }
      setShowSuggestions(false);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!form.expense_date) {
      errors.expense_date = "Date is required";
    }

    if (!form.category) {
      errors.category = "Category is required";
    }

    // For brokerage, validate broker name; otherwise validate description
    if (isBrokerage) {
      if (!brokerName.trim()) {
        errors.description = "Broker name is required";
      }
    } else {
      if (!form.description.trim()) {
        errors.description = "Description is required";
      }
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      errors.amount = "Amount must be greater than 0";
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
      const dataToSend = {
        expense_date: form.expense_date,
        category: form.category,
        // For brokerage, use broker name as description
        description: isBrokerage ? brokerName.trim() : form.description.trim(),
        amount: parseFloat(form.amount),
        payment_method: form.payment_method || null,
        reference_number: form.reference_number.trim() || null,
        // For brokerage, paid_to is null
        paid_to: isBrokerage ? null : (form.paid_to.trim() || null),
        notes: form.notes.trim() || null,
      };

      if (onSubmit) {
        await onSubmit(dataToSend);
      } else {
        const method = initial.id ? "PUT" : "POST";
        const url = initial.id ? `/api/expenses/${initial.id}` : `/api/expenses`;

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
          `/expenses?success=${encodeURIComponent(
            initial.id ? "Expense updated successfully!" : "Expense added successfully!"
          )}`
        );
      }
    } catch (err) {
      setError(err.message || "Error saving expense");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
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

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {/* Row 1: Date & Category */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="expense_date" className="form-label fw-medium">
                <i className="bi bi-calendar3 me-2 text-primary"></i>
                Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                id="expense_date"
                name="expense_date"
                value={form.expense_date}
                onChange={handleChange}
                className={`form-control ${getErrorClass("expense_date")}`}
                required
              />
              {hasError("expense_date") && (
                <div className="invalid-feedback">{validationErrors.expense_date}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="category" className="form-label fw-medium">
                <i className="bi bi-tag me-2 text-primary"></i>
                Category <span className="text-danger">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`form-select ${getErrorClass("category")}`}
                required
              >
                <option value="">Select Category</option>
                {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {hasError("category") && (
                <div className="invalid-feedback">{validationErrors.category}</div>
              )}
            </div>
          </div>

          {/* Row 2: Description/Broker Name & Amount */}
          <div className="row">
            {isBrokerage ? (
              /* Broker Name Autocomplete Field */
              <div className="col-md-8 mb-3">
                <label htmlFor="broker_name" className="form-label fw-medium">
                  <i className="bi bi-person-badge me-2 text-primary"></i>
                  Broker Name <span className="text-danger">*</span>
                </label>
                <div className="position-relative">
                  <input
                    type="text"
                    id="broker_name"
                    ref={brokerInputRef}
                    value={brokerName}
                    onChange={handleBrokerNameChange}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleBrokerKeyDown}
                    className={`form-control ${getErrorClass("description")}`}
                    placeholder="Start typing broker name..."
                    autoComplete="off"
                  />
                  {loadingBrokers && (
                    <div className="position-absolute" style={{ right: "10px", top: "50%", transform: "translateY(-50%)" }}>
                      <span className="spinner-border spinner-border-sm text-primary" role="status"></span>
                    </div>
                  )}

                  {/* Suggestions Dropdown */}
                  {showSuggestions && brokerSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="position-absolute w-100 bg-white border rounded shadow-sm"
                      style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto", top: "100%" }}
                    >
                      {brokerSuggestions.map((broker) => (
                        <div
                          key={broker.id}
                          className="px-3 py-2 cursor-pointer hover-bg-light"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSelectBroker(broker)}
                          onMouseEnter={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                          onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                        >
                          <div className="fw-medium">{broker.name}</div>
                          {broker.phone && (
                            <small className="text-muted">{broker.phone}</small>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {showSuggestions && brokerName.length >= 1 && !loadingBrokers && brokerSuggestions.length === 0 && (
                    <div
                      ref={suggestionsRef}
                      className="position-absolute w-100 bg-white border rounded shadow-sm px-3 py-2"
                      style={{ zIndex: 1000, top: "100%" }}
                    >
                      <span className="text-muted">No brokers found. Name will be saved as entered.</span>
                    </div>
                  )}
                </div>
                {hasError("description") && (
                  <div className="invalid-feedback d-block">{validationErrors.description}</div>
                )}
                <small className="text-muted">
                  Type to search existing brokers or enter a new name
                </small>
              </div>
            ) : (
              /* Regular Description Field */
              <div className="col-md-8 mb-3">
                <label htmlFor="description" className="form-label fw-medium">
                  <i className="bi bi-card-text me-2 text-primary"></i>
                  Description <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={`form-control ${getErrorClass("description")}`}
                  placeholder="e.g., Monthly office rent, Staff lunch, etc."
                  required={!isBrokerage}
                />
                {hasError("description") && (
                  <div className="invalid-feedback">{validationErrors.description}</div>
                )}
              </div>
            )}

            <div className="col-md-4 mb-3">
              <label htmlFor="amount" className="form-label fw-medium">
                <i className="bi bi-currency-rupee me-2 text-primary"></i>
                Amount <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <span className="input-group-text">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  id="amount"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className={`form-control ${getErrorClass("amount")}`}
                  placeholder="0.00"
                  required
                />
              </div>
              {hasError("amount") && (
                <div className="invalid-feedback d-block">{validationErrors.amount}</div>
              )}
            </div>
          </div>

          {/* Row 3: Payment Method & Reference */}
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="payment_method" className="form-label fw-medium">
                <i className="bi bi-credit-card me-2 text-primary"></i>
                Payment Method
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={form.payment_method}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Method</option>
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <label htmlFor="reference_number" className="form-label fw-medium">
                <i className="bi bi-hash me-2 text-primary"></i>
                Reference / Receipt No.
              </label>
              <input
                type="text"
                id="reference_number"
                name="reference_number"
                value={form.reference_number}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g., INV-001, TXN123456"
              />
            </div>

            {/* Only show Paid To field if NOT brokerage */}
            {!isBrokerage && (
              <div className="col-md-4 mb-3">
                <label htmlFor="paid_to" className="form-label fw-medium">
                  <i className="bi bi-person me-2 text-primary"></i>
                  Paid To
                </label>
                <input
                  type="text"
                  id="paid_to"
                  name="paid_to"
                  value={form.paid_to}
                  onChange={handleChange}
                  className="form-control"
                  placeholder="e.g., Vendor name, Employee name"
                />
              </div>
            )}
          </div>

          {/* Row 4: Notes */}
          <div className="row">
            <div className="col-12 mb-3">
              <label htmlFor="notes" className="form-label fw-medium">
                <i className="bi bi-sticky me-2 text-primary"></i>
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Any additional notes or details..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="mt-4">
        <button
          type="submit"
          className="btn btn-primary px-4 py-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Saving...
            </>
          ) : (
            <>
              <i className="bi bi-check-lg me-2"></i>
              {submitButtonText}
            </>
          )}
        </button>
        <Link href="/expenses" className="btn btn-outline-secondary px-4 py-2 ms-2">
          <i className="bi bi-x-lg me-2"></i>
          Cancel
        </Link>
      </div>
    </form>
  );
}