// app/diamonds/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

export default function DiamondsIndexPage() {
  const searchParams = useSearchParams();

  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Client-side search
  const [q, setQ] = useState("");

  const activeStatus = searchParams.get("availability") || "";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleDelete = async (id, cert) => {
    if (!confirm(`Delete diamond ${cert}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/diamonds/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
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
            <Link href="/diamonds/create" className="btn btn-primary px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-plus-lg me-2" />
              Add Diamond
            </Link>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="alert alert-success border-0 shadow-sm d-flex align-items-center mb-4" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle-fill me-2" />
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
                  <th className="py-3 text-muted small text-uppercase text-center" style={{ width: 180 }}>
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
                        <div className="btn-group btn-group-sm">
                          <Link href={`/diamonds/show/${d.id}`} className="btn btn-outline-primary" title="View">
                            <i className="bi bi-eye" />
                          </Link>
                          <Link href={`/diamonds/edit/${d.id}`} className="btn btn-outline-warning" title="Edit">
                            <i className="bi bi-pencil" />
                          </Link>
                          {d.availability === "available" && (
                            <Link href={`/sales/create?diamond_id=${d.id}`} className="btn btn-outline-success" title="Sell">
                              <i className="bi bi-cart-plus" />
                            </Link>
                          )}
                          <button
                            className="btn btn-outline-danger"
                            title="Delete"
                            onClick={() => handleDelete(d.id, d.certificate_number)}
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer bg-white py-3">
            <small className="text-muted">
              Showing {filteredDiamonds.length} records • Prices in USD
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}