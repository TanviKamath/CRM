// app/brokers/edit/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import BrokersForm from "../../BrokersForm";

export default function EditBroker() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch broker data
  useEffect(() => {
    if (!id) return;

    const fetchBroker = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/brokers/${id}`);

        if (!res.ok) {
          throw new Error("Broker not found");
        }

        const data = await res.json();
        setBroker(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBroker();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      const res = await fetch(`/api/brokers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      router.push(`/brokers/show/${id}?success=${encodeURIComponent("Broker updated successfully!")}`);
    } catch (err) {
      throw err;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div 
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{ backgroundColor: "#f8f9fc" }}
      >
        <div className="text-center">
          <div 
            className="spinner-border mb-3" 
            role="status"
            style={{ 
              width: "3rem", 
              height: "3rem", 
              color: "#667eea",
              borderWidth: "0.2rem"
            }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading broker details...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div 
        className="min-vh-100 py-5"
        style={{ backgroundColor: "#f8f9fc" }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div 
                className="card border-0 shadow-sm text-center py-5"
                style={{ borderRadius: "16px" }}
              >
                <div className="card-body p-5">
                  <div 
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                    style={{ 
                      width: "80px", 
                      height: "80px", 
                      backgroundColor: "rgba(220, 53, 69, 0.1)"
                    }}
                  >
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "2rem" }}></i>
                  </div>
                  <h4 className="fw-bold mb-2">Oops! Something went wrong</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex justify-content-center gap-3">
                    <button 
                      onClick={() => window.location.reload()} 
                      className="btn btn-outline-primary px-4"
                      style={{ borderRadius: "8px" }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Try Again
                    </button>
                    <Link 
                      href="/brokers" 
                      className="btn btn-primary px-4"
                      style={{ borderRadius: "8px" }}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Back to List
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-vh-100 py-5"
      style={{ backgroundColor: "#f8f9fc" }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <div className="d-flex align-items-center mb-2">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: "48px", 
                      height: "48px", 
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      boxShadow: "0 4px 15px rgba(245, 158, 11, 0.3)"
                    }}
                  >
                    <i className="bi bi-pencil-square text-white" style={{ fontSize: "1.25rem" }}></i>
                  </div>
                  <div>
                    <h2 className="fw-bold mb-0 text-dark">Edit Broker</h2>
                    <p className="text-muted mb-0 small">Update broker information and details</p>
                  </div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Link 
                  href={`/brokers/show/${id}`}
                  className="btn btn-outline-primary px-3 d-flex align-items-center"
                  style={{ borderRadius: "8px" }}
                >
                  <i className="bi bi-eye me-2"></i>
                  View
                </Link>
                <Link 
                  href="/brokers" 
                  className="btn btn-outline-secondary px-3 d-flex align-items-center"
                  style={{ borderRadius: "8px" }}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </Link>
              </div>
            </div>

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/" className="text-decoration-none text-muted">
                    <i className="bi bi-house-door me-1"></i>
                    Dashboard
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/brokers" className="text-decoration-none text-muted">
                    Brokers
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={`/brokers/show/${id}`} className="text-decoration-none text-muted">
                    {broker?.name || `#${id}`}
                  </Link>
                </li>
                <li className="breadcrumb-item active text-warning" aria-current="page">
                  Edit
                </li>
              </ol>
            </nav>

            {/* Current Broker Info Card */}
            <div 
              className="card border-0 shadow-sm mb-4"
              style={{ 
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)"
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: "56px", 
                      height: "56px", 
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    }}
                  >
                    <span className="text-white fw-bold" style={{ fontSize: "1.25rem" }}>
                      {broker?.name?.charAt(0).toUpperCase() || "B"}
                    </span>
                  </div>
                  <div className="flex-grow-1">
                    <h5 className="fw-bold mb-1">{broker?.name}</h5>
                    <div className="d-flex flex-wrap gap-3 text-muted small">
                      {broker?.company_name && (
                        <span>
                          <i className="bi bi-building me-1"></i>
                          {broker.company_name}
                        </span>
                      )}
                      {broker?.email && (
                        <span>
                          <i className="bi bi-envelope me-1"></i>
                          {broker.email}
                        </span>
                      )}
                      {broker?.commission_rate && (
                        <span>
                          <i className="bi bi-percent me-1"></i>
                          {broker.commission_rate}% Commission
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span 
                      className="badge px-3 py-2"
                      style={{ 
                        backgroundColor: "rgba(245, 158, 11, 0.1)",
                        color: "#d97706",
                        borderRadius: "8px"
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editing
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Card */}
            <div 
              className="card border-0 shadow-sm overflow-hidden"
              style={{ borderRadius: "16px" }}
            >
              {/* Card Header */}
              <div 
                className="card-header bg-white py-4 px-4"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="d-flex align-items-center">
                  <div 
                    className="rounded-3 d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: "40px", 
                      height: "40px", 
                      backgroundColor: "rgba(245, 158, 11, 0.1)"
                    }}
                  >
                    <i className="bi bi-person-badge text-warning" style={{ fontSize: "1.1rem" }}></i>
                  </div>
                  <div>
                    <h5 className="fw-semibold mb-0">Broker Information</h5>
                    <small className="text-muted">Modify the broker's personal and business details</small>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body p-4">
                <BrokersForm
                  initial={broker}
                  submitButtonText="Update Broker"
                  onSubmit={handleSubmit}
                />
              </div>
            </div>

            {/* Warning Card */}
            <div 
              className="card border-0 mt-4"
              style={{ 
                borderRadius: "12px",
                backgroundColor: "rgba(245, 158, 11, 0.05)",
                borderLeft: "4px solid #f59e0b"
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-lightbulb text-warning" style={{ fontSize: "1.25rem" }}></i>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Quick Tip</h6>
                    <p className="text-muted small mb-0">
                      Changes to commission rate will only affect new sales. Existing sales will retain their original brokerage calculations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div 
              className="card border-0 mt-4"
              style={{ 
                borderRadius: "12px",
                backgroundColor: "rgba(220, 53, 69, 0.03)",
                border: "1px dashed rgba(220, 53, 69, 0.2)"
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "1.25rem" }}></i>
                    </div>
                    <div>
                      <h6 className="fw-semibold mb-0 text-danger">Danger Zone</h6>
                      <small className="text-muted">Permanently delete this broker record</small>
                    </div>
                  </div>
                  <button 
                    className="btn btn-outline-danger px-4"
                    style={{ borderRadius: "8px" }}
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this broker? This action cannot be undone.")) return;
                      try {
                        const res = await fetch(`/api/brokers/${id}`, { method: "DELETE" });
                        if (res.ok) {
                          router.push("/brokers?success=" + encodeURIComponent("Broker deleted successfully!"));
                        }
                      } catch (err) {
                        alert("Failed to delete broker");
                      }
                    }}
                  >
                    <i className="bi bi-trash me-2"></i>
                    Delete Broker
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}