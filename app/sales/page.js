// app/sales/page.js
"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RecordSalePaymentModal from "./RecordSalePaymentModal";
import PaymentModeModal from "./PaymentModeModal";
import { generateInvoicePDF } from "../lib/generateInvoice";
import Skeleton from "../components/Skeleton";

function StatusPill({ status }) {
  const map = {
    pending: { bg: "warning", text: "Pending", icon: "bi-clock", textClass: "text-dark" },
    completed: { bg: "success", text: "Completed", icon: "bi-check2-circle", textClass: "" },
    cancelled: { bg: "danger", text: "Cancelled", icon: "bi-x-circle", textClass: "" },
  };
  const s = map[status] || { bg: "secondary", text: status || "Unknown", icon: "bi-info-circle", textClass: "" };

  return (
    <span className={`badge bg-${s.bg} ${s.textClass} px-2 py-1`} style={{ borderRadius: 999, fontSize: "0.75rem" }}>
      <i className={`bi ${s.icon} me-1`} />
      {s.text}
    </span>
  );
}

function PaymentStatusPill({ status, outstanding }) {
  let config;
  if (outstanding <= 0 || status === "completed") {
    config = { bg: "success", text: "Paid", icon: "bi-check-circle-fill" };
  } else if (status === "partial") {
    config = { bg: "info", text: "Partial", icon: "bi-pie-chart-fill" };
  } else {
    config = { bg: "warning", text: "On Terms", icon: "bi-hourglass-split", textClass: "text-dark" };
  }

  return (
    <span className={`badge bg-${config.bg} bg-opacity-10 text-${config.bg} ${config.textClass || ""} px-2 py-1`} style={{ borderRadius: 999, fontSize: "0.7rem" }}>
      <i className={`bi ${config.icon} me-1`} />
      {config.text}
    </span>
  );
}

const formatINR = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};


function StatPill({ icon, label, value, tone = "info" }) {
  return (
    <span className={`badge bg-${tone} bg-opacity-10 text-${tone} px-3 py-2`} style={{ borderRadius: 999 }}>
      <i className={`bi ${icon} me-2`} />
      <span className="me-1">{label}:</span>
      <span className="fw-semibold">{value}</span>
    </span>
  );
}

