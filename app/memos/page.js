"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Skeleton from "../components/Skeleton";
import MemoEditModal from "../components/MemoEditModal";
import MemoViewModal from "../components/MemoViewModal";
import ActionButton from "../components/ActionButton";

function StatusPill({ status }) {
  const map = {
    active: { bg: "warning", text: "Active", icon: "bi-hourglass-split", textClass: "text-dark" },
    returned: { bg: "secondary", text: "Returned", icon: "bi-arrow-return-left", textClass: "" },
    sold: { bg: "success", text: "Sold", icon: "bi-check-circle", textClass: "" },
  };
  const s = map[status] || { bg: "light", text: status || "Unknown", icon: "bi-info-circle", textClass: "text-dark border" };

  return (
    <span className={`badge bg-${s.bg} ${s.textClass} px-2 py-1`} style={{ borderRadius: 999, fontSize: "0.75rem" }}>
      <i className={`bi ${s.icon} me-1`} />
      {s.text}
    </span>
  );
}

const formatINR = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

function StatPill({ icon, label, value }) {
  return (
    <span className="badge bg-dark bg-opacity-10 text-dark border-secondary border-opacity-25 border px-3 py-2" style={{ borderRadius: 999 }}>
      <i className={`bi ${icon} me-2 text-dark opacity-75`} />
      <span className="me-1 opacity-75">{label}:</span>
      <span className="fw-semibold">{value}</span>
    </span>
  );
}


function MemosIndexContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [memos, setMemos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [editingMemo, setEditingMemo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingMemo, setViewingMemo] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

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

  const fetchMemos = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/memo`);
      if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch memos");
      }
      const data = await res.json();
      setMemos(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setMemos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    fetchUser();
    fetchMemos();
  }, []);

  const handleAction = async (memo, action) => {
    if (action === 'convert_sale') {
      // Automate: No confirm, just redirect with full context
      const params = new URLSearchParams({
        diamond_id: memo.loose_diamond_item_id,
        client_id: memo.client_id,
        broker_id: memo.broker_id || "",
        sold_carats: memo.carats,
        sale_amount: (parseFloat(memo.carats) * parseFloat(memo.selling_price_per_carat || 0)).toFixed(2),
        memo_id: memo.id
      });
      router.push(`/sales/create?${params.toString()}`);
      return;
    }

    const confirmMsg = "Are you sure you want to return this memo?";
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/memo/${memo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, carats: memo.carats })
      });
      if (res.ok) {
        setSuccessMessage("Memo returned successfully!");
        fetchMemos();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (memo) => {
    setEditingMemo(memo);
    setShowEditModal(true);
  };

  const handleView = (memo) => {
    setViewingMemo(memo);
    setShowViewModal(true);
  };

  const filteredMemos = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return memos;

    return memos.filter((m) => {
      const lotNum = m.lot_number || "";
      const clientName = m.client_name || "";
      const brokerName = m.broker_name || "";
      const hay = [lotNum, clientName, brokerName, String(m.carats ?? ""), m.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [memos, q]);

  const totals = useMemo(() => {
    let totalCarats = 0;
    let estimatedValue = 0;

    for (const m of filteredMemos) {
      totalCarats += parseFloat(m.carats) || 0;
      estimatedValue += (parseFloat(m.carats) || 0) * (parseFloat(m.selling_price_per_carat) || 0);
    }

    return { totalCarats, estimatedValue, count: filteredMemos.length };
  }, [filteredMemos]);

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
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  boxShadow: "0 6px 18px rgba(245, 158, 11, 0.2)",
                }}
              >
                <i className="bi bi-hourglass-split text-white" style={{ fontSize: "1.3rem" }} />
              </div>

              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Memos
                </h2>
                <div className="text-muted">Manage items given on approval to clients.</div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <StatPill icon="bi-collection" label="Active Memos" value={totals.count} />
              <StatPill icon="bi-gem" label="Total Carats" value={totals.totalCarats.toFixed(3)} />
              <StatPill icon="bi-cash-stack" label="Est. Value" value={formatINR(totals.estimatedValue)} />
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link
              href="/diamonds/stock"
              className="btn btn-dark text-white px-4 py-2"
              style={{ borderRadius: 12, background: "linear-gradient(135deg, #374151 0%, #111827 100%)", border: "none" }}
            >
              <i className="bi bi-plus-lg me-2" style={{ fontSize: "1.1rem" }} />
              New Memo (via Stock)
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

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
            <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: "1.2rem" }} />
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")} />
          </div>
        )}

        {/* Search */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-12">
                <label className="form-label text-muted small mb-2">Quick Search</label>
                <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="form-control border-0"
                    placeholder="Search memos by lot, client, broker..."
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
                    <th className="px-4 py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>DATE</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>LOT ITEM</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>CARATS</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>EST. PRICE/CT</th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.8rem", fontWeight: 600 }}>CLIENT / BROKER</th>
                    <th className="py-3 text-muted text-center" style={{ fontSize: "0.8rem", fontWeight: 600 }}>STATUS</th>
                    <th className="py-3 text-muted text-center" style={{ width: 140, fontSize: "0.8rem", fontWeight: 600 }}>ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3"><Skeleton width="100px" height="18px" /></td>
                        <td className="py-3"><Skeleton width="120px" height="18px" /></td>
                        <td className="py-3"><Skeleton width="80px" height="18px" /></td>
                        <td className="py-3"><Skeleton width="100px" height="18px" /></td>
                        <td className="py-3"><Skeleton width="140px" height="18px" /></td>
                        <td className="py-3 text-center"><Skeleton width="70px" height="22px" style={{ borderRadius: 999 }} /></td>
                        <td className="py-3 text-center">
                           <div className="d-flex gap-2 justify-content-center">
                             <Skeleton width="42px" height="42px" style={{ borderRadius: 10 }} />
                             <Skeleton width="42px" height="42px" style={{ borderRadius: 10 }} />
                           </div>
                        </td>
                      </tr>
                    ))

                  ) : filteredMemos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: 70, height: 70, backgroundColor: "rgba(108,117,125,0.08)" }}
                        >
                          <i className="bi bi-inbox text-muted" style={{ fontSize: "1.8rem" }} />
                        </div>
                        <div className="fw-semibold">No active memos found</div>
                        <div className="text-muted small mb-3">Items on memo will appear here.</div>
                        <Link href="/diamonds/stock" className="btn btn-warning px-4 py-2" style={{ borderRadius: 12 }}>
                          View Stock to Give Memo
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredMemos.map((memo) => (
                      <tr key={memo.id}>
                        <td className="px-4 py-3">
                          <div className="fw-medium text-dark">
                            {hasMounted ? new Date(memo.created_at).toLocaleDateString() : ""}
                          </div>
                          <div className="text-muted small">#{memo.id}</div>
                        </td>

                        <td className="py-3">
                          <Link className="text-decoration-none text-dark fw-bold" href={`/loose-diamonds/${memo.loose_diamond_item_id}`}>
                            <i className="bi bi-box-seam me-2 text-dark opacity-50" />
                            LOT-{memo.lot_number}
                          </Link>
                        </td>

                        <td className="py-3 fw-bold">
                          {parseFloat(memo.carats).toFixed(3)} ct
                        </td>

                        <td className="py-3">
                          {formatINR(memo.selling_price_per_carat)}
                        </td>

                        <td className="py-3">
                          {memo.client_name && (
                            <div className="small font-weight-bold">
                              <i className="bi bi-person me-1"></i>{memo.client_name}
                            </div>
                          )}
                          {memo.broker_name && (
                            <div className="small text-muted">
                              <i className="bi bi-person-badge me-1"></i>{memo.broker_name}
                            </div>
                          )}
                        </td>

                        <td className="py-3 text-center">
                          <StatusPill status={memo.status} />
                        </td>

                        <td className="py-3 text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <ActionButton
                              onClick={() => handleView(memo)}
                              variant="outline-info"
                              icon="bi-eye"
                              title="View Details"
                            />
                            <ActionButton
                              onClick={() => handleEdit(memo)}
                              variant="outline-warning"
                              icon="bi-pencil"
                              title="Edit Memo"
                            />
                            <ActionButton
                              onClick={() => memo.status === 'active' && handleAction(memo, 'convert_sale')}
                              variant="success"
                              icon="bi-check-lg"
                              title="Mark as Sold"
                              disabled={memo.status !== 'active'}
                            />
                            <ActionButton
                              onClick={() => memo.status === 'active' && handleAction(memo, 'return')}
                              variant="outline-danger"
                              icon="bi-arrow-return-left"
                              title="Return Memo"
                              disabled={memo.status !== 'active'}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
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
                Showing <span className="fw-semibold">{filteredMemos.length}</span> memo{filteredMemos.length !== 1 ? "s" : ""}
              </div>
              <div className="text-muted small">
                Total Carats: <span className="fw-bold text-dark">{totals.totalCarats.toFixed(3)}</span> | 
                Est. Value: <span className="fw-bold text-dark">{formatINR(totals.estimatedValue)}</span>
              </div>
            </div>
          </div>
        </div>

        <MemoEditModal
          show={showEditModal}
          memo={editingMemo}
          onClose={() => setShowEditModal(false)}
          onRefresh={fetchMemos}
        />

        <MemoViewModal
          show={showViewModal}
          memo={viewingMemo}
          onClose={() => setShowViewModal(false)}
        />

        <style jsx global>{`
          .btn:focus { box-shadow: none !important; }
          .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
          .table tbody tr:hover { background-color: rgba(245, 158, 11, 0.03); }
          .form-control:focus { box-shadow: none !important; border-color: rgba(245, 158, 11, 0.35) !important; }
        `}</style>
      </div>
    </div>
  );
}

export default function MemosIndex() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <MemosIndexContent />
    </Suspense>
  );
}
