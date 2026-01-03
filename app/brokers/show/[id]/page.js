// app/brokers/show/[id]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

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

const formatPercent = (v) => {
  if (v === null || v === undefined || v === "") return "N/A";
  const n = Number(v);
  if (Number.isNaN(n)) return "N/A";
  return `${n}%`;
};

function InfoRow({ icon, label, value, href }) {
  return (
    <div className="d-flex align-items-start py-2">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
        style={{ width: 36, height: 36, backgroundColor: "rgba(102,126,234,0.10)" }}
      >
        <i className={`bi ${icon} text-primary`} />
      </div>
      <div className="flex-grow-1">
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          {label}
        </div>
        <div className="fw-semibold">
          {href && value !== "N/A" ? (
            <a className="text-decoration-none" href={href}>
              {value}
            </a>
          ) : (
            value
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
            style={{ width: 40, height: 40, backgroundColor: "rgba(102,126,234,0.10)" }}
          >
            <i className={`bi ${icon} text-primary`} style={{ fontSize: "1.1rem" }} />
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

export default function ShowBroker() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;

  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchBroker = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/brokers/${id}`);
        if (!res.ok) throw new Error("Broker not found");
        const data = await res.json();
        setBroker(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load broker");
      } finally {
        setLoading(false);
      }
    };

    fetchBroker();

    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
  }, [id, searchParams]);

  const initials = useMemo(() => {
    const name = broker?.name || "";
    return name ? name.trim().charAt(0).toUpperCase() : "B";
  }, [broker?.name]);

  const handleDelete = async () => {
    if (!broker?.id) return;
    if (!confirm("Are you sure you want to delete this broker? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/brokers/${broker.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/brokers?success=" + encodeURIComponent("Broker deleted successfully!"));
    } catch (e) {
      alert("Failed to delete broker");
    }
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="text-center">
          <div className="spinner-border mb-3" role="status" style={{ width: "3rem", height: "3rem", color: "#667eea" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted">Loading broker details...</div>
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
                    style={{ width: 76, height: 76, backgroundColor: "rgba(220,53,69,0.10)" }}
                  >
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "2rem" }} />
                  </div>
                  <h4 className="fw-bold mb-2">Unable to load broker</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-outline-primary px-4" style={{ borderRadius: 10 }} onClick={() => window.location.reload()}>
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-primary px-4" style={{ borderRadius: 10 }} href="/brokers">
                      <i className="bi bi-arrow-left me-2" />
                      Back to Brokers
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

  if (!broker) {
    return (
      <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="container">
          <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle me-2" />
              <div className="fw-semibold">Broker not found.</div>
            </div>
            <div className="mt-3">
              <Link href="/brokers" className="btn btn-secondary">
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
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 6px 18px rgba(102,126,234,0.25)",
              }}
            >
              <span className="text-white fw-bold" style={{ fontSize: "1.25rem" }}>
                {initials}
              </span>
            </div>
            <div>
              <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                {displayValue(broker.name)}
              </h2>
              <div className="text-muted">
                {broker.company_name ? (
                  <>
                    <i className="bi bi-building me-2" />
                    {broker.company_name}
                  </>
                ) : (
                  "Broker Details"
                )}
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href={`/brokers/edit/${broker.id}`} className="btn btn-warning px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-pencil me-2" />
              Edit
            </Link>
            <Link href="/brokers" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
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
              <Link href="/brokers" className="text-decoration-none text-muted">
                Brokers
              </Link>
            </li>
            <li className="breadcrumb-item active text-primary" aria-current="page">
              Details
            </li>
          </ol>
        </nav>

        {/* Content */}
        <div className="row g-4">
          {/* Left */}
          <div className="col-lg-6">
            <SectionCard
              title="Contact"
              subtitle="Primary contact information"
              icon="bi-person-lines-fill"
            >
              <InfoRow icon="bi-person" label="Name" value={displayValue(broker.name)} />
              <InfoRow icon="bi-building" label="Company Name" value={displayValue(broker.company_name)} />
              <InfoRow
                icon="bi-envelope"
                label="Email"
                value={displayValue(broker.email)}
                href={broker.email ? `mailto:${broker.email}` : undefined}
              />
              <InfoRow
                icon="bi-telephone"
                label="Phone"
                value={displayValue(broker.phone)}
                href={broker.phone ? `tel:${broker.phone}` : undefined}
              />

              <div className="pt-3 mt-3 border-top">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-muted small">Commission Rate</div>
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ borderRadius: 10 }}>
                    <i className="bi bi-percent me-2" />
                    {formatPercent(broker.commission_rate)}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Right */}
          <div className="col-lg-6">
            <SectionCard
              title="Business"
              subtitle="Tax and banking details"
              icon="bi-briefcase"
            >
              <InfoRow icon="bi-receipt" label="Tax Number" value={displayValue(broker.tax_number)} />
              <InfoRow icon="bi-geo-alt" label="Address" value={displayValue(broker.address)} />
              <InfoRow icon="bi-bank" label="Bank Details" value={displayValue(broker.bank_details)} />

              <div className="pt-3 mt-3 border-top">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="text-muted small">Created At</div>
                  <div className="fw-semibold">
                    <i className="bi bi-calendar3 me-2 text-muted" />
                    {formatDate(broker.created_at)}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Notes */}
          {broker.notes && (
            <div className="col-12">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white border-0 py-4 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center me-3"
                      style={{ width: 40, height: 40, backgroundColor: "rgba(108,117,125,0.12)" }}
                    >
                      <i className="bi bi-journal-text text-secondary" style={{ fontSize: "1.1rem" }} />
                    </div>
                    <div>
                      <div className="fw-bold">Notes</div>
                      <div className="text-muted small">Additional information</div>
                    </div>
                  </div>
                </div>
                <div className="card-body p-4">
                  <div className="text-muted" style={{ whiteSpace: "pre-wrap" }}>
                    {broker.notes}
                  </div>
                </div>
              </div>
            </div>
          )}

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
                      <div className="fw-bold text-danger">Delete Broker</div>
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

        {/* Small style tweaks */}
        <style jsx global>{`
          .breadcrumb-item + .breadcrumb-item::before {
            color: rgba(0, 0, 0, 0.35);
          }
        `}</style>
      </div>
    </div>
  );
}