// app/expenses/edit/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageSkeleton from "../../../components/PageSkeleton";
import ExpenseForm from "../../ExpenseForm";

export default function EditExpense() {
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

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
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
                  <i className="bi bi-pencil-square me-2 text-dark opacity-50"></i>
                  Edit Expense
                </h2>
                <p className="text-muted mb-0">Update expense details</p>
              </div>
              <Link href="/expenses" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to List
              </Link>
            </div>

            {/* Form */}
            <ExpenseForm initial={expense} submitButtonText="Update Expense" />
          </div>
        </div>
      </div>
    </div>
  );
}