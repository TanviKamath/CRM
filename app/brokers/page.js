// app/brokers/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TableSkeleton from "../components/TableSkeleton";

const formatPercent = (v) => {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `${n}%`;
};

function initialsOf(name) {
  const s = (name || "").trim();
  if (!s) return "B";
  return s.charAt(0).toUpperCase();
}

function BrokerAvatar({ name }) {
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 38,
        height: 38,
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        boxShadow: "0 6px 18px rgba(102,126,234,0.22)",
      }}
      aria-hidden="true"
    >
      <span className="text-white fw-bold" style={{ fontSize: "0.95rem" }}>
        {initialsOf(name)}
      </span>
    </div>
  );
}

function BadgePill({ icon, text, tone = "primary" }) {
  return (
    <span
      className={`badge bg-${tone} bg-opacity-10 text-${tone} px-3 py-2`}
      style={{ borderRadius: 999 }}
    >
      <i className={`bi ${icon} me-2`} />
      {text}
    </span>
  );
}

export default function BrokersIndex() {
  const searchParams = useSearchParams();

  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Lightweight client-side search (optional; does not change API)
  const [q, setQ] = useState("");

  // Fetch brokers
  const fetchBrokers = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/brokers?page=${currentPage}`);
      if (!res.ok) throw new Error("Failed to fetch brokers");

      const data = await res.json();

      if (Array.isArray(data)) {
        setBrokers(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else {
        setBrokers(data.data || []);
        setTotalItems(data.total || data.data?.length || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();

    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchParams]);

  // Delete broker
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete broker "${name}"?`)) return;

    try {
      const res = await fetch(`/api/brokers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete broker");

      setSuccessMessage("Broker deleted successfully!");
      fetchBrokers();
    } catch (err) {
      alert(err.message);
    }
  };

  const dismissSuccess = () => setSuccessMessage("");

  const filteredBrokers = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return brokers;
    return brokers.filter((b) => {
      const hay = [
        b.name,
        b.company_name,
        b.email,
        b.phone,
        String(b.id ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [brokers, q]);

  const totalDisplayed = filteredBrokers.length;

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
                <i className="bi bi-person-badge-fill text-white" style={{ fontSize: "1.3rem" }} />
              </div>
              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Brokers
                </h2>
                <div className="text-muted">
                  Manage broker contacts, commission rates, and details.
                </div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <BadgePill icon="bi-collection" text={`${totalItems} Total`} tone="primary" />
              <BadgePill icon="bi-eye" text={`${totalDisplayed} Showing`} tone="success" />
              <BadgePill icon="bi-hash" text={`Page ${currentPage}${totalPages > 1 ? ` / ${totalPages}` : ""}`} tone="secondary" />
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href="/brokers/create" className="btn btn-primary px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-plus-lg me-2" />
              Add Broker
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle me-2" />
            {successMessage}
            <button type="button" className="btn-close" onClick={dismissSuccess} aria-label="Close" />
          </div>
        )}

        {/* Controls */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-6">
                <label className="form-label text-muted small mb-2">Quick Search</label>
                <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="form-control border-0"
                    placeholder="Search by name, email, company, phone..."
                    style={{ boxShadow: "none" }}
                  />
                  {q && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-0"
                      onClick={() => setQ("")}
                      title="Clear"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
                <div className="text-muted small mt-2">
                  Tip: This search filters the current page results.
                </div>
              </div>

              <div className="col-lg-6 d-flex justify-content-lg-end">
                <div
                  className="d-flex align-items-center gap-2 p-2"
                  style={{
                    backgroundColor: "rgba(102,126,234,0.06)",
                    border: "1px solid rgba(102,126,234,0.12)",
                    borderRadius: 14,
                  }}
                >
                  <i className="bi bi-info-circle text-primary ms-2" />
                  <div className="small text-muted me-2">
                    Click a broker name to open details.
                  </div>
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
                    <th className="px-4 py-3 text-muted" style={{ fontSize: "0.85rem" }}>Broker</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>Address</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>Contact</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.85rem" }}>Commission</th>
                    <th className="py-3 text-muted text-center" style={{ width: 200, fontSize: "0.85rem" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <TableSkeleton columns={5} rows={4} />
                  ) : filteredBrokers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: 70, height: 70, backgroundColor: "rgba(108,117,125,0.08)" }}
                        >
                          <i className="bi bi-inbox text-muted" style={{ fontSize: "1.8rem" }} />
                        </div>
                        <div className="fw-semibold">No brokers found</div>
                        <div className="text-muted small mb-3">Try clearing the search or add a new broker.</div>
                        <Link href="/brokers/create" className="btn btn-primary px-4" style={{ borderRadius: 10 }}>
                          <i className="bi bi-plus-lg me-2" />
                          Add Broker
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredBrokers.map((broker) => (
                      <tr key={broker.id}>
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <BrokerAvatar name={broker.name} />
                            <div>
                              <div className="fw-semibold">
                                <Link className="text-decoration-none" href={`/brokers/show/${broker.id}`}>
                                  {broker.name || "-"}
                                </Link>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3">
                          <div className="text-muted small">
                            <i className="bi bi-geo-alt me-1" />
                            {broker.address ? String(broker.address).slice(0, 50) + (String(broker.address).length > 50 ? "…" : "") : "-"}
                          </div>
                        </td>

                        <td className="py-3">
                          <div className="d-flex flex-column gap-1">
                            <div className="text-muted small">
                              <i className="bi bi-envelope me-2" />
                              {broker.email ? (
                                <a className="text-decoration-none" href={`mailto:${broker.email}`}>
                                  {broker.email}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                            <div className="text-muted small">
                              <i className="bi bi-telephone me-2" />
                              {broker.phone ? (
                                <a className="text-decoration-none" href={`tel:${broker.phone}`}>
                                  {broker.phone}
                                </a>
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 text-end">
                          <span
                            className="badge bg-primary bg-opacity-10 text-primary px-3 py-2"
                            style={{ borderRadius: 999 }}
                          >
                            <i className="bi bi-percent me-2" />
                            {formatPercent(broker.commission_rate)}
                          </span>
                        </td>

                        <td className="py-3 text-center">
                          <div className="btn-group" role="group" aria-label="Actions">
                            <Link
                              href={`/brokers/show/${broker.id}`}
                              className="btn btn-sm btn-outline-primary"
                              title="View"
                              style={{ borderRadius: "10px 0 0 10px" }}
                            >
                              <i className="bi bi-eye me-1" />
                              View
                            </Link>
                            <Link
                              href={`/brokers/edit/${broker.id}`}
                              className="btn btn-sm btn-outline-warning"
                              title="Edit"
                            >
                              <i className="bi bi-pencil me-1" />
                              Edit
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              title="Delete"
                              style={{ borderRadius: "0 10px 10px 0" }}
                              onClick={() => handleDelete(broker.id, broker.name)}
                            >
                              <i className="bi bi-trash me-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer / Pagination */}
            <div
              className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fff" }}
            >
              <div className="text-muted small">
                Showing <span className="fw-semibold">{filteredBrokers.length}</span> on this page
                {totalItems ? (
                  <>
                    {" "}
                    • Total <span className="fw-semibold">{totalItems}</span>
                  </>
                ) : null}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Page navigation">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                        First
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? "active" : ""}`}>
                          <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}

                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                        Last
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* Global tweaks */}
        <style jsx global>{`
          .page-link:focus {
            box-shadow: none !important;
          }
          a:focus {
            outline: none !important;
          }
          .btn:focus {
            box-shadow: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}