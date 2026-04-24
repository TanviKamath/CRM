// app/loose-diamonds/RecordLotPaymentModal.jsx
"use client";

import { useState, useEffect } from "react";

export default function RecordLotPaymentModal({ lotId, show, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (show && lotId !== null && lotId !== undefined) {
            fetchPaymentDetails();
            setAmount("");
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod("");
            setReference("");
            setNotes("");
            setError("");
        }
    }, [show, lotId]);

    const fetchPaymentDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/loose-diamonds/${lotId}/payment`);
            if (!res.ok) throw new Error("Failed to load payment details");
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const paymentAmount = parseFloat(amount);

        if (!paymentAmount || paymentAmount <= 0) {
            setError("Please enter a valid amount");
            return;
        }

        const currentOutstanding = parseFloat(data?.outstanding_inr) || 0;
        if (paymentAmount > currentOutstanding + 0.01) {
            setError("Payment cannot exceed outstanding amount");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/loose-diamonds/${lotId}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: paymentAmount,
                    payment_date: paymentDate,
                    payment_method: paymentMethod || null,
                    reference: reference || null,
                    notes: notes || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.message || "Failed to record payment");
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatCurrency = (value) => {
        const num = parseFloat(value) || 0;
        // Adjust symbol depending on what loose_diamonds uses, previously screenshot showed $
        return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };



    if (!show) return null;

    const purchaseAmountInr = parseFloat(data?.purchase_amount_inr) || 0;
    const totalPaidInr = parseFloat(data?.total_paid_inr) || 0;
    const currentOutstandingInr = parseFloat(data?.outstanding_inr) || 0;
    const newPayment = parseFloat(amount) || 0;
    const remainingOutstanding = currentOutstandingInr - newPayment;
    const paymentProgress = purchaseAmountInr > 0 ? ((totalPaidInr / purchaseAmountInr) * 100) : 0;

    return (
        <>
            <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1040 }}
                onClick={onClose}
            />

            <div
                className="position-fixed top-50 start-50 translate-middle"
                style={{ zIndex: 1050, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto" }}
            >
                <div className="bg-white shadow-lg" style={{ borderRadius: 20, overflow: "hidden", animation: "modalSlideIn 0.3s ease-out" }}>
                    <div className="px-4 py-4" style={{ background: "linear-gradient(135deg, #374151 0%, #111827 100%)" }}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex align-items-center gap-3">
                                <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: 52, height: 52, backgroundColor: "rgba(255,255,255,0.2)" }}>
                                    <i className="bi bi-cash-coin text-white" style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h5 className="fw-bold text-white mb-1">Record Payment to Supplier</h5>
                                    <div className="text-white-50 small">
                                        <i className="bi bi-receipt me-1" />Lot #{data?.lot_number || lotId}
                                    </div>
                                </div>
                            </div>
                            <button type="button" className="btn btn-link text-white p-0" onClick={onClose} style={{ opacity: 0.8 }}>
                                <i className="bi bi-x-lg" style={{ fontSize: "1.2rem" }} />
                            </button>
                        </div>
                    </div>

                    <div className="p-4">
                        {loading && !data && (
                            <div className="text-center py-5">
                                <div className="spinner-border mb-3" style={{ width: "3rem", height: "3rem", color: "#374151" }} />
                                <div className="text-muted">Loading payment details...</div>
                            </div>
                        )}

                        {error && (
                            <div className="alert border-0 d-flex align-items-start mb-4" style={{ borderRadius: 12, backgroundColor: "rgba(220,53,69,0.08)", color: "#dc3545" }}>
                                <i className="bi bi-exclamation-triangle me-2 mt-1" />
                                <div className="flex-grow-1">{error}</div>
                                <button type="button" className="btn-close btn-close-sm" onClick={() => setError("")} />
                            </div>
                        )}

                        {data && (
                            <form onSubmit={handleSubmit}>
                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <div className="p-3 h-100" style={{ borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className="bi bi-gem text-dark opacity-50" />
                                                <span className="text-muted small">Lot Information</span>
                                            </div>
                                            <div className="fw-semibold">Lot #LOT-{data.lot_number || "-"}</div>
                                            <div className="text-muted small">
                                                {parseFloat(data.total_carats).toFixed(2)} cts
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="p-3 h-100" style={{ borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className="bi bi-building text-dark opacity-50" />
                                                <span className="text-muted small">Supplier</span>
                                            </div>
                                            <div className="fw-semibold">{data.supplier_name || "Direct Purchase"}</div>
                                            <div className="text-muted small">{data.purchase_date ? formatDate(data.purchase_date) : "-"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4 p-3" style={{ borderRadius: 14, backgroundColor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small fw-medium">Payment Progress</span>
                                        <span className={`badge px-2 py-1 ${paymentProgress >= 100 ? 'bg-success' : 'bg-dark bg-opacity-10 text-dark border'}`} style={{ borderRadius: 999 }}>
                                            {paymentProgress.toFixed(1)}% paid
                                        </span>
                                    </div>
                                    <div className="progress mb-2" style={{ height: 10, borderRadius: 999, backgroundColor: "rgba(16,185,129,0.12)" }}>
                                        <div
                                            className="progress-bar"
                                            style={{
                                                width: `${Math.min(paymentProgress, 100)}%`,
                                                borderRadius: 999,
                                                background: paymentProgress >= 100 ? "linear-gradient(90deg, #10b981 0%, #059669 100%)" : "#374151"
                                            }}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-between small">
                                        <span className={`${paymentProgress >= 100 ? 'text-success' : 'text-dark fw-medium'} opacity-75`}>{formatCurrency(totalPaidInr)} paid</span>
                                        <span className="text-muted">of {formatCurrency(purchaseAmountInr)}</span>
                                    </div>
                                </div>

                                <div className="row g-3 mb-4">
                                    <div className="col-4">
                                        <div className="p-3 text-center" style={{ borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                            <div className="text-muted small mb-1">Purchase Amount</div>
                                            <div className="fw-bold text-dark">{formatCurrency(purchaseAmountInr)}</div>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-3 text-center" style={{ borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                            <div className="text-muted small mb-1">Paid</div>
                                            <div className="fw-bold text-dark">{formatCurrency(totalPaidInr)}</div>
                                        </div>
                                    </div>
                                    <div className="col-4">
                                        <div className="p-3 text-center" style={{ borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                            <div className="text-muted small mb-1">Outstanding</div>
                                            <div className="fw-bold text-dark">
                                                {formatCurrency(currentOutstandingInr)}
                                            </div>
                                        </div>
                                    </div>
                                </div>



                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="flex-grow-1" style={{ height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
                                    <span className="text-muted small text-uppercase fw-medium">Record Payment</span>
                                    <div className="flex-grow-1" style={{ height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-medium">
                                        <i className="bi bi-currency-dollar me-2 text-dark opacity-50" />
                                        Amount Paid <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group input-group-lg" style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)" }}>
                                        <span className="input-group-text bg-white border-0" style={{ fontSize: "1.2rem" }}>₹</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={currentOutstandingInr}
                                            className="form-control border-0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            required
                                            autoFocus
                                            style={{ fontSize: "1.3rem", fontWeight: 600, boxShadow: "none" }}
                                        />
                                    </div>
                                    <div className="d-flex gap-2 mt-2 flex-wrap">
                                        {[25, 50, 75].map(pct => (
                                            <button
                                                key={pct}
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => setAmount((currentOutstandingInr * pct / 100).toFixed(2))}
                                                style={{ borderRadius: 8, fontSize: "0.8rem" }}
                                            >
                                                {pct}%
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-success"
                                            onClick={() => setAmount(currentOutstandingInr.toFixed(2))}
                                            style={{ borderRadius: 8, fontSize: "0.8rem" }}
                                        >
                                            Full Amount
                                        </button>
                                    </div>
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <label className="form-label fw-medium">
                                            <i className="bi bi-calendar3 me-2 text-dark opacity-50" />Payment Date
                                        </label>
                                        <input type="date" className="form-control" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} style={{ borderRadius: 12 }} />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-medium">
                                            <i className="bi bi-wallet2 me-2 text-secondary" />Method
                                        </label>
                                        <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ borderRadius: 12 }}>
                                            <option value="">Select</option>
                                            <option value="wire_transfer">Wire Transfer</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="check">Check</option>
                                            <option value="cash">Cash</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-medium">
                                        <i className="bi bi-hash me-2 text-secondary" />Reference / Transaction ID
                                    </label>
                                    <input type="text" className="form-control" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g., WIRE-2024-001234" style={{ borderRadius: 12 }} />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-medium">
                                        <i className="bi bi-sticky me-2 text-secondary" />Notes
                                    </label>
                                    <textarea className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} style={{ borderRadius: 12 }} />
                                </div>

                                {newPayment > 0 && (
                                    <div className="p-3 mb-4" style={{ borderRadius: 12, backgroundColor: remainingOutstanding <= 0 ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.04)", border: `1px solid ${remainingOutstanding <= 0 ? "rgba(16,185,129,0.2)" : "rgba(16,185,129,0.12)"}` }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="text-muted small mb-1">Balance After Payment</div>
                                                <div className="fw-bold" style={{ fontSize: "1.4rem", color: remainingOutstanding <= 0 ? "#10b981" : "#f59e0b" }}>
                                                    {formatCurrency(Math.max(0, remainingOutstanding))}
                                                </div>
                                            </div>
                                            {remainingOutstanding <= 0 && (
                                                <div className="d-flex align-items-center gap-2 px-3 py-2" style={{ borderRadius: 999, backgroundColor: "rgba(16,185,129,0.15)" }}>
                                                    <i className="bi bi-check-circle-fill text-success" />
                                                    <span className="text-success fw-semibold small">FULLY PAID</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {data?.payments && data.payments.length > 0 && (
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="bi bi-clock-history text-muted" />
                                                <span className="fw-medium text-muted">Payment History</span>
                                            </div>
                                            <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ borderRadius: 999 }}>
                                                {data.payments.length} payment{data.payments.length > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <div style={{ maxHeight: 150, overflowY: "auto", borderRadius: 12, border: "1px solid rgba(0,0,0,0.08)" }}>
                                            <table className="table table-sm mb-0" style={{ fontSize: "0.85rem" }}>
                                                <thead className="table-light sticky-top">
                                                    <tr>
                                                        <th className="border-0 py-2">Date</th>
                                                        <th className="border-0 py-2 text-end">Amount</th>
                                                        <th className="border-0 py-2">Method</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.payments.map((p, idx) => (
                                                        <tr key={idx}>
                                                            <td className="border-0 py-2">{formatDate(p.payment_date || p.created_at)}</td>
                                                            <td className="border-0 py-2 text-end text-success fw-medium">{formatCurrency(p.payment_amount_done)}</td>
                                                            <td className="border-0 py-2 text-muted text-capitalize">{p.payment_method?.replace('_', ' ') || "-"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex gap-3">
                                    <button type="button" className="btn btn-light flex-grow-1 py-3" onClick={onClose} style={{ borderRadius: 12 }}>
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn flex-grow-1 py-3 text-white"
                                        disabled={loading || remainingOutstanding < 0 || !amount}
                                        style={{ borderRadius: 12, background: "linear-gradient(135deg, #374151 0%, #111827 100%)", border: "none" }}
                                    >
                                        {loading ? (
                                            <><span className="spinner-border spinner-border-sm me-2" />Recording...</>
                                        ) : (
                                            <><i className="bi bi-check-lg me-2" />Record Payment</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                }
                .form-control:focus, .form-select:focus {
                    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15) !important;
                    border-color: rgba(16, 185, 129, 0.4) !important;
                }
                .form-control, .form-select {
                    border-color: rgba(0, 0, 0, 0.08) !important;
                    padding: 0.75rem 1rem;
                }
                .btn:focus { box-shadow: none !important; }
            `}</style>
        </>
    );
}
