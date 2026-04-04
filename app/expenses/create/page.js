// app/expenses/create/page.js
"use client";

import Link from "next/link";
import ExpenseForm from "../ExpenseForm";

export default function CreateExpense() {
  return (
    <div className="container-fluid py-4" style={{ backgroundColor: "#f8f9fc", minHeight: "100vh" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 className="fw-bold mb-1">
                  <i className="bi bi-plus-circle me-2 text-dark opacity-50"></i>
                  Add New Expense
                </h2>
                <p className="text-muted mb-0">Record a new business expense</p>
              </div>
              <Link href="/expenses" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to List
              </Link>
            </div>

            {/* Form */}
            <ExpenseForm submitButtonText="Add Expense" />
          </div>
        </div>
      </div>
    </div>
  );
}