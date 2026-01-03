// app/expenses/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Expense categories
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

// Category colors
const CATEGORY_COLORS = {
  salaries: "primary",
  rent: "danger",
  utilities: "warning",
  office_supplies: "info",
  snacks: "success",
  travel: "secondary",
  marketing: "purple",
  insurance: "dark",
  maintenance: "warning",
  professional_fees: "info",
  taxes: "danger",
  miscellaneous: "secondary",
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
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ExpensesIndex() {
  const searchParams = useSearchParams();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    start_date: searchParams.get("start_date") || "",
    end_date: searchParams.get("end_date") || "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.category) params.set("category", filters.category);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);
      params.set("page", currentPage.toString());

      const res = await fetch(`/api/expenses?${params.toString()}`);

      if (!res.ok) throw new Error("Failed to fetch expenses");

      const data = await res.json();

      setExpenses(data.data || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setTotalAmount(data.totalAmount || 0);
    } catch (err) {
      console.error(err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();

    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [currentPage, filters, searchParams]);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      category: "",
      start_date: "",
      end_date: "",
    });
    setCurrentPage(1);
  };

  // Delete expense
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setSuccessMessage("Expense deleted successfully!");
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              <i className="bi bi-receipt me-2 text-primary"></i>
              Expenses
            </h2>
            <p className="text-muted mb-0">Track and manage your business expenses</p>
          </div>
          <Link href="/expenses/create" className="btn btn-primary px-4">
            <i className="bi bi-plus-lg me-2"></i>
            Add Expense
          </Link>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {successMessage}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccessMessage("")}
            ></button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-primary bg-opacity-10 p-3 me-3"
                    style={{ width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-cash-stack text-primary" style={{ fontSize: "1.5rem" }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Expenses</p>
                    <h4 className="fw-bold mb-0">{formatCurrency(totalAmount)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-success bg-opacity-10 p-3 me-3"
                    style={{ width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-receipt text-success" style={{ fontSize: "1.5rem" }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Total Records</p>
                    <h4 className="fw-bold mb-0">{totalItems}</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-circle bg-info bg-opacity-10 p-3 me-3"
                    style={{ width: "56px", height: "56px" }}
                  >
                    <i className="bi bi-graph-down text-info" style={{ fontSize: "1.5rem" }}></i>
                  </div>
                  <div>
                    <p className="text-muted mb-0 small">Average per Record</p>
                    <h4 className="fw-bold mb-0">
                      {totalItems > 0 ? formatCurrency(totalAmount / totalItems) : formatCurrency(0)}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label small fw-medium">Category</label>
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleFilterChange}
                  className="form-select"
                >
                  <option value="">All Categories</option>
                  {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-medium">From Date</label>
                <input
                  type="date"
                  name="start_date"
                  value={filters.start_date}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-medium">To Date</label>
                <input
                  type="date"
                  name="end_date"
                  value={filters.end_date}
                  onChange={handleFilterChange}
                  className="form-control"
                />
              </div>
              <div className="col-md-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-outline-secondary w-100"
                >
                  <i className="bi bi-x-lg me-2"></i>
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 px-4 py-3">Date</th>
                  <th className="border-0 py-3">Category</th>
                  <th className="border-0 py-3">Description</th>
                  <th className="border-0 py-3">Paid To</th>
                  <th className="border-0 py-3 text-end">Amount</th>
                  <th className="border-0 py-3 text-center" style={{ width: "150px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                      <i className="bi bi-inbox display-4 text-muted d-block mb-3"></i>
                      <p className="text-muted mb-0">No expenses found</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-3">
                        <span className="fw-medium">{formatDate(expense.expense_date)}</span>
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge bg-${CATEGORY_COLORS[expense.category] || "secondary"} bg-opacity-10 text-${CATEGORY_COLORS[expense.category] || "secondary"} px-3 py-2`}
                        >
                          {EXPENSE_CATEGORIES[expense.category] || expense.category}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="fw-medium">{expense.description}</div>
                        {expense.reference_number && (
                          <small className="text-muted">Ref: {expense.reference_number}</small>
                        )}
                      </td>
                      <td className="py-3 text-muted">{expense.paid_to || "-"}</td>
                      <td className="py-3 text-end">
                        <span className="fw-bold text-danger">{formatCurrency(expense.amount)}</span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="btn-group btn-group-sm">
                          <Link
                            href={`/expenses/show/${expense.id}`}
                            className="btn btn-outline-primary"
                            title="View"
                          >
                            <i className="bi bi-eye"></i>
                          </Link>
                          <Link
                            href={`/expenses/edit/${expense.id}`}
                            className="btn btn-outline-warning"
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            className="btn btn-outline-danger"
                            title="Delete"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-white border-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Showing {expenses.length} of {totalItems} expenses
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        Previous
                      </button>
                    </li>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) pageNum = currentPage - 2 + i;
                        if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
                      }
                      return (
                        <li
                          key={pageNum}
                          className={`page-item ${currentPage === pageNum ? "active" : ""}`}
                        >
                          <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}