// app/expenses/show/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// Categories and Payment Methods
const EXPENSE_CATEGORIES = {
  salaries: "Salaries & Wages",
  rent: "Rent & Lease",
  utilities: "Utilities",
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

const PAYMENT_METHODS = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  upi: "UPI",
  other: "Other",
};

// Format currency
const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function ShowExpense() {
  const params = useParams();
  const id = params.id;

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchExpense = async () => {
      try {
        const res = await fetch(`/api/expenses/${id}`);
        if (!res.ok) throw new Error("Expense not found");
        const data = await res.json();
        setExpense(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExpense();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/expenses?success=" + encodeURIComponent("Expense deleted successfully!");
      }
    } catch (err) {
      alert("Failed to delete expense");
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error || "Expense not found"}</p>
          <Link href="/expenses" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="fw-bold mb-1">
                  <i className="bi bi-receipt me-2 text-primary"></i>
                  Expense Details
                </h2>
                <p className="text-muted mb-0">View expense information</p>
              </div>
              <div className="d-flex gap-2">
                <Link href={`/expenses/edit/${id}`} className="btn btn-warning">
                  <i className="bi bi-pencil me-2"></i>
                  Edit
                </Link>
                <Link href="/expenses" className="btn btn-outline-secondary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </Link>
              </div>
            </div>

            {/* Main Card */}
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Amount Header */}
                <div className="text-center mb-4 pb-4 border-bottom">
                  <p className="text-muted mb-1">Amount</p>
                  <h1 className="display-5 fw-bold text-danger mb-2">
                    {formatCurrency(expense.amount)}
                  </h1>
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2">
                    {EXPENSE_CATEGORIES[expense.category] || expense.category}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                        <i className="bi bi-calendar3 text-primary"></i>
                      </div>
                      <div>
                        <p className="text-muted small mb-0">Date</p>
                        <p className="fw-medium mb-0">{formatDate(expense.expense_date)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="rounded-circle bg-success bg-opacity-10 p-2 me-3">
                        <i className="bi bi-credit-card text-success"></i>
                      </div>
                      <div>
                        <p className="text-muted small mb-0">Payment Method</p>
                        <p className="fw-medium mb-0">
                          {PAYMENT_METHODS[expense.payment_method] || expense.payment_method || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                        <i className="bi bi-person text-info"></i>
                      </div>
                      <div>
                        <p className="text-muted small mb-0">Paid To</p>
                        <p className="fw-medium mb-0">{expense.paid_to || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="d-flex align-items-start">
                      <div className="rounded-circle bg-warning bg-opacity-10 p-2 me-3">
                        <i className="bi bi-hash text-warning"></i>
                      </div>
                      <div>
                        <p className="text-muted small mb-0">Reference Number</p>
                        <p className="fw-medium mb-0">{expense.reference_number || "-"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="d-flex align-items-start">
                      <div className="rounded-circle bg-secondary bg-opacity-10 p-2 me-3">
                        <i className="bi bi-card-text text-secondary"></i>
                      </div>
                      <div className="flex-grow-1">
                        <p className="text-muted small mb-0">Description</p>
                        <p className="fw-medium mb-0">{expense.description}</p>
                      </div>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="col-12">
                      <div className="d-flex align-items-start">
                        <div className="rounded-circle bg-dark bg-opacity-10 p-2 me-3">
                          <i className="bi bi-sticky text-dark"></i>
                        </div>
                        <div className="flex-grow-1">
                          <p className="text-muted small mb-0">Notes</p>
                          <p className="mb-0">{expense.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-top">
                  <div className="row text-muted small">
                    <div className="col-md-6">
                      <i className="bi bi-clock me-1"></i>
                      Created: {new Date(expense.created_at).toLocaleString()}
                    </div>
                    <div className="col-md-6 text-md-end">
                      <i className="bi bi-pencil me-1"></i>
                      Updated: {new Date(expense.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delete Button */}
            <div className="text-end mt-4">
              <button className="btn btn-outline-danger" onClick={handleDelete}>
                <i className="bi bi-trash me-2"></i>
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}