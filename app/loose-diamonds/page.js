"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Skeleton from "../components/Skeleton";
import RecordLotPaymentModal from "./RecordLotPaymentModal";

function StatusPill({ status }) {
  const map = {
    Active: { bg: "success", text: "Active", icon: "bi-check2-circle", textClass: "" },
    Inactive: { bg: "secondary", text: "Inactive", icon: "bi-x-circle", textClass: "" },
  };
  const s = map[status] || { bg: "light", text: status || "Unknown", icon: "bi-info-circle", textClass: "text-dark border" };

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
    config = { bg: "secondary", text: "Partial", icon: "bi-pie-chart-fill" };
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

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

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

export default function LooseDiamondDashboard() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentModalLotId, setPaymentModalLotId] = useState(null);
  const router = useRouter();
  const fileInputRef = useRef(null);

  const COLUMN_SYNONYMS = {
    lot_number: ["lot number", "lot#", "lot no", "packet no", "lotid", "parcel no"],
    color_category: ["color", "colour", "type", "color/type", "shade"],
    size_category: ["size", "sieve", "mm", "dimension"],
    grade: ["grade", "clarity", "purity", "quality"],
    carats: ["carats", "cts", "weight", "qty", "quantity"],
    base_price: ["base price", "price", "rate", "cost", "baserate"],
    discount_pct: ["discount", "disc%", "disc", "back"],
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) throw new Error("Excel file is empty");

        // 1. Map Headers
        const headers = Object.keys(rows[0]);
        const mapping = {};
        headers.forEach(h => {
          const lower = h.toLowerCase().trim();
          for (const [key, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
            if (synonyms.includes(lower)) {
              mapping[h] = key;
              break;
            }
          }
        });

        if (!mapping[Object.keys(rows[0]).find(h => mapping[h] === "lot_number")]) {
          throw new Error("Could not find 'Lot Number' column. Please check your Excel headers.");
        }

        // 2. Transformed & Grouped
        const groupedLots = {};
        rows.forEach(row => {
          const lotNumKey = Object.keys(mapping).find(h => mapping[h] === "lot_number");
          const lotNum = String(row[lotNumKey] || "").trim();
          if (!lotNum) return;

          if (!groupedLots[lotNum]) {
            groupedLots[lotNum] = {
              lot_number: lotNum,
              items: [],
              total_carats: 0,
              total_purchase_value: 0
            };
          }

          const item = {};
          Object.keys(mapping).forEach(h => {
            const systemKey = mapping[h];
            item[systemKey] = row[h];
          });

          // Ensure numeric values
          item.carats = parseFloat(item.carats || 0);
          item.base_price = parseFloat(item.base_price || 0);
          item.discount_pct = parseFloat(item.discount_pct || 0);
          item.final_price_per_carat = item.base_price * (1 + (item.discount_pct / 100));
          item.total_value = item.final_price_per_carat * item.carats;

          groupedLots[lotNum].items.push(item);
          groupedLots[lotNum].total_carats += item.carats;
          groupedLots[lotNum].total_purchase_value += item.total_value;
          
          // Use item base price as lot original price if not already set
          if (!groupedLots[lotNum].original_price_per_carat) {
            groupedLots[lotNum].original_price_per_carat = item.base_price;
          }
        });

        // 3. Finalize lot stats
        const finalLots = Object.values(groupedLots).map(lot => ({
          ...lot,
          original_price_per_carat: lot.total_carats > 0 ? (lot.total_purchase_value / lot.total_carats) : 0
        }));

        // 4. Submit
        const res = await fetch("/api/loose-diamonds/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lots: finalLots }),
        });

        if (res.ok) {
          alert(`Successfully imported ${finalLots.length} lots!`);
          fetchAndShowLots(); // Refresh
        } else {
          const err = await res.text();
          alert("Import failed: " + err);
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        setImporting(false);
        e.target.value = "";
      }
    };
    reader.readAsArrayBuffer(file);
  };


  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((user) => {
        if (user.client_type?.toLowerCase() !== "loose") {
          router.push("/");
        } else {
          fetchAndShowLots();
        }
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  const fetchAndShowLots = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/loose-diamonds");
      if (res.ok) {
        const data = await res.json();
        setLots(data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 py-5" style={{ background: "#f8f9fc" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div className="d-flex align-items-center gap-3">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)",
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
              }}
            >
              <i className="bi bi-layers-half text-white" style={{ fontSize: "1.5rem" }} />
            </div>
            <div>
              <h1 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-1px" }}>Loose Diamond Management</h1>
              <p className="text-muted mb-0 small uppercase fw-bold ls-1">Inventory & Bifurcation</p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              accept=".xlsx, .xls, .csv" 
              style={{ display: "none" }} 
            />
            <button 
              className="btn btn-outline-primary px-4 d-flex align-items-center shadow-sm"
              onClick={() => fileInputRef.current.click()}
              disabled={importing}
              style={{ borderRadius: "12px", fontWeight: "600", borderWidth: "1.5px" }}
            >
              {importing ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-file-earmark-spreadsheet me-2" />
              )}
              Bulk Import Excel
            </button>
            <Link href="/loose-diamonds/create" className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2" style={{ borderRadius: "12px", fontWeight: "600", boxShadow: "0 4px 12px rgba(13, 110, 253, 0.2)" }}>
              <i className="bi bi-plus-lg"></i>Create New Lot
            </Link>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="p-4 bg-white border-0 shadow-sm" style={{ borderRadius: "20px" }}>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="rounded-3 bg-primary-subtle p-2 text-primary"><i className="bi bi-box-fill"></i></div>
                <div className="text-muted small fw-bold text-uppercase">Total Lots</div>
              </div>
              <div className="h2 fw-bold mb-0">{lots.length}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white border-0 shadow-sm" style={{ borderRadius: "20px" }}>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="rounded-3 bg-success-subtle p-2 text-success"><i className="bi bi-gem"></i></div>
                <div className="text-muted small fw-bold text-uppercase">Total Carats</div>
              </div>
              <div className="h2 fw-bold mb-0">{lots.reduce((acc, lot) => acc + parseFloat(lot.total_carats), 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="p-4 bg-white border-0 shadow-sm" style={{ borderRadius: "20px" }}>
              <div className="d-flex align-items-center gap-3 mb-2">
                <div className="rounded-3 bg-info-subtle p-2 text-info"><i className="bi bi-currency-dollar"></i></div>
                <div className="text-muted small fw-bold text-uppercase">Total Purchase Value</div>
              </div>
              <div className="h2 fw-bold mb-0">{formatCurrency(lots.reduce((acc, lot) => acc + parseFloat(lot.total_purchase_value), 0))}</div>
            </div>
          </div>
        </div>

        {/* Lots List */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#ffffff" }}>
                  <tr>
                    <th className="px-4 py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>LOT NUMBER</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>SUPPLIER</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>CARATS</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.8rem", fontWeight: 600 }}>PURCHASE (₹)</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.8rem", fontWeight: 600 }}>PAID (₹)</th>
                    <th className="py-3 text-muted text-end" style={{ fontSize: "0.8rem", fontWeight: 600 }}>OUTSTANDING (₹)</th>
                    <th className="py-3 text-muted text-center" style={{ fontSize: "0.8rem", fontWeight: 600 }}>STATUS</th>
                    <th className="py-3 text-muted text-center" style={{ width: 220, fontSize: "0.8rem", fontWeight: 600 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton width="100px" height="20px" /><br/><Skeleton width="80px" height="14px" style={{ marginTop: 6 }} /></td>
                        <td className="py-3"><Skeleton width="120px" height="18px" /></td>
                        <td className="py-3"><Skeleton width="60px" height="20px" /></td>
                        <td className="py-3 text-end"><Skeleton width="90px" height="24px" /></td>
                        <td className="py-3 text-end"><Skeleton width="90px" height="24px" /></td>
                        <td className="py-3 text-end"><Skeleton width="90px" height="24px" /></td>
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
                  ) : lots.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: 70, height: 70, backgroundColor: "rgba(108,117,125,0.08)" }}
                        >
                          <i className="bi bi-inboxes text-muted" style={{ fontSize: "1.8rem" }} />
                        </div>
                        <div className="fw-semibold">No lots found</div>
                        <div className="text-muted small mb-3">Create your first loose diamond lot!</div>
                        <Link href="/loose-diamonds/create" className="btn btn-success px-4 py-2" style={{ borderRadius: 12 }}>
                          <i className="bi bi-plus-lg me-2" style={{ fontSize: "1.1rem" }} />
                          Add Lot
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    lots.map((lot) => {
                      const purchaseValueInr = parseFloat(lot.total_purchase_value) || 0;
                      const totalPaidInr = parseFloat(lot.total_paid) || 0;
                      const outstandingInr = Math.max(0, purchaseValueInr - totalPaidInr);

                      return (
                        <tr key={lot.id}>
                          <td className="px-4 py-3">
                            <Link className="text-decoration-none fw-semibold text-dark" href={`/loose-diamonds/${lot.id}`}>
                              LOT-{lot.lot_number}
                            </Link>
                            <div className="text-muted small">
                              <i className="bi bi-calendar3 me-1" />
                              {lot.purchase_date ? new Date(lot.purchase_date).toLocaleDateString() : "-"}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-dark">
                              <i className="bi bi-building me-2 text-dark opacity-50" />
                              {lot.supplier_name || "Direct Purchase"}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="fw-semibold">
                              {parseFloat(lot.total_carats - (lot.total_on_memo || 0)).toFixed(2)}
                              <span className="text-muted small ms-1">cts</span>
                            </div>
                            {parseFloat(lot.total_on_memo || 0) > 0 && (
                              <div className="badge bg-warning-subtle text-warning border-warning border-opacity-25 border p-1 px-2 mt-1" style={{ fontSize: '0.65rem' }}>
                                {parseFloat(lot.total_on_memo).toFixed(2)} on memo
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-end">
                            <div className="fw-semibold">{formatCurrency(purchaseValueInr)}</div>
                          </td>
                          <td className="py-3 text-end">
                            <span className="text-dark fw-medium opacity-75">{formatCurrency(totalPaidInr)}</span>
                          </td>
                          <td className="py-3 text-end">
                            <span className={outstandingInr > 0 ? "text-dark fw-semibold" : "text-dark opacity-50"}>
                              {formatCurrency(outstandingInr)}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <div className="d-flex flex-column align-items-center gap-1">
                              <StatusPill status={lot.status} />
                              <PaymentStatusPill status={lot.payment_status} outstanding={outstandingInr} />
                            </div>
                          </td>
                          <td className="py-3 text-center">
                            <div className="d-flex gap-2 justify-content-center">
                              <ActionButton
                                href={`/loose-diamonds/${lot.id}`}
                                variant="outline-info"
                                icon="bi-eye-fill"
                                title="View Lot"
                              />
                              <ActionButton
                                href={`/loose-diamonds/edit/${lot.id}`}
                                variant="outline-warning"
                                icon="bi-pencil-fill"
                                title="Edit Lot"
                              />
                              <ActionButton
                                onClick={() => setPaymentModalLotId(lot.id)}
                                variant="success"
                                icon="bi-cash-coin"
                                title="Record Payment"
                              />
                              <ActionButton
                                onClick={async () => {
                                  if (!confirm(`Delete LOT-${lot.lot_number}? This cannot be undone.`)) return;
                                  const res = await fetch(`/api/loose-diamonds/${lot.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    setLots((prev) => prev.filter((l) => l.id !== lot.id));
                                  } else {
                                    alert("Failed to delete lot.");
                                  }
                                }}
                                variant="outline-danger"
                                icon="bi-trash-fill"
                                title="Delete Lot"
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
                Showing <span className="fw-semibold">{lots.length}</span> lot{lots.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordLotPaymentModal
        lotId={paymentModalLotId}
        show={!!paymentModalLotId}
        onClose={() => setPaymentModalLotId(null)}
        onSuccess={() => fetchAndShowLots()}
      />

      <style jsx global>{`
        .ls-1 { letter-spacing: 1px; }
        .hover-primary:hover { background: #f0f7ff !important; border-color: #0071e3 !important; }
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
      `}</style>
    </div>
  );
}
