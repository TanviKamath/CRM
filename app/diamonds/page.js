// app/diamonds/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RecordPaymentModal from "./RecordPaymentModal";

function StatusPill({ status }) {
  const map = {
    available: { bg: "success", text: "Available", icon: "bi-check-circle" },
    sold: { bg: "danger", text: "Sold", icon: "bi-bag-check" },
    memo: { bg: "warning", text: "On Memo", icon: "bi-hourglass-split", textClass: "text-dark" },
    subject_to_sale: { bg: "info", text: "Subject to Sale", icon: "bi-info-circle" },
  };
  const s = map[status] || { bg: "secondary", text: status || "Unknown", icon: "bi-question-circle" };

  return (
    <span
      className={`badge bg-${s.bg} bg-opacity-10 text-${s.bg === "warning" ? "dark" : s.bg} px-3 py-2`}
      style={{ borderRadius: 999 }}
    >
      <i className={`bi ${s.icon} me-2`} />
      {s.text}
    </span>
  );
}

const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
};

const formatNum = (value) => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : num.toFixed(2);
};

// Reusable Action Button Component with bigger icons
function ActionButton({ href, onClick, variant, icon, title, disabled = false }) {
  const baseStyle = {
    borderRadius: 10,
    width: 42,
    height: 42,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
  };

  const content = (
    <>
      <i className={`bi ${icon}`} style={{ fontSize: "1.1rem" }} />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`btn btn-${variant}`}
        style={baseStyle}
        title={title}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`btn btn-${variant}`}
      style={baseStyle}
      title={title}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

