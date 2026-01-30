"use client";

import { useState } from "react";

export default function QuickAddEntityModal({ show, onClose, type = "client", onSuccess }) {
    const [name, setName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!show) return null;

    const title = type === "client" ? "Add New Client" : "Add New Broker";
    const apiPath = type === "client" ? "/api/clients" : "/api/brokers";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const body = {};
            if (type === "client") {
                body.contact_name = name;
                body.company_name = companyName;
                // Optional fields explicitly null
                body.email = null;
                body.phone = null;
                body.owner_name = null;
                body.bank_name = null;
                body.branch = null;
                body.bank_address = null;
                body.account_type = null;
                body.account_number = null;
                body.ifsc_code = null;
            } else {
                body.name = name;
                body.company_name = companyName;
                body.email = null;
                body.phone = null;
            }

            const res = await fetch(apiPath, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || "Failed to create");
            }

            const created = await res.json();
            onSuccess(created);
            onClose();
            // Reset
            setName("");
            setCompanyName("");
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: 16 }}>
                    <div className="modal-header border-0">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger py-2 small" style={{ borderRadius: 8 }}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label small text-muted fw-bold">Contact Name <span className="text-danger">*</span></label>
                                <input
                                    className="form-control"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    placeholder="e.g. John Doe"
                                    style={{ borderRadius: 10 }}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="form-label small text-muted fw-bold">Company Name <span className="text-danger">*</span></label>
                                <input
                                    className="form-control"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    required
                                    placeholder="e.g. JD Diamonds"
                                    style={{ borderRadius: 10 }}
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-light" onClick={onClose} style={{ borderRadius: 10 }}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary px-4"
                                    style={{ borderRadius: 10, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : "Create & Select"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
