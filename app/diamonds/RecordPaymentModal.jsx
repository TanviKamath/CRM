// app/diamonds/RecordPaymentModal.jsx
"use client";

import { useState, useEffect } from "react";

export default function RecordPaymentModal({ diamondId, show, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [reference, setReference] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (show && diamondId) {
            fetchPaymentDetails();
            // Reset form when modal opens
            setAmount("");
            setPaymentDate(new Date().toISOString().split('T')[0]);
            setPaymentMethod("");
            setReference("");
            setError("");
        }
    }, [show, diamondId]);

    const fetchPaymentDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/diamonds/${diamondId}/payment`);
            if (!res.ok) throw new Error("Failed to load payment details");
            const json = await res.json();
            console.log("Payment data received:", json);
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

        const currentOutstanding = parseFloat(data?.outstanding) || 0;
        if (paymentAmount > currentOutstanding) {
            setError("Payment cannot exceed outstanding amount");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/diamonds/${diamondId}/payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    diamond_id: diamondId,
                    amount: paymentAmount,
                    payment_date: paymentDate,
                    payment_method: paymentMethod || null,
                    reference: reference || null,
                }),
            });

            if (!res.ok) {
                let errorMessage = "Failed to record payment";
                try {
                    const err = await res.json();
                    errorMessage = err?.message || errorMessage;
                } catch (parseError) {
                    const text = await res.text();
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err.message || "An error occurred while recording payment");
        } finally {
            setLoading(false);
        }
    };

    const calculateExpiry = (buyingDate, termsDays) => {
        if (!buyingDate || termsDays === null || termsDays === undefined) return null;
        const date = new Date(buyingDate);
        if (isNaN(date.getTime())) return null;
        const terms = parseInt(termsDays) || 0;
        date.setDate(date.getDate() + terms);
        return date;
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        if (typeof date === 'string') date = new Date(date);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatCurrency = (value, symbol = "₹") => {
        const num = parseFloat(value) || 0;
        return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const isOverdue = () => {
        const expiryDate = calculateExpiry(
            data?.buying_date || data?.diamond?.buying_date,
            data?.terms_days !== undefined ? data?.terms_days : data?.diamond?.terms_days
        );
        if (!expiryDate) return false;
        return new Date() > expiryDate;
    };

    if (!show) return null;

    const purchasePrice = parseFloat(data?.purchase_price) || 0;
    const totalPaid = parseFloat(data?.total_paid) || 0;
    const currentOutstanding = parseFloat(data?.outstanding) || 0;
    const newPayment = parseFloat(amount) || 0;
    const remainingOutstanding = currentOutstanding - newPayment;
    const paymentProgress = purchasePrice > 0 ? ((totalPaid / purchasePrice) * 100).toFixed(1) : 0;

    const expiryDate = calculateExpiry(
        data?.buying_date || data?.diamond?.buying_date,
        data?.terms_days !== undefined ? data?.terms_days : data?.diamond?.terms_days
    );

    return (
        <>
            {/* Backdrop */}
            <div 
                className="position-fixed top-0 start-0 w-100 h-100" 
                style={{ 
                    backgroundColor: "rgba(0,0,0,0.5)", 
                    backdropFilter: "blur(4px)",
                    zIndex: 1040 
                }}
                onClick={onClose}
            />

            {/* Modal */}
            <div 
                className="position-fixed top-50 start-50 translate-middle" 
                style={{ 
                    zIndex: 1050, 
                    width: "100%", 
                    maxWidth: 520,
                    maxHeight: "90vh",
                    overflow: "auto"
                }}
            >
                <div 
                    className="bg-white shadow-lg" 
                    style={{ 
                        borderRadius: 20, 
                        overflow: "hidden",
                        animation: "modalSlideIn 0.3s ease-out"
                    }}
                >
                    {/* Header */}
                    <div 
                        className="px-4 py-4"
                        style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        }}
                    >
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex align-items-center gap-3">
                                <div 
                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ 
                                        width: 52, 
                                        height: 52, 
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        backdropFilter: "blur(10px)"
                                    }}
                                >
                                    <i className="bi bi-credit-card-2-front text-white" style={{ fontSize: "1.4rem" }} />
                                </div>
                                <div>
                                    <h5 className="fw-bold text-white mb-1">Record Payment</h5>
                                    <div className="text-white-50 small">
                                        <i className="bi bi-gem me-1" />
                                        Diamond #{diamondId}
                                    </div>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                className="btn btn-link text-white p-0"
                                onClick={onClose}
                                style={{ opacity: 0.8 }}
                            >
                                <i className="bi bi-x-lg" style={{ fontSize: "1.2rem" }} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4">
                        {/* Loading State */}
                        {loading && !data && (
                            <div className="text-center py-5">
                                <div 
                                    className="spinner-border mb-3" 
                                    role="status"
                                    style={{ width: "3rem", height: "3rem", color: "#667eea" }}
                                >
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <div className="text-muted">Loading payment details...</div>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div 
                                className="alert border-0 d-flex align-items-start mb-4" 
                                style={{ 
                                    borderRadius: 12, 
                                    backgroundColor: "rgba(220,53,69,0.08)",
                                    color: "#dc3545"
                                }}
                            >
                                <i className="bi bi-exclamation-triangle me-2 mt-1" />
                                <div className="flex-grow-1">{error}</div>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-sm" 
                                    onClick={() => setError("")}
                                    style={{ fontSize: "0.7rem" }}
                                />
                            </div>
                        )}

                        {data && (
                            <form onSubmit={handleSubmit}>
                                {/* Payment Progress */}
                                <div 
                                    className="mb-4 p-3"
                                    style={{ 
                                        borderRadius: 14, 
                                        backgroundColor: "rgba(102,126,234,0.06)",
                                        border: "1px solid rgba(102,126,234,0.12)"
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted small fw-medium">Payment Progress</span>
                                        <span 
                                            className="badge px-2 py-1"
                                            style={{ 
                                                borderRadius: 999,
                                                backgroundColor: paymentProgress >= 100 ? "rgba(16,185,129,0.1)" : "rgba(102,126,234,0.1)",
                                                color: paymentProgress >= 100 ? "#10b981" : "#667eea"
                                            }}
                                        >
                                            {paymentProgress}% paid
                                        </span>
                                    </div>
                                    <div 
                                        className="progress mb-2" 
                                        style={{ height: 8, borderRadius: 999, backgroundColor: "rgba(102,126,234,0.15)" }}
                                    >
                                        <div 
                                            className="progress-bar" 
                                            role="progressbar" 
                                            style={{ 
                                                width: `${Math.min(paymentProgress, 100)}%`,
                                                borderRadius: 999,
                                                background: paymentProgress >= 100 
                                                    ? "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                                                    : "linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
                                            }}
                                        />
                                    </div>
                                    <div className="d-flex justify-content-between small">
                                        <span className="text-success fw-medium">{formatCurrency(totalPaid)}</span>
                                        <span className="text-muted">of {formatCurrency(purchasePrice)}</span>
                                    </div>
                                </div>

                                {/* Key Metrics */}
                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <div 
                                            className="p-3 h-100"
                                            style={{ 
                                                borderRadius: 12, 
                                                backgroundColor: "rgba(16,185,129,0.06)",
                                                border: "1px solid rgba(16,185,129,0.15)"
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className="bi bi-check-circle text-success" />
                                                <span className="text-muted small">Total Paid</span>
                                            </div>
                                            <div className="fw-bold text-success" style={{ fontSize: "1.2rem" }}>
                                                {formatCurrency(totalPaid)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div 
                                            className="p-3 h-100"
                                            style={{ 
                                                borderRadius: 12, 
                                                backgroundColor: currentOutstanding > 0 ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.06)",
                                                border: `1px solid ${currentOutstanding > 0 ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.15)"}`
                                            }}
                                        >
                                            <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className={`bi ${currentOutstanding > 0 ? "bi-hourglass-split text-warning" : "bi-check-circle-fill text-success"}`} />
                                                <span className="text-muted small">Outstanding</span>
                                            </div>
                                            <div 
                                                className="fw-bold" 
                                                style={{ 
                                                    fontSize: "1.2rem",
                                                    color: currentOutstanding > 0 ? "#f59e0b" : "#10b981"
                                                }}
                                            >
                                                {formatCurrency(currentOutstanding)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry Info */}
                                {expiryDate && (
                                    <div 
                                        className={`d-flex align-items-center gap-3 mb-4 p-3`}
                                        style={{ 
                                            borderRadius: 12, 
                                            backgroundColor: isOverdue() ? "rgba(220,53,69,0.06)" : "rgba(14,165,233,0.06)",
                                            border: `1px solid ${isOverdue() ? "rgba(220,53,69,0.15)" : "rgba(14,165,233,0.15)"}`
                                        }}
                                    >
                                        <div 
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ 
                                                width: 40, 
                                                height: 40, 
                                                backgroundColor: isOverdue() ? "rgba(220,53,69,0.1)" : "rgba(14,165,233,0.1)"
                                            }}
                                        >
                                            <i 
                                                className={`bi ${isOverdue() ? "bi-exclamation-triangle" : "bi-calendar-check"}`}
                                                style={{ color: isOverdue() ? "#dc3545" : "#0ea5e9" }}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-muted small">Payment Due Date</div>
                                            <div className={`fw-semibold ${isOverdue() ? "text-danger" : ""}`}>
                                                {formatDate(expiryDate)}
                                                {isOverdue() && (
                                                    <span className="badge bg-danger ms-2" style={{ fontSize: "0.7rem" }}>
                                                        OVERDUE
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Divider */}
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="flex-grow-1" style={{ height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
                                    <span className="text-muted small text-uppercase" style={{ letterSpacing: "0.5px" }}>
                                        New Payment
                                    </span>
                                    <div className="flex-grow-1" style={{ height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
                                </div>

                                {/* Payment Amount */}
                                <div className="mb-3">
                                    <label className="form-label fw-medium">
                                        <i className="bi bi-currency-rupee me-2 text-primary" />
                                        Payment Amount <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                                        <span 
                                            className="input-group-text bg-white border-0"
                                            style={{ borderRight: "1px solid rgba(0,0,0,0.08)" }}
                                        >
                                            ₹
                                        </span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={currentOutstanding}
                                            className="form-control border-0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            required
                                            style={{ 
                                                fontSize: "1.1rem",
                                                boxShadow: "none"
                                            }}
                                        />
                                    </div>
                                    <div 
                                        className="mt-1"
                                        style={{ 
                                            border: "1px solid rgba(0,0,0,0.08)", 
                                            borderRadius: 12,
                                            borderTop: "none",
                                            borderTopLeftRadius: 0,
                                            borderTopRightRadius: 0,
                                            marginTop: "-1px"
                                        }}
                                    />
                                </div>

                                {/* Payment Date */}
                                <div className="mb-3">
                                    <label className="form-label fw-medium">
                                        <i className="bi bi-calendar3 me-2 text-info" />
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        style={{ borderRadius: 12 }}
                                    />
                                </div>

                                {/* Payment Method & Reference */}
                                <div className="row g-3 mb-4">
                                    <div className="col-6">
                                        <label className="form-label fw-medium">
                                            <i className="bi bi-wallet2 me-2 text-secondary" />
                                            Method
                                        </label>
                                        <select
                                            className="form-select"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            style={{ borderRadius: 12 }}
                                        >
                                            <option value="">Select</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="upi">UPI</option>
                                            <option value="cash">Cash</option>
                                            <option value="cheque">Cheque</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label fw-medium">
                                            <i className="bi bi-hash me-2 text-secondary" />
                                            Reference
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="TXN ID"
                                            style={{ borderRadius: 12 }}
                                        />
                                    </div>
                                </div>

                                {/* Remaining Preview */}
                                {newPayment > 0 && (
                                    <div 
                                        className={`p-3 mb-4`}
                                        style={{ 
                                            borderRadius: 12, 
                                            backgroundColor: remainingOutstanding <= 0 
                                                ? "rgba(16,185,129,0.08)" 
                                                : remainingOutstanding < 0 
                                                    ? "rgba(220,53,69,0.08)"
                                                    : "rgba(102,126,234,0.06)",
                                            border: `1px solid ${
                                                remainingOutstanding <= 0 
                                                    ? "rgba(16,185,129,0.2)" 
                                                    : remainingOutstanding < 0
                                                        ? "rgba(220,53,69,0.2)"
                                                        : "rgba(102,126,234,0.12)"
                                            }`
                                        }}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="text-muted small mb-1">After This Payment</div>
                                                <div 
                                                    className="fw-bold"
                                                    style={{ 
                                                        fontSize: "1.3rem",
                                                        color: remainingOutstanding <= 0 
                                                            ? "#10b981" 
                                                            : remainingOutstanding < 0
                                                                ? "#dc3545"
                                                                : "#667eea"
                                                    }}
                                                >
                                                    {formatCurrency(Math.max(0, remainingOutstanding))}
                                                </div>
                                            </div>
                                            {remainingOutstanding <= 0 && remainingOutstanding >= 0 && (
                                                <div 
                                                    className="d-flex align-items-center gap-2 px-3 py-2"
                                                    style={{ 
                                                        borderRadius: 999,
                                                        backgroundColor: "rgba(16,185,129,0.15)"
                                                    }}
                                                >
                                                    <i className="bi bi-check-circle-fill text-success" />
                                                    <span className="text-success fw-semibold small">FULLY PAID</span>
                                                </div>
                                            )}
                                        </div>
                                        {remainingOutstanding < 0 && (
                                            <div className="text-danger small mt-2">
                                                <i className="bi bi-exclamation-triangle me-1" />
                                                Payment exceeds outstanding by {formatCurrency(Math.abs(remainingOutstanding))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Payment History */}
                                {data?.payments && data.payments.length > 0 && (
                                    <div className="mb-4">
                                        <div className="d-flex align-items-center gap-2 mb-3">
                                            <i className="bi bi-clock-history text-muted" />
                                            <span className="fw-medium text-muted">Payment History</span>
                                            <span 
                                                className="badge bg-secondary bg-opacity-10 text-secondary"
                                                style={{ borderRadius: 999 }}
                                            >
                                                {data.payments.length}
                                            </span>
                                        </div>
                                        <div 
                                            style={{ 
                                                maxHeight: 150, 
                                                overflowY: "auto",
                                                borderRadius: 12,
                                                border: "1px solid rgba(0,0,0,0.08)"
                                            }}
                                        >
                                            <table className="table table-sm mb-0" style={{ fontSize: "0.85rem" }}>
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="border-0">Date</th>
                                                        <th className="border-0 text-end">Amount</th>
                                                        <th className="border-0">Method</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.payments.map((p, idx) => (
                                                        <tr key={idx}>
                                                            <td className="border-0">
                                                                {formatDate(p.payment_date || p.created_at)}
                                                            </td>
                                                            <td className="border-0 text-end text-success fw-medium">
                                                                {formatCurrency(p.amount)}
                                                            </td>
                                                            <td className="border-0 text-muted">
                                                                {p.payment_method || "-"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="d-flex gap-3">
                                    <button 
                                        type="button" 
                                        className="btn btn-light flex-grow-1 py-3"
                                        onClick={onClose}
                                        style={{ borderRadius: 12 }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn flex-grow-1 py-3 text-white"
                                        disabled={loading || remainingOutstanding < 0 || !amount}
                                        style={{ 
                                            borderRadius: 12,
                                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                            border: "none"
                                        }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" />
                                                Recording...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2" />
                                                Record Payment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* Animation Style */}
            <style jsx global>{`
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -48%) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
                
                .form-control:focus,
                .form-select:focus {
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15) !important;
                    border-color: rgba(102, 126, 234, 0.4) !important;
                }
                
                .form-control,
                .form-select {
                    border-color: rgba(0, 0, 0, 0.08) !important;
                    padding: 0.75rem 1rem;
                }
                
                .input-group {
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 12px;
                }
                
                .input-group .form-control {
                    border: none !important;
                }
                
                .input-group:focus-within {
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
                    border-color: rgba(102, 126, 234, 0.4);
                }
                
                .btn:focus {
                    box-shadow: none !important;
                }
                
                .progress {
                    overflow: visible;
                }
            `}</style>
        </>
    );
}