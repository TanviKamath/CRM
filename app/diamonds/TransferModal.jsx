"use client";

import { useState, useEffect } from "react";

export default function TransferModal({ show, onClose, onTransfer, selectedCount }) {
    const [toPlace, setToPlace] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    // Focus input when shown
    useEffect(() => {
        if (show) {
            setTimeout(() => {
                const input = document.getElementById("transfer-destination");
                if (input) input.focus();
            }, 100);
        }
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!toPlace) return;

        setLoading(true);
        await onTransfer(toPlace, notes);
        setLoading(false);
        setToPlace("");
        setNotes("");
        // Parent handles closing or we can verify success
    };

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
            <div className="modal fade show d-block" style={{ zIndex: 1045 }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">Transfer Diamonds</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body pt-3 pb-4 px-4">
                            <div className="alert alert-light border d-flex align-items-center mb-4 text-muted small">
                                <i className="bi bi-info-circle-fill me-2 text-primary" />
                                Transferring <strong className="text-dark mx-1">{selectedCount}</strong> diamond(s).
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="transfer-destination" className="form-label small text-uppercase fw-bold text-muted">
                                        New Location / Destination
                                    </label>
                                    <input
                                        id="transfer-destination"
                                        type="text"
                                        className="form-control form-control-lg"
                                        placeholder="e.g. Mumbai Office, Grading Lab..."
                                        value={toPlace}
                                        onChange={(e) => setToPlace(e.target.value)}
                                        required
                                        style={{ fontSize: "1rem" }}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small text-uppercase fw-bold text-muted">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        placeholder="Add tracking # or reason for transfer..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                                    <button type="button" className="btn btn-light px-4" onClick={onClose} disabled={loading} style={{ borderRadius: 8 }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary px-4" disabled={loading || !toPlace} style={{ borderRadius: 8 }}>
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Confirm Transfer <i className="bi bi-arrow-right ms-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
