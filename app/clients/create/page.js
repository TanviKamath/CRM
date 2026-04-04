// app/clients/create/page.js
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientsForm from "../ClientsForm";

export default function CreateClient() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    router.push(`/clients/show/${data.id}?success=${encodeURIComponent("Client created successfully!")}`);
  };

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <div>
                <div className="d-flex align-items-center mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 48,
                      height: 48,
                      background: "linear-gradient(135deg, #374151 0%, #111827 100%)",
                      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
                    }}
                  >
                    <i className="bi bi-person-plus-fill text-white" style={{ fontSize: "1.25rem" }} />
                  </div>

                  <div>
                    <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.3px" }}>
                      Add New Client
                    </h2>
                    <p className="text-muted mb-0 small">
                      Create a client record for KYC and sales entries
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/clients"
                className="btn btn-outline-secondary px-4 d-flex align-items-center"
                style={{ borderRadius: 10 }}
              >
                <i className="bi bi-arrow-left me-2" />
                Back to List
              </Link>
            </div>

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/" className="text-decoration-none text-muted">
                    <i className="bi bi-house-door me-1" />
                    Dashboard
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/clients" className="text-decoration-none text-muted">
                    Clients
                  </Link>
                </li>
                <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
                  Add New
                </li>
              </ol>
            </nav>

            {/* Main Card */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
              {/* Card Header */}
              <div
                className="card-header bg-white py-4 px-4"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center me-3"
                    style={{ width: 40, height: 40, backgroundColor: "rgba(0,0,0,0.06)" }}
                  >
                    <i className="bi bi-building text-dark opacity-50" style={{ fontSize: "1.1rem" }} />
                  </div>
                  <div>
                    <div className="fw-bold">Client Information</div>
                    <div className="text-muted small">Add company and contact details</div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="card-body p-4">
                <ClientsForm submitButtonText="Create Client" onSubmit={handleSubmit} />
              </div>
            </div>

            {/* Helper Card */}
            <div
              className="card border-0 mt-4"
              style={{
                borderRadius: 12,
                background:
                  "linear-gradient(135deg, rgba(0, 0, 0, 0.04) 0%, rgba(0, 0, 0, 0.02) 100%)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-info-circle text-dark opacity-50" style={{ fontSize: "1.25rem" }} />
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Tip</h6>
                    <p className="text-muted small mb-0">
                      Keep email and contact name accurate. These fields are used across sales records and communication.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <style jsx global>{`
              .breadcrumb-item + .breadcrumb-item::before {
                color: rgba(0, 0, 0, 0.35);
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}