export default function DiamondsIndexPage() {
  const searchParams = useSearchParams();

  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Search state
  const [q, setQ] = useState("");

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDiamondId, setSelectedDiamondId] = useState(null);

  const activeStatus = searchParams.get("availability") || "";

  // Fetch diamonds
  const fetchDiamonds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diamonds?availability=${activeStatus}`);
      if (!res.ok) throw new Error("Failed to fetch diamonds");
      const data = await res.json();
      setDiamonds(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      setDiamonds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiamonds();
    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
  }, [searchParams]);

  const handleDelete = async (id, cert) => {
    if (!confirm(`Delete diamond ${cert}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/diamonds/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete diamond");
      setSuccessMessage("Diamond deleted successfully!");
      fetchDiamonds();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredDiamonds = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return diamonds;
    return diamonds.filter((d) => {
      const hay = [
        d.certificate_number,
        d.stone_type,
        d.shape,
        d.color,
        d.clarity,
        String(d.weight ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [diamonds, q]);

  const stats = useMemo(() => {
    return {
      total: filteredDiamonds.length,
      weight: filteredDiamonds.reduce((sum, d) => sum + (parseFloat(d.weight) || 0), 0),
      value: filteredDiamonds.reduce((sum, d) => sum + (parseFloat(d.amount_usd) || 0), 0),
    };
  }, [filteredDiamonds]);

  const setAvailability = (val) => {
    const url = new URL(window.location.href);
    if (val) url.searchParams.set("availability", val);
    else url.searchParams.delete("availability");
    window.location.href = url.toString();
  };

  const openPaymentModal = (id) => {
    setSelectedDiamondId(id);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setSuccessMessage("Payment recorded successfully!");
    setShowPaymentModal(false);
    fetchDiamonds();
  };

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: 52,
                  height: 52,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 6px 18px rgba(102,126,234,0.25)",
                }}
              >
                <i className="bi bi-gem text-white" style={{ fontSize: "1.3rem" }} />
              </div>
              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Diamonds
                </h2>
                <div className="text-muted">Manage inventory, pricing and stock status.</div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ borderRadius: 999 }}>
                <i className="bi bi-collection me-2" />
                Total: {stats.total}
              </span>
              <span className="badge bg-info bg-opacity-10 text-info px-3 py-2" style={{ borderRadius: 999 }}>
                <i className="bi bi-speedometer2 me-2" />
                Weight: {formatNum(stats.weight)} ct
              </span>
              <span className="badge bg-success bg-opacity-10 text-success px-3 py-2" style={{ borderRadius: 999 }}>
                <i className="bi bi-cash-stack me-2" />
                Value: {formatCurrency(stats.value)}
              </span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href="/diamonds/create" className="btn btn-primary px-4 py-2" style={{ borderRadius: 12 }}>
              <i className="bi bi-plus-lg me-2" style={{ fontSize: "1.1rem" }} />
              Add Diamond
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="alert alert-success border-0 shadow-sm d-flex align-items-center mb-4" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle-fill me-2" style={{ fontSize: "1.2rem" }} />
            <div>{successMessage}</div>
            <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage("")} />
          </div>
        )}

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-6">
                <label className="form-label text-muted small mb-2">Search Inventory</label>
                <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="form-control border-0"
                    placeholder="Search cert, shape, color, clarity..."
                    style={{ boxShadow: "none" }}
                  />
                  {q && (
                    <button type="button" className="btn btn-outline-secondary border-0" onClick={() => setQ("")}>
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-lg-6">
                <label className="form-label text-muted small mb-2">Availability</label>
                <div className="d-flex gap-2">
                  <select
                    className="form-select border-0 bg-light"
                    value={activeStatus}
                    onChange={(e) => setAvailability(e.target.value)}
                    style={{ borderRadius: 12 }}
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="memo">On Memo</option>
                  </select>
                  {activeStatus && (
                    <button className="btn btn-outline-secondary" style={{ borderRadius: 12 }} onClick={() => setAvailability("")}>
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16, overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3 text-muted small text-uppercase">Certificate</th>
                  <th className="py-3 text-muted small text-uppercase">Details</th>
                  <th className="py-3 text-muted small text-uppercase text-end">Weight</th>
                  <th className="py-3 text-muted small text-uppercase text-end">Price</th>
                  <th className="py-3 text-muted small text-uppercase text-center">Status</th>
                  <th className="py-3 text-muted small text-uppercase text-center" style={{ width: 240 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredDiamonds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3" style={{ width: 64, height: 64 }}>
                        <i className="bi bi-gem text-muted fs-3" />
                      </div>
                      <div className="text-muted">No diamonds found matching criteria.</div>
                    </td>
                  </tr>
                ) : (
                  filteredDiamonds.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-3">
                        <Link href={`/diamonds/show/${d.id}`} className="text-decoration-none fw-semibold text-dark">
                          {d.certificate_number || "-"}
                        </Link>
                        <div className="small text-muted">{d.lab || "GIA"}</div>
                      </td>
                      <td className="py-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-light text-dark border">{d.shape}</span>
                          <span className="small text-muted">
                            {d.color} / {d.clarity} / {d.cut}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-end fw-medium">{formatNum(d.weight)} ct</td>
                      <td className="py-3 text-end fw-semibold text-dark">{formatCurrency(d.amount_usd)}</td>
                      <td className="py-3 text-center">
                        <StatusPill status={d.availability} />
                      </td>
                      <td className="py-3 text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          {/* View Button */}
                          <ActionButton
                            href={`/diamonds/show/${d.id}`}
                            variant="outline-primary"
                            icon="bi-eye-fill"
                            title="View Details"
                          />

                          {/* Edit Button */}
                          <ActionButton
                            href={`/diamonds/edit/${d.id}`}
                            variant="outline-warning"
                            icon="bi-pencil-fill"
                            title="Edit Diamond"
                          />

                          {/* Sell Button (only if available) */}
                          {d.availability === "available" && (
                            <ActionButton
                              href={`/sales/create?diamond_id=${d.id}`}
                              variant="outline-success"
                              icon="bi-cart-plus-fill"
                              title="Create Sale"
                            />
                          )}

                          {/* Payment Button (only if on terms) */}
                          {d.payment_status === "On Terms" && (
                            <ActionButton
                              onClick={() => openPaymentModal(d.id)}
                              variant="outline-info"
                              icon="bi-credit-card-fill"
                              title="Record Payment"
                            />
                          )}

                          {/* Delete Button */}
                          <ActionButton
                            onClick={() => handleDelete(d.id, d.certificate_number)}
                            variant="outline-danger"
                            icon="bi-trash-fill"
                            title="Delete Diamond"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white py-3 px-4">
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing <span className="fw-semibold">{filteredDiamonds.length}</span> diamonds
              </small>
              <small className="text-muted">
                <i className="bi bi-currency-dollar me-1" />
                Prices in USD
              </small>
            </div>
          </div>
        </div>
      </div>

      <RecordPaymentModal
        show={showPaymentModal}
        diamondId={selectedDiamondId}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />

      <style jsx global>{`
        .btn:focus {
          box-shadow: none !important;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .table tbody tr:hover {
          background-color: rgba(102, 126, 234, 0.03);
        }
      `}</style>
    </div>
  );
}