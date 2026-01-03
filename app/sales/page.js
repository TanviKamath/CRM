// app/sales/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function StatusPill({ status }) {
  const map = {
    pending: { bg: "warning", text: "Pending", icon: "bi-clock", textClass: "text-dark" },
    completed: { bg: "success", text: "Completed", icon: "bi-check2-circle", textClass: "" },
    cancelled: { bg: "danger", text: "Cancelled", icon: "bi-x-circle", textClass: "" },
  };
  const s = map[status] || { bg: "secondary", text: status || "Unknown", icon: "bi-info-circle", textClass: "" };

  return (
    <span className={`badge bg-${s.bg} ${s.textClass} px-3 py-2`} style={{ borderRadius: 999 }}>
      <i className={`bi ${s.icon} me-2`} />
      {s.text}
    </span>
  );
}

const formatCurrency = (value, symbol = "$") => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num)
    ? "-"
    : `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function StatPill({ icon, label, value, tone = "info" }) {
  return (
    <span
      className={`badge bg-${tone} bg-opacity-10 text-${tone} px-3 py-2`}
      style={{ borderRadius: 999 }}
    >
      <i className={`bi ${icon} me-2`} />
      <span className="me-1">{label}:</span>
      <span className="fw-semibold">{value}</span>
    </span>
  );
}

export default function SalesIndex() {
  const searchParams = useSearchParams();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // lightweight local search (filters current result set)
  const [q, setQ] = useState("");

  const activeStatus = searchParams.get("status") || "";

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales?status=${activeStatus}`);
      const data = await res.json();
      setSales(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();

    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sale? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sale");

      setSuccessMessage("Sale deleted successfully!");
      fetchSales();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredSales = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return sales;

    return sales.filter((s) => {
      const diamondCert = s?.diamond?.certificate_number || s?.diamond_certificate || "";
      const clientName = s?.client?.company_name || s?.client_company || "";
      const hay = [String(s.id ?? ""), diamondCert, clientName, String(s.sale_amount ?? ""), s.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [sales, q]);

  const totals = useMemo(() => {
    let usd = 0;
    let inr = 0;
    for (const s of filteredSales) {
      const a = parseFloat(s.sale_amount);
      const b = parseFloat(s.sale_amount_inr);
      if (!Number.isNaN(a)) usd += a;
      if (!Number.isNaN(b)) inr += b;
    }
    return { usd, inr, count: filteredSales.length };
  }, [filteredSales]);

  const setStatusFilter = (value) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("status", value);
    else url.searchParams.delete("status");
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
                  background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                  boxShadow: "0 6px 18px rgba(37,99,235,0.22)",
                }}
              >
                <i className="bi bi-graph-up-arrow text-white" style={{ fontSize: "1.3rem" }} />
              </div>

              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Sales
                </h2>
                <div className="text-muted">Track transactions, amounts and status.</div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <StatPill icon="bi-collection" label="Records" value={totals.count} tone="primary" />
              <StatPill icon="bi-cash-stack" label="Total USD" value={formatCurrency(totals.usd)} tone="info" />
              <StatPill icon="bi-currency-rupee" label="Total INR" value={formatCurrency(totals.inr, "₹")} tone="success" />
              {activeStatus && <StatPill icon="bi-filter" label="Filter" value={activeStatus} tone="secondary" />}
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href="/sales/create" className="btn btn-info text-white px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-plus-lg me-2" />
              New Sale
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle me-2" />
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} />
          </div>
        )}

        {/* Controls */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-7">
                <label className="form-label text-muted small mb-2">Quick Search</label>
                <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="form-control border-0"
                    placeholder="Search by sale id, diamond cert, client name..."
                    style={{ boxShadow: "none" }}
                  />
                  {q && (
                    <button type="button" className="btn btn-outline-secondary border-0" onClick={() => setQ("")} title="Clear">
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
                <div className="text-muted small mt-2">Search filters the current loaded list.</div>
              </div>

              <div className="col-lg-5">
                <label className="form-label text-muted small mb-2">Status Filter</label>
                <div className="d-flex gap-2 flex-wrap">
                  <select
                    className="form-select"
                    value={activeStatus}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ borderRadius: 12 }}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {activeStatus && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-3"
                      style={{ borderRadius: 12 }}
                      onClick={() => setStatusFilter("")}
                      title="Clear filter"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#ffffff" }}>
                  <tr>
                    <th className="px-4 py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Sale
                    </th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Diamond
                    </th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Client
                    </th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.85rem" }}>
                      Amount (USD)
                    </th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.85rem" }}>
                      Amount (INR)
                    </th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Status
                    </th>
                    <th className="py-3 text-muted text-center" style={{ width: 220, fontSize: "0.85rem" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <div className="spinner-border" role="status" style={{ color: "#0ea5e9" }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="text-muted mt-2">Loading sales...</div>
                      </td>
                    </tr>
                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style={{ width: 70, height: 70, backgroundColor: "rgba(108,117,125,0.08)" }}>
                          <i className="bi bi-inbox text-muted" style={{ fontSize: "1.8rem" }} />
                        </div>
                        <div className="fw-semibold">No sales found</div>
                        <div className="text-muted small mb-3">Try changing filters or create a new sale.</div>
                        <Link href="/sales/create" className="btn btn-info text-white px-4" style={{ borderRadius: 10 }}>
                          <i className="bi bi-plus-lg me-2" />
                          New Sale
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const diamondCert = sale?.diamond?.certificate_number || sale?.diamond_certificate || "-";
                      const clientName = sale?.client?.company_name || sale?.client_company || "-";
                      return (
                        <tr key={sale.id}>
                          <td className="px-4 py-3">
                            <div className="fw-semibold">
                              <Link className="text-decoration-none" href={`/sales/show/${sale.id}`}>
                                Sale #{sale.id}
                              </Link>
                            </div>
                            <div className="text-muted small">
                              <i className="bi bi-calendar3 me-1" />
                              {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : "-"}
                            </div>
                          </td>

                          <td className="py-3">
                            {sale.diamond_id ? (
                              <Link className="text-decoration-none" href={`/diamonds/show/${sale.diamond_id}`}>
                                <i className="bi bi-gem me-2 text-muted" />
                                {diamondCert}
                              </Link>
                            ) : (
                              <>
                                <i className="bi bi-gem me-2 text-muted" />
                                {diamondCert}
                              </>
                            )}
                          </td>

                          <td className="py-3">
                            {sale.client_id ? (
                              <Link className="text-decoration-none" href={`/clients/show/${sale.client_id}`}>
                                <i className="bi bi-building me-2 text-muted" />
                                {clientName}
                              </Link>
                            ) : (
                              <>
                                <i className="bi bi-building me-2 text-muted" />
                                {clientName}
                              </>
                            )}
                          </td>

                          <td className="py-3 text-end fw-semibold">{formatCurrency(sale.sale_amount)}</td>
                          <td className="py-3 text-end">{formatCurrency(sale.sale_amount_inr, "₹")}</td>

                          <td className="py-3">
                            <StatusPill status={sale.status} />
                          </td>

                          <td className="py-3 text-center">
                            <div className="btn-group" role="group" aria-label="Actions">
                              <Link
                                href={`/sales/show/${sale.id}`}
                                className="btn btn-sm btn-outline-info"
                                style={{ borderRadius: "10px 0 0 10px" }}
                                title="View"
                              >
                                <i className="bi bi-eye me-1" />
                                View
                              </Link>
                              <Link href={`/sales/edit/${sale.id}`} className="btn btn-sm btn-outline-warning" title="Edit">
                                <i className="bi bi-pencil me-1" />
                                Edit
                              </Link>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                style={{ borderRadius: "0 10px 10px 0" }}
                                title="Delete"
                                onClick={() => handleDelete(sale.id)}
                              >
                                <i className="bi bi-trash me-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fff" }}>
              <div className="text-muted small">
                Showing <span className="fw-semibold">{filteredSales.length}</span> sales
              </div>
              <div className="text-muted small">
                <i className="bi bi-shield-check me-2" />
                Data is stored securely.
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .btn:focus {
            box-shadow: none !important;
          }
          .form-select:focus {
            box-shadow: none !important;
            border-color: rgba(14, 165, 233, 0.35) !important;
          }
        `}</style>
      </div>
    </div>
  );
}