// app/clients/edit/[id]/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ClientsForm from "../../ClientsForm";

function initialsOf(name) {
  const s = (name || "").trim();
  if (!s) return "C";
  return s.charAt(0).toUpperCase();
}

export default function EditClient() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initials = useMemo(() => initialsOf(client?.company_name || client?.contact_name), [client]);

  // Fetch client data
  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/clients/${id}`);
        if (!res.ok) throw new Error("Client not found");
        const data = await res.json();
        setClient(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load client");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    router.push(`/clients/show/${id}?success=${encodeURIComponent("Client updated successfully!")}`);
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem", color: "#22c55e", borderWidth: "0.2rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading client details...</p>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm text-center" style={{ borderRadius: 16 }}>
                <div className="card-body p-5">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                    style={{ width: 80, height: 80, backgroundColor: "rgba(220,53,69,0.10)" }}
                  >
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "2rem" }} />
                  </div>
                  <h4 className="fw-bold mb-2">Unable to load client</h4>
                  <p className="text-muted mb-4">{error}</p>

                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-outline-success px-4"
                      style={{ borderRadius: 10 }}
                      onClick={() => window.location.reload()}
                    >
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-success px-4" style={{ borderRadius: 10 }} href="/clients">
                      <i className="bi bi-arrow-left me-2" />
                      Back to Clients
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
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-10 col-xl-8">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: 50,
                  height: 50,
                  background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                  boxShadow: "0 6px 18px rgba(34, 197, 94, 0.22)",
                }}
              >
                <i className="bi bi-pencil-square text-white" style={{ fontSize: "1.25rem" }} />
              </div>
              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Edit Client
                </h2>
                <div className="text-muted small">Update client details used across sales and records</div>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Link
                href={`/clients/show/${id}`}
                className="btn btn-outline-success px-3 d-flex align-items-center"
                style={{ borderRadius: 10 }}
              >
                <i className="bi bi-eye me-2" />
                View
              </Link>
              <Link
                href="/clients"
                className="btn btn-outline-secondary px-3 d-flex align-items-center"
                style={{ borderRadius: 10 }}
              >
                <i className="bi bi-arrow-left me-2" />
                Back
              </Link>
            </div>
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
              <li className="breadcrumb-item">
                <Link href={`/clients/show/${id}`} className="text-decoration-none text-muted">
                  {client?.company_name || client?.contact_name || `#${id}`}
                </Link>
              </li>
              <li className="breadcrumb-item active text-success" aria-current="page">
                Edit
              </li>
            </ol>
          </nav>

          {/* Context Card */}
          <div
            className="card border-0 shadow-sm mb-4"
            style={{
              borderRadius: 12,
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.06) 0%, rgba(16, 185, 129, 0.05) 100%)",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: 56,
                    height: 56,
                    background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                  }}
                >
                  <span className="text-white fw-bold" style={{ fontSize: "1.25rem" }}>
                    {initials}
                  </span>
                </div>

                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-1">{client?.company_name || "Client"}</h5>
                  <div className="d-flex flex-wrap gap-3 text-muted small">
                    {client?.contact_name && (
                      <span>
                        <i className="bi bi-person me-1" />
                        {client.contact_name}
                      </span>
                    )}
                    {client?.email && (
                      <span>
                        <i className="bi bi-envelope me-1" />
                        {client.email}
                      </span>
                    )}
                    {client?.phone && (
                      <span>
                        <i className="bi bi-telephone me-1" />
                        {client.phone}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className="badge px-3 py-2"
                  style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#16a34a", borderRadius: 10 }}
                >
                  <i className="bi bi-pencil me-1" />
                  Editing
                </span>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
            <div className="card-header bg-white py-4 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="d-flex align-items-center">
                <div
                  className="rounded-3 d-flex align-items-center justify-content-center me-3"
                  style={{ width: 40, height: 40, backgroundColor: "rgba(34, 197, 94, 0.10)" }}
                >
                  <i className="bi bi-building text-success" style={{ fontSize: "1.1rem" }} />
                </div>
                <div>
                  <div className="fw-bold">Client Information</div>
                  <div className="text-muted small">Modify company and contact details</div>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <ClientsForm initial={client} submitButtonText="Update Client" onSubmit={handleSubmit} />
            </div>
          </div>

          {/* Tip */}
          <div
            className="card border-0 mt-4"
            style={{
              borderRadius: 12,
              backgroundColor: "rgba(34, 197, 94, 0.05)",
              borderLeft: "4px solid #22c55e",
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex">
                <div className="me-3">
                  <i className="bi bi-lightbulb text-success" style={{ fontSize: "1.25rem" }} />
                </div>
                <div>
                  <h6 className="fw-semibold mb-1">Quick Tip</h6>
                  <p className="text-muted small mb-0">
                    Keep the email accurate. It’s used for invoices, notifications, and sales records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <style jsx global>{`
            .breadcrumb-item + .breadcrumb-item::before {
              color: rgba(0, 0, 0, 0.35);
            }
            .btn:focus {
              box-shadow: none !important;
            }
          `}</style>
        </div>
      </div>
    </div>
    </div>
  );
}