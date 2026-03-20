// app/sales/show/[id]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageSkeleton from "../../../components/PageSkeleton";

// ---------- helpers ----------
const formatCurrency = (value, symbol = "₹") => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "-";
  return `${symbol}${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : num.toFixed(decimals);
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
};

const displayValue = (value) => (value === null || value === undefined || value === "" ? "-" : value);

function StatusBadge({ status }) {
  const map = {
    pending: { bg: "warning", text: "Pending", icon: "bi-clock" },
    completed: { bg: "success", text: "Completed", icon: "bi-check2-circle" },
    cancelled: { bg: "danger", text: "Cancelled", icon: "bi-x-circle" },
  };
  const s = map[status] || { bg: "secondary", text: status || "Unknown", icon: "bi-info-circle" };

  return (
    <span className={`badge bg-${s.bg} ${s.bg === "warning" ? "text-dark" : ""} px-3 py-2`} style={{ borderRadius: 999 }}>
      <i className={`bi ${s.icon} me-2`} />
      {s.text}
    </span>
  );
}

function SectionCard({ title, subtitle, icon, accent = "info", children }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
      <div className="card-header bg-white border-0 py-4 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="d-flex align-items-center">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40, backgroundColor: `rgba(14,165,233,0.10)` }}
          >
            <i className={`bi ${icon} text-${accent}`} style={{ fontSize: "1.1rem" }} />
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

function InfoRow({ label, value, icon, href }) {
  const v = displayValue(value);
  return (
    <div className="d-flex align-items-start py-2">
      <div
        className="rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
        style={{ width: 36, height: 36, backgroundColor: "rgba(14,165,233,0.10)" }}
      >
        <i className={`bi ${icon} text-info`} />
      </div>
      <div className="flex-grow-1">
        <div className="text-muted" style={{ fontSize: "0.8rem" }}>
          {label}
        </div>
        <div className="fw-semibold">
          {href && v !== "-" ? (
            <a className="text-decoration-none" href={href}>
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

function initialsOf(text) {
  const s = (text || "").trim();
  if (!s) return "S";
  return s.charAt(0).toUpperCase();
}

// ---------- page ----------
export default function SalesShow() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id;

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [user, setUser] = useState(null);

  // Auth guard and fetch user
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) {
          router.replace("/auth/login");
        } else {
          return r.json();
        }
      })
      .then(data => {
        if (data) setUser(data);
      })
      .catch(() => router.replace("/auth/login"));
  }, [router]);

  useEffect(() => {
    if (!id) return;

    const fetchSale = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/sales/${id}`);
        if (!res.ok) throw new Error("Sale not found");
        const data = await res.json();
        setSale(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load sale");
      } finally {
        setLoading(false);
      }
    };

    fetchSale();

    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
  }, [id, searchParams]);

  const diamond = sale?.diamond || {};
  const loose_item = sale?.loose_item || {};
  const client = sale?.client || {};
  const broker = sale?.broker || {};

  const headline = useMemo(() => {
    if (sale?.loose_diamond_item_id) {
        return `Lot ${loose_item?.lot_number || sale?.loose_lot_number || "Item"}`;
    }
    const cert = diamond?.certificate_number ? `Diamond ${diamond.certificate_number}` : "Sale";
    return cert;
  }, [diamond?.certificate_number, sale?.loose_diamond_item_id, loose_item, sale?.loose_lot_number]);

  const avatarLetter = useMemo(() => {
    const text = client?.company_name || loose_item?.lot_number || sale?.loose_lot_number || diamond?.certificate_number;
    return initialsOf(text);
  }, [client?.company_name, loose_item?.lot_number, sale?.loose_lot_number, diamond?.certificate_number]);

  const updateStatus = async (nextStatus) => {
    if (!sale) return;

    const confirmText =
      nextStatus === "completed"
        ? "Mark this sale as completed?"
        : nextStatus === "cancelled"
          ? "Cancel this sale?"
          : "Update sale status?";

    if (!confirm(confirmText)) return;

    try {
      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sale, status: nextStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const deleteSale = async () => {
    if (!sale) return;
    if (!confirm("Are you sure you want to delete this sale? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/sales?success=" + encodeURIComponent("Sale deleted successfully!"));
    } catch {
      alert("Failed to delete sale");
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
                  <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 80, height: 80, backgroundColor: "rgba(220,53,69,0.10)" }}>
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "2rem" }} />
                  </div>
                  <h4 className="fw-bold mb-2">Unable to load sale</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-outline-info px-4" style={{ borderRadius: 10 }} onClick={() => window.location.reload()}>
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-info px-4" style={{ borderRadius: 10 }} href="/sales">
                      <i className="bi bi-arrow-left me-2" />
                      Back to Sales
                    </Link>
                  </div>
                </div>
              </div>
              <div className="text-center text-muted small mt-3">If this keeps happening, verify the sales API endpoint.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="container">
          <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: 14 }}>
            <div className="d-flex align-items-center">
              <i className="bi bi-info-circle me-2" />
              <div className="fw-semibold">Sale not found.</div>
            </div>
            <div className="mt-3">
              <Link href="/sales" className="btn btn-secondary">
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
                background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                boxShadow: "0 6px 18px rgba(37,99,235,0.22)",
              }}
            >
              <span className="text-white fw-bold" style={{ fontSize: "1.25rem" }}>
                {avatarLetter}
              </span>
            </div>

            <div>
              <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                Sale #{sale.id}
              </h2>
              <div className="text-muted d-flex flex-wrap gap-2 align-items-center">
                <span className="me-2">
                  <i className="bi bi-calendar3 me-2" />
                  {formatDate(sale.created_at)}
                </span>
                <StatusBadge status={sale.status} />
                <span className="badge bg-info bg-opacity-10 text-info px-3 py-2" style={{ borderRadius: 999 }}>
                  <i className="bi bi-cash-stack me-2" />
                  {formatCurrency(sale.sale_amount_inr || sale.sale_amount)}
                </span>
                <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-2" style={{ borderRadius: 999 }}>
                  <i className="bi bi-gem me-2" />
                  {headline}
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href={`/sales/edit/${sale.id}`} className="btn btn-warning px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-pencil me-2" />
              Edit
            </Link>
            <Link href="/sales" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
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
              <Link href="/sales" className="text-decoration-none text-muted">
                Sales
              </Link>
            </li>
            <li className="breadcrumb-item active text-info" aria-current="page">
              Details
            </li>
          </ol>
        </nav>

        {/* Summary tiles */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 44, height: 44, backgroundColor: "rgba(14,165,233,0.10)" }}>
                    <i className="bi bi-cash-coin text-info" />
                  </div>
                  <div>
                    <div className="text-muted small">Total Amount (₹)</div>
                    <div className="fw-bold fs-5">{formatCurrency(sale.sale_amount_inr || sale.sale_amount)}</div>
                  </div>
                </div>
                <div className="text-muted small mt-2">
                  Discount: <span className="fw-semibold">{formatNumber(sale.sale_rap_discount)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 44, height: 44, backgroundColor: "rgba(34,197,94,0.10)" }}>
                    <i className="bi bi-currency-exchange text-success" />
                  </div>
                  <div>
                    <div className="text-muted small">Sale Amount (INR)</div>
                    <div className="fw-bold fs-5">{sale.sale_amount_inr ? formatCurrency(sale.sale_amount_inr, "₹") : "-"}</div>
                  </div>
                </div>
                <div className="text-muted small mt-2">
                  Conversion: <span className="fw-semibold">{sale.conversion_rate ? formatNumber(sale.conversion_rate) : "-"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 14 }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: 44, height: 44, backgroundColor: "rgba(245,158,11,0.12)" }}>
                    <i className="bi bi-percent text-warning" />
                  </div>
                  <div>
                    <div className="text-muted small">Brokerage (INR)</div>
                    <div className="fw-bold fs-5">{sale.brokerage_amount ? formatCurrency(sale.brokerage_amount, "₹") : "-"}</div>
                  </div>
                </div>
                <div className="text-muted small mt-2">
                  Rate: <span className="fw-semibold">{sale.brokerage_rate ? `${formatNumber(sale.brokerage_rate)}%` : "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail sections */}
        <div className="row g-4">
          <div className="col-lg-6">
            {sale?.loose_diamond_item_id ? (
              <SectionCard title="Lot Item" subtitle="Loose diamond information" icon="bi-box-seam" accent="info">
                <InfoRow
                  icon="bi-hash"
                  label="Lot Number"
                  value={loose_item?.lot_number || sale?.loose_lot_number}
                  href={`/loose-diamonds/${loose_item?.loose_diamond_id || sale?.loose_diamond_id}`}
                />
                <InfoRow icon="bi-palette" label="Color Category" value={loose_item?.color_category} />
                <InfoRow icon="bi-aspect-ratio" label="Size Category" value={loose_item?.size_category} />
                <InfoRow icon="bi-award" label="Grade" value={loose_item?.grade} />
                <InfoRow icon="bi-speedometer2" label="Carats" value={loose_item?.carats ? `${formatNumber(loose_item.carats)} ct` : "-"} />
              </SectionCard>
            ) : (
              <SectionCard title="Diamond" subtitle="Stone information" icon="bi-gem" accent="info">
                <InfoRow
                  icon="bi-hash"
                  label="Certificate Number"
                  value={diamond.certificate_number}
                  href={diamond.id ? `/diamonds/show/${diamond.id}` : undefined}
                />
                <InfoRow icon="bi-diagram-3" label="Stone Type" value={diamond.stone_type} />
                <InfoRow icon="bi-bounding-box" label="Shape" value={diamond.shape} />
                <InfoRow icon="bi-speedometer2" label="Weight" value={diamond.weight ? `${formatNumber(diamond.weight)} carats` : "-"} />
                <div className="pt-3 mt-3 border-top">
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <div className="text-muted small">Color</div>
                      <div className="fw-semibold">{displayValue(diamond.color)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">Clarity</div>
                      <div className="fw-semibold">{displayValue(diamond.clarity)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">Cut</div>
                      <div className="fw-semibold">{displayValue(diamond.cut)}</div>
                    </div>
                    <div className="col-sm-6">
                      <div className="text-muted small">Polish</div>
                      <div className="fw-semibold">{displayValue(diamond.pol)}</div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            )}
          </div>

          <div className="col-lg-6">
            <SectionCard title="Client" subtitle="Buyer information" icon="bi-building" accent="info">
              <InfoRow
                icon="bi-building"
                label="Company Name"
                value={client.company_name}
                href={client.id ? `/clients/show/${client.id}` : undefined}
              />
              <InfoRow icon="bi-person" label="Contact Name" value={client.contact_name} />
              <InfoRow icon="bi-envelope" label="Email" value={client.email} href={client.email ? `mailto:${client.email}` : undefined} />
              <InfoRow icon="bi-telephone" label="Phone" value={client.phone} href={client.phone ? `tel:${client.phone}` : undefined} />
            </SectionCard>
          </div>

          {sale.broker && (
            <div className="col-lg-6">
              <SectionCard title="Broker" subtitle="Optional broker info" icon="bi-person-badge" accent="info">
                <InfoRow
                  icon="bi-person"
                  label="Name"
                  value={broker.name}
                  href={broker.id ? `/brokers/show/${broker.id}` : undefined}
                />
                <InfoRow icon="bi-building" label="Company" value={broker.company_name} />
                <InfoRow icon="bi-envelope" label="Email" value={broker.email} href={broker.email ? `mailto:${broker.email}` : undefined} />
                <InfoRow icon="bi-telephone" label="Phone" value={broker.phone} href={broker.phone ? `tel:${broker.phone}` : undefined} />
              </SectionCard>
            </div>
          )}

          <div className="col-lg-6">
            <SectionCard title="Sale Details" subtitle="Amounts and status" icon="bi-receipt" accent="info">
              <InfoRow icon="bi-calendar3" label="Sale Date" value={formatDate(sale.selling_date)} />
              <InfoRow icon="bi-cash-stack" label="Sale Amount (INR)" value={formatCurrency(sale.sale_amount_inr || sale.sale_amount)} />
              <InfoRow icon="bi-graph-down" label="Brokerage Rate" value={sale.brokerage_rate ? `${formatNumber(sale.brokerage_rate)}%` : "-"} />
              <InfoRow icon="bi-currency-rupee" label="Brokerage Amount (INR)" value={sale.brokerage_amount ? formatCurrency(sale.brokerage_amount, "₹") : "-"} />

              <div className="pt-3 mt-3 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="text-muted small">Status</div>
                <StatusBadge status={sale.status} />
              </div>
            </SectionCard>
          </div>

          {sale.notes && (
            <div className="col-12">
              <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                <div className="card-header bg-white border-0 py-4 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  <div className="d-flex align-items-center">
                    <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(108,117,125,0.12)" }}>
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
                    {sale.notes}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="col-lg-6">
            <SectionCard title="Record Information" subtitle="Audit timestamps" icon="bi-clock-history" accent="info">
              <InfoRow icon="bi-clock" label="Created At" value={sale.created_at ? new Date(sale.created_at).toLocaleString() : "-"} />
              <InfoRow icon="bi-pencil" label="Updated At" value={sale.updated_at ? new Date(sale.updated_at).toLocaleString() : "-"} />
            </SectionCard>
          </div>

          {/* Actions */}
          <div className="col-12">
            <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div className="d-flex gap-2 flex-wrap">
                    {sale.status === "pending" && (
                      <button className="btn btn-success px-4" style={{ borderRadius: 10 }} onClick={() => updateStatus("completed")}>
                        <i className="bi bi-check2-circle me-2" />
                        Mark as Completed
                      </button>
                    )}
                    {sale.status === "pending" && (
                      <button className="btn btn-outline-danger px-4" style={{ borderRadius: 10 }} onClick={() => updateStatus("cancelled")}>
                        <i className="bi bi-x-circle me-2" />
                        Cancel Sale
                      </button>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <Link href={`/sales/edit/${sale.id}`} className="btn btn-warning px-4" style={{ borderRadius: 10 }}>
                      <i className="bi bi-pencil me-2" />
                      Edit
                    </Link>
                    <button className="btn btn-outline-danger px-4" style={{ borderRadius: 10 }} onClick={deleteSale}>
                      <i className="bi bi-trash me-2" />
                      Delete
                    </button>
                    <Link href="/sales" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
                      <i className="bi bi-arrow-left me-2" />
                      Back
                    </Link>
                  </div>
                </div>

                <div className="text-muted small mt-3">
                  <i className="bi bi-shield-check me-2" />
                  Actions are logged and changes reflect immediately.
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
          a:focus {
            outline: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}