function ActionButton({ href, onClick, variant, icon, title, disabled = false, loading = false }) {
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

  const content = loading ? (
    <span className="spinner-border spinner-border-sm" role="status" />
  ) : (
    <i className={`bi ${icon}`} style={{ fontSize: "1.1rem" }} />
  );

  if (href) {
    return (
      <Link href={href} className={`btn btn-${variant}`} style={baseStyle} title={title}>
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
      disabled={disabled || loading}
    >
      {content}
    </button>
  );
}

function SalesIndexContent() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState(null);

  // Invoice generation state
  const [generatingInvoice, setGeneratingInvoice] = useState(null);

  // Payment mode modal state
  const [paymentModeModalOpen, setPaymentModeModalOpen] = useState(false);
  const [pendingInvoiceSaleId, setPendingInvoiceSaleId] = useState(null);

  // Search
  const [q, setQ] = useState("");

  const activeStatus = searchParams.get("status") || "";
  const paymentFilter = searchParams.get("payment") || "";

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      let url = `/api/sales?`;
      if (activeStatus) url += `status=${activeStatus}&`;
      if (paymentFilter) url += `payment_status=${paymentFilter}&`;

      const res = await fetch(url);
      const json = await res.json();

      const data = Array.isArray(json) ? json : json.data || [];
      setSales(data);
    } catch (err) {
      console.error(err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchSales();

    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
      const url = new URL(window.location.href);
      url.searchParams.delete("success");
      window.history.replaceState({}, "", url);
    }
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

  const handleRecordPayment = (saleId) => {
    setSelectedSaleId(saleId);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setSuccessMessage("Payment recorded successfully!");
    setPaymentModalOpen(false);
    fetchSales();
  };

  // Step 1: Open the payment mode modal
  const handleGenerateInvoice = (saleId) => {
    setPendingInvoiceSaleId(saleId);
    setPaymentModeModalOpen(true);
  };

  // Step 2: User picked a mode — now fetch sale data and generate
  const handlePaymentModeConfirm = async (paymentMode) => {
    setPaymentModeModalOpen(false);
    setGeneratingInvoice(pendingInvoiceSaleId);

    try {
      const response = await fetch(`/api/sales/${pendingInvoiceSaleId}/invoice`);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to fetch invoice data");
      }

      const sale = await response.json();
      const invoiceNo = generateInvoicePDF(sale, paymentMode);

      setSuccessMessage(`Invoice ${invoiceNo} opened in new tab!`);
    } catch (err) {
      console.error("Invoice error:", err);
      alert(err.message || "Failed to generate invoice");
    } finally {
      setGeneratingInvoice(null);
      setPendingInvoiceSaleId(null);
    }
  };

  const filteredSales = useMemo(() => {
    const query = q.trim().toLowerCase();
    const isLoose = user?.client_type === "Loose";
    if (!query) return sales;

    return sales.filter((s) => {
      const itemKey = isLoose 
        ? (s?.loose_item?.lot_number || s?.loose_lot_number || "")
        : (s?.diamond?.certificate_number || s?.diamond_certificate || "");
      const clientName = s?.client?.company_name || s?.client_company || "";
      const hay = [String(s.id ?? ""), itemKey, clientName, String(s.sale_amount_inr ?? ""), s.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [sales, q, user]);

  const totals = useMemo(() => {
    let totalInr = 0;
    let outstandingInr = 0;
    let receivedInr = 0;

    for (const s of filteredSales) {
      const amountInr = parseFloat(s.sale_amount_inr) || 0;
      const totalReceivedInr = parseFloat(s.total_received_inr) || 0;
      const saleOutstandingInr = Math.max(0, amountInr - totalReceivedInr);

      totalInr += amountInr;
      outstandingInr += saleOutstandingInr;
      receivedInr += totalReceivedInr;
    }

    return { totalInr, count: filteredSales.length, outstandingInr, receivedInr };
  }, [filteredSales]);

  const setFilter = (key, value) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
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
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  boxShadow: "0 6px 18px rgba(16,185,129,0.25)",
                }}
              >
                <i className="bi bi-graph-up-arrow text-white" style={{ fontSize: "1.3rem" }} />
              </div>

              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Sales
                </h2>
                <div className="text-muted">Track transactions, payments and receivables.</div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <StatPill icon="bi-collection" label="Sales" value={totals.count} tone="primary" />
              <StatPill icon="bi-cash-stack" label="Total" value={formatINR(totals.totalInr)} tone="info" />
              <StatPill icon="bi-check-circle" label="Received" value={formatINR(totals.receivedInr)} tone="success" />
              <StatPill icon="bi-hourglass-split" label="Outstanding" value={formatINR(totals.outstandingInr)} tone="warning" />
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link
              href="/sales/create"
              className="btn text-white px-4 py-2"
              style={{ borderRadius: 12, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              <i className="bi bi-plus-lg me-2" style={{ fontSize: "1.1rem" }} />
              New Sale
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle-fill me-2" style={{ fontSize: "1.2rem" }} />
            {successMessage}
            <button type="button" className="btn-close" onClick={() => setSuccessMessage("")} />
          </div>
        )}

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-5">
                <label className="form-label text-muted small mb-2">Quick Search</label>
                <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="form-control border-0"
                    placeholder="Search sales..."
                    style={{ boxShadow: "none" }}
                    suppressHydrationWarning
                  />
                  {q && (
                    <button type="button" className="btn btn-outline-secondary border-0" onClick={() => setQ("")}>
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-lg-3">
                <label className="form-label text-muted small mb-2">Sale Status</label>
                <select
                  className="form-select"
                  value={activeStatus}
                  onChange={(e) => setFilter("status", e.target.value)}
                  style={{ borderRadius: 12 }}
                  suppressHydrationWarning
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="col-lg-3">
                <label className="form-label text-muted small mb-2">Payment Status</label>
                <select
                  className="form-select"
                  value={paymentFilter}
                  onChange={(e) => setFilter("payment", e.target.value)}
                  style={{ borderRadius: 12 }}
                  suppressHydrationWarning
                >
                  <option value="">All Payments</option>
                  <option value="on_terms">On Terms</option>
                  <option value="partial">Partial</option>
                  <option value="completed">Fully Paid</option>
                </select>
              </div>

              <div className="col-lg-1">
                {(activeStatus || paymentFilter) && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    style={{ borderRadius: 12, height: 42 }}
                    onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("status");
                      url.searchParams.delete("payment");
                      window.location.href = url.toString();
                    }}
                    title="Clear filters"
                  >
                    <i className="bi bi-x-lg" style={{ fontSize: "1rem" }} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#ffffff" }}>
                  <tr>
                    <th className="px-4 py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>SALE</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>{user?.client_type === "Loose" ? "LOT ITEM" : "DIAMOND"}</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>CLIENT</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.8rem", fontWeight: 600 }}>AMOUNT (₹)</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.8rem", fontWeight: 600 }}>RECEIVED (₹)</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.8rem", fontWeight: 600 }}>OUTSTANDING (₹)</th>
                    <th className="py-3 text-muted text-center" style={{ fontSize: "0.8rem", fontWeight: 600 }}>STATUS</th>
                    <th className="py-3 text-muted text-center" style={{ width: 260, fontSize: "0.8rem", fontWeight: 600 }}>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton width="80px" height="18px" /><br/><Skeleton width="100px" height="12px" style={{ marginTop: 6 }} /></td>
                        <td className="py-3"><Skeleton width="120px" height="18px" /></td>
                        <td className="py-3"><Skeleton width="140px" height="18px" /></td>
                        <td className="py-3 text-end"><Skeleton width="90px" height="18px" /></td>
                        <td className="py-3 text-end"><Skeleton width="90px" height="18px" /></td>
                        <td className="py-3 text-end"><Skeleton width="90px" height="18px" /></td>
                        <td className="py-3 text-center">
                          <div className="d-flex flex-column align-items-center gap-1">
                            <Skeleton width="70px" height="22px" style={{ borderRadius: 999 }} />
                            <Skeleton width="60px" height="20px" style={{ borderRadius: 999 }} />
                          </div>
                        </td>
                        <td className="py-3 text-center">
                           <div className="d-flex gap-2 justify-content-center">
                             <Skeleton width="42px" height="42px" style={{ borderRadius: 10 }} />
                             <Skeleton width="42px" height="42px" style={{ borderRadius: 10 }} />
                             <Skeleton width="42px" height="42px" style={{ borderRadius: 10 }} />
                           </div>
                        </td>
                      </tr>
                    ))

                  ) : filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-5">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: 70, height: 70, backgroundColor: "rgba(108,117,125,0.08)" }}
                        >
                          <i className="bi bi-inbox text-muted" style={{ fontSize: "1.8rem" }} />
                        </div>
                        <div className="fw-semibold">No sales found</div>
                        <div className="text-muted small mb-3">Try changing filters or create a new sale.</div>
                        <Link href="/sales/create" className="btn btn-success px-4 py-2" style={{ borderRadius: 12 }}>
                          <i className="bi bi-plus-lg me-2" style={{ fontSize: "1.1rem" }} />
                          New Sale
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const diamondCert = sale?.diamond?.certificate_number || sale?.diamond_certificate || "-";
                      const clientName = sale?.client?.company_name || sale?.client_company || "-";

                      const saleAmountInr = parseFloat(sale.sale_amount_inr) || 0;
                      const totalReceivedInr = parseFloat(sale.total_received_inr) || 0;
                      const outstandingInr = Math.max(0, saleAmountInr - totalReceivedInr);

                      return (
                        <tr key={sale.id}>
                          <td className="px-4 py-3">
                            <Link className="text-decoration-none fw-semibold" href={`/sales/show/${sale.id}`}>
                              Sale #{sale.id}
                            </Link>
                            <div className="text-muted small">
                              <i className="bi bi-calendar3 me-1" />
                              {sale.selling_date
                                ? new Date(sale.selling_date).toLocaleDateString()
                                : sale.created_at
                                  ? new Date(sale.created_at).toLocaleDateString()
                                  : "-"}
                            </div>
                          </td>

                          <td className="py-3">
                            {sale.loose_diamond_item_id ? (
                              <Link className="text-decoration-none" href={`/loose-diamonds/${sale.loose_diamond_id || (sale.loose_item?.loose_diamond_id)}`}>
                                <i className="bi bi-box-seam me-2 text-info" />
                                {sale?.loose_item?.lot_number ? `LOT-${sale.loose_item.lot_number}` : (sale?.loose_lot_number ? `LOT-${sale.loose_lot_number}` : "Lot Item")}
                                <div className="small text-muted ms-4">
                                  {sale?.loose_item?.color_category} {sale?.loose_item?.size_category} / {sale?.loose_item?.grade}
                                </div>
                              </Link>
                            ) : (
                              sale.diamond_id ? (
                                <Link className="text-decoration-none" href={`/diamonds/show/${sale.diamond_id}`}>
                                  <i className="bi bi-gem me-2 text-info" />
                                  {diamondCert}
                                </Link>
                              ) : (
                                <span className="text-muted">{diamondCert}</span>
                              )
                            )}
                          </td>

                          <td className="py-3">
                            {sale.client_id ? (
                              <Link className="text-decoration-none" href={`/clients/show/${sale.client_id}`}>
                                <i className="bi bi-building me-2" style={{ color: "#8b5cf6" }} />
                                {clientName}
                              </Link>
                            ) : (
                              <span className="text-muted">{clientName}</span>
                            )}
                          </td>

                          <td className="py-3 text-end">
                            <div className="fw-semibold">{formatINR(saleAmountInr)}</div>
                          </td>

                          <td className="py-3 text-end">
                            <span className="text-success fw-medium">{formatINR(totalReceivedInr)}</span>
                          </td>

                          <td className="py-3 text-end">
                            <span className={outstandingInr > 0 ? "text-warning fw-semibold" : "text-success"}>
                              {formatINR(outstandingInr)}
                            </span>
                          </td>

                          <td className="py-3 text-center">
                            <div className="d-flex flex-column align-items-center gap-1">
                              <StatusPill status={sale.status} />
                              <PaymentStatusPill status={sale.payment_status} outstanding={outstandingInr} />
                            </div>
                          </td>

                          <td className="py-3 text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <ActionButton
                                href={`/sales/show/${sale.id}`}
                                variant="outline-info"
                                icon="bi-eye-fill"
                                title="View Sale"
                              />
                              <ActionButton
                                href={`/sales/edit/${sale.id}`}
                                variant="outline-warning"
                                icon="bi-pencil-fill"
                                title="Edit Sale"
                              />
                              <ActionButton
                                onClick={() => handleGenerateInvoice(sale.id)}
                                variant="outline-primary"
                                icon="bi-file-earmark-pdf-fill"
                                title="Download Invoice"
                                loading={generatingInvoice === sale.id}
                                disabled={generatingInvoice === sale.id}
                              />
                              {(outstandingInr > 0 && sale.status !== "cancelled") && (
                                <ActionButton
                                  onClick={() => handleRecordPayment(sale.id)}
                                  variant="success"
                                  icon="bi-cash-coin"
                                  title="Record Payment"
                                />
                              )}
                              <ActionButton
                                onClick={() => handleDelete(sale.id)}
                                variant="outline-danger"
                                icon="bi-trash-fill"
                                title="Delete Sale"
                              />
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
            <div
              className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fff" }}
            >
              <div className="text-muted small">
                Showing <span className="fw-semibold">{filteredSales.length}</span> sale{filteredSales.length !== 1 ? "s" : ""}
              </div>
              <div className="d-flex gap-3 text-muted small">
                <span>
                  <i className="bi bi-check-circle text-success me-1" />
                  Collected: <span className="fw-semibold text-success">{formatINR(totals.receivedInr)}</span>
                </span>
                <span>
                  <i className="bi bi-hourglass-split text-warning me-1" />
                  Pending: <span className="fw-semibold text-warning">{formatINR(totals.outstandingInr)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Record Payment Modal */}
        <RecordSalePaymentModal
          saleId={selectedSaleId}
          show={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedSaleId(null);
          }}
          onSuccess={handlePaymentSuccess}
        />

        {/* Payment Mode Modal (for invoice generation) */}
        <PaymentModeModal
          show={paymentModeModalOpen}
          loading={generatingInvoice !== null}
          onClose={() => {
            setPaymentModeModalOpen(false);
            setPendingInvoiceSaleId(null);
          }}
          onConfirm={handlePaymentModeConfirm}
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
            background-color: rgba(16, 185, 129, 0.03);
          }
          .form-select:focus,
          .form-control:focus {
            box-shadow: none !important;
            border-color: rgba(16, 185, 129, 0.35) !important;
          }
        `}</style>
      </div>
    </div>
  );
}

export default function SalesIndex() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <SalesIndexContent />
    </Suspense>
  );
}
