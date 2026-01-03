"use client";

import { useState, useEffect } from "react";

export default function RecordPaymentModal({ diamondId, show, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (show && diamondId) {
            fetchPaymentDetails();
        }
    }, [show, diamondId]);

    const fetchPaymentDetails = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/diamonds/${diamondId}/payment`);
            if (!res.ok) throw new Error("Failed to load payment details");
            const json = await res.json();
            console.log("Payment data received:", json); // Debug log
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
                }),
            });

            if (!res.ok) {
                let errorMessage = "Failed to record payment";
                try {
                    const err = await res.json();
                    errorMessage = err?.message || errorMessage;
                } catch (parseError) {
                    // If response is not JSON, try to get text
                    const text = await res.text();
                    errorMessage = text || errorMessage;
                }
                throw new Error(errorMessage);
            }

            onSuccess();
            onClose();
            setAmount("");
            setData(null);
        } catch (err) {
            setError(err.message || "An error occurred while recording payment");
        } finally {
            setLoading(false);
        }
    };


    const calculateExpiry = (buyingDate, termsDays) => {
        if (!buyingDate || termsDays === null || termsDays === undefined) return "N/A";
        const date = new Date(buyingDate);
        if (isNaN(date.getTime())) return "N/A";
        const terms = parseInt(termsDays) || 0;
        date.setDate(date.getDate() + terms);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    if (!show) return null;

    const purchasePrice = parseFloat(data?.purchase_price) || 0;
    const totalPaid = parseFloat(data?.total_paid) || 0;
    const currentOutstanding = parseFloat(data?.outstanding) || 0;
    const newPayment = parseFloat(amount) || 0;
    const remainingOutstanding = currentOutstanding - newPayment;

    return (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Record Payment</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {loading && !data && <div className="text-center"><div className="spinner-border"></div></div>}

                        {error && <div className="alert alert-danger">{error}</div>}

                        {data && (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Purchase Price (INR)</label>
                                    <input type="text" className="form-control bg-light" value={purchasePrice.toFixed(2)} readOnly />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-success">Total Paid So Far</label>
                                    <input type="text" className="form-control bg-light" value={totalPaid.toFixed(2)} readOnly />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Expiry Date</label>
                                    <input
                                        type="text"
                                        className="form-control bg-light"
                                        value={calculateExpiry(
                                            data?.buying_date || data?.diamond?.buying_date,
                                            data?.terms_days !== undefined ? data?.terms_days : data?.diamond?.terms_days
                                        )}
                                        readOnly
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold text-danger">Current Outstanding</label>
                                    <input type="text" className="form-control bg-warning" value={currentOutstanding.toFixed(2)} readOnly />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Payment Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Estimated Pending After Payment</label>
                                    <input
                                        type="text"
                                        className={`form-control ${remainingOutstanding < 0 ? 'text-danger' : ''}`}
                                        value={remainingOutstanding.toFixed(2)}
                                        readOnly
                                    />
                                    {remainingOutstanding < 0 && <small className="text-danger">Warning: Payment exceeds outstanding amount!</small>}
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>
                                        {loading ? "Saving..." : "Record Payment"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}