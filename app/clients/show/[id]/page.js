// app/clients/show/[id]/page.js
"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageSkeleton from "../../../components/PageSkeleton";

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

// Display value or N/A
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

function initialsOf(company, contact) {
  const base = (company || contact || "").trim();
  if (!base) return "C";
  return base.charAt(0).toUpperCase();
}

function InfoRow({ icon, label, value, href }) {
  const v = displayValue(value);
  return (
    <div className="d-flex align-items-start py-2">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
        style={{ width: 36, height: 36, backgroundColor: "rgba(0,0,0,0.06)" }}
      >
        <i className={`bi ${icon} text-dark opacity-50`} />
      </div>
      <div className="flex-grow-1">
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          {label}
        </div>
        <div className="fw-semibold">
          {href && v !== "N/A" ? (
            <a className="text-decoration-none text-dark border-bottom border-dark border-opacity-10" href={href}>
              {v}
            </a>
          ) : (
            v
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, children }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
      <div
        className="card-header bg-white border-0 py-4 px-4"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="d-flex align-items-center">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40, backgroundColor: "rgba(0,0,0,0.06)" }}
          >
            <i className={`bi ${icon} text-dark opacity-50`} style={{ fontSize: "1.1rem" }} />
          </div>
          <div>
            <div className="fw-bold">{title}</div>
            {subtitle ? <div className="text-muted small">{subtitle}</div> : null}
          </div>
        </div>
      </div>
      <div className="card-body p-4">{children}</div>
    </div>
  );
}

function ShowClientContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

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

    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
  }, [id, searchParams]);

  const initials = useMemo(
    () => initialsOf(client?.company_name, client?.contact_name),
    [client?.company_name, client?.contact_name]
  );

  const handleDelete = async () => {
    if (!client?.id) return;
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/clients?success=" + encodeURIComponent("Client deleted successfully!"));
    } catch (e) {
      alert("Failed to delete client");
    }
  };

  // Loading UI
  if (loading) {
    return <PageSkeleton />;
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
                    <button className="btn btn-outline-dark px-4" style={{ borderRadius: 10 }} onClick={() => window.location.reload()}>
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-dark px-4" style={{ borderRadius: 10 }} href="/clients">
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

  if (!client) {
    return (
      <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="container">
          <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle me-2" />
              <div className="fw-semibold">Client not found.</div>
            </div>
            <div className="mt-3">
              <Link href="/clients" className="btn btn-secondary">
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle me-2" />
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} />
          </div>
        )}

        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: 54,
                height: 54,
                background: "linear-gradient(135deg, #374151 0%, #111827 100%)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
              }}
            >
              <span className="text-white fw-bold" style={{ fontSize: "1.25rem" }}>
                {initials}
              </span>
            </div>

            <div>
              <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                {displayValue(client.company_name)}
              </h2>
              <div className="text-muted">
                {client.contact_name ? (
                  <>
                    <i className="bi bi-person me-2" />
                    {client.contact_name}
                  </>
                ) : (
                  "Client Details"
                )}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href={`/clients/edit/${client.id}`} className="btn btn-warning px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-pencil me-2" />
              Edit
            </Link>
            <Link href="/clients" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
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
            <li className="breadcrumb-item active text-dark fw-bold" aria-current="page">
              Details
            </li>
          </ol>
        </nav>

        {/* Content */}
        <div className="row g-4">
          <div className="col-lg-6">
            <SectionCard title="Contact" subtitle="Primary contact information" icon="bi-person-lines-fill">
              <InfoRow icon="bi-building" label="Company Name" value={client.company_name} />
              <InfoRow icon="bi-person" label="Contact Name" value={client.contact_name} />
              <InfoRow
                icon="bi-envelope"
                label="Email"
                value={client.email}
                href={client.email ? `mailto:${client.email}` : undefined}
              />
              <InfoRow
                icon="bi-telephone"
                label="Phone"
                value={client.phone}
                href={client.phone ? `tel:${client.phone}` : undefined}
              />
            </SectionCard>
          </div>

          <div className="col-lg-6">
            <SectionCard title="Address" subtitle="Billing / office address" icon="bi-geo-alt">
              <InfoRow icon="bi-geo-alt" label="Address" value={client.address} />
              <div className="pt-3 mt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted small">Created At</div>
                  <div className="fw-semibold">
                    <i className="bi bi-calendar3 me-2 text-muted" />
                    {formatDate(client.created_at)}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Danger Zone */}
          <div className="col-12">
            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: 16,
                backgroundColor: "rgba(220, 53, 69, 0.03)",
                border: "1px dashed rgba(220, 53, 69, 0.25)",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{ width: 42, height: 42, backgroundColor: "rgba(220,53,69,0.10)" }}
                    >
                      <i className="bi bi-exclamation-triangle text-danger" />
                    </div>
                    <div>
                      <div className="fw-bold text-danger">Delete Client</div>
                      <div className="text-muted small">This action cannot be undone.</div>
                    </div>
                  </div>

                  <button className="btn btn-outline-danger px-4" style={{ borderRadius: 10 }} onClick={handleDelete}>
                    <i className="bi bi-trash me-2" />
                    Delete
                  </button>
                </div>
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
  );
}

export default function ShowClient() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <ShowClientContent />
    </Suspense>
  );
}
