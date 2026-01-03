// app/brokers/create/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrokersForm from "../BrokersForm";

export default function CreateBroker() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      router.push(`/brokers/show/${data.id}?success=${encodeURIComponent("Broker created successfully!")}`);
    } catch (err) {
      throw err;
    }
  };

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
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)"
                    }}
                  >
                    <i className="bi bi-person-plus-fill text-white" style={{ fontSize: "1.25rem" }}></i>
                  </div>
                  <div>
                    <h2 className="fw-bold mb-0 text-dark">Add New Broker</h2>
                    <p className="text-muted mb-0 small">Fill in the details to register a new broker</p>
                  </div>
                </div>
              </div>
              <Link 
                href="/brokers" 
                className="btn btn-outline-secondary px-4 d-flex align-items-center"
                style={{ borderRadius: "8px" }}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to List
              </Link>
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
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  Add New
                </li>
              </ol>
            </nav>

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
                      backgroundColor: "rgba(102, 126, 234, 0.1)"
                    }}
                  >
                    <i className="bi bi-person-badge text-primary" style={{ fontSize: "1.1rem" }}></i>
                  </div>
                  <div>
                    <h5 className="fw-semibold mb-0">Broker Information</h5>
                    <small className="text-muted">Enter the broker's personal and business details</small>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body p-4">
                <BrokersForm
                  submitButtonText="Create Broker"
                  onSubmit={handleSubmit}
                />
              </div>
            </div>

            {/* Help Card */}
            <div 
              className="card border-0 mt-4"
              style={{ 
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)"
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-info-circle text-primary" style={{ fontSize: "1.25rem" }}></i>
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Need Help?</h6>
                    <p className="text-muted small mb-0">
                      Make sure to fill in all required fields marked with <span className="text-danger">*</span>. 
                      Commission rate is used to calculate broker fees on sales automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}