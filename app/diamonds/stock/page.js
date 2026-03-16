// app/diamonds/stock/page.js
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function StatusPill({ status }) {
    const map = {
        available: { bg: "success", text: "Available", icon: "bi-check-circle" },
        sold: { bg: "danger", text: "Sold", icon: "bi-bag-check" },
        memo: { bg: "warning", text: "On Memo", icon: "bi-hourglass-split", textClass: "text-dark" },
        subject_to_sale: { bg: "info", text: "Subject to Sale", icon: "bi-info-circle" },
        at_lab: { bg: "secondary", text: "At Lab", icon: "bi-building-up" },
    };
    const s = map[status] || { bg: "secondary", text: status || "Unknown", icon: "bi-question-circle" };

    return (
        <span
            className={`badge bg-${s.bg} bg-opacity-10 text-${s.bg === "warning" ? "dark" : s.bg} px-3 py-2`}
            style={{ borderRadius: 999 }}
        >
            <i className={`bi ${s.icon} me-2`} />
            {s.text}
        </span>
    );
}

const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return "-";
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatNum = (value) => {
    const num = parseFloat(value);
    return Number.isNaN(num) ? "-" : num.toFixed(2);
};

export default function StockMaintenancePage() {
    const [user, setUser] = useState(null);
    const [diamonds, setDiamonds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("current"); // current, sold, bought
    const [q, setQ] = useState("");

    const fetchUser = async () => {
        try {
            const res = await fetch("/api/auth/me");
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            }
        } catch (err) {
            console.error("User fetch error:", err);
        }
    };

    const fetchDiamonds = async (clientType) => {
        setLoading(true);
        try {
            const endpoint = clientType === "Loose" ? "/api/loose-diamonds/items" : "/api/diamonds";
            const res = await fetch(endpoint);
            if (!res.ok) throw new Error("Failed to fetch diamonds");
            const data = await res.json();
            setDiamonds(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            fetchDiamonds(user.client_type);
        }
    }, [user]);

    const filteredData = useMemo(() => {
        let base = [];
        const isLoose = user?.client_type === "Loose";

        if (activeTab === "current") {
            if (isLoose) {
                // For loose, we treat everything from items api as current for now, or filter by lot status if needed
                 base = diamonds;
            } else {
                base = diamonds.filter(d => ["available", "memo", "at_lab", "subject_to_sale"].includes(d.availability));
            }
        } else if (activeTab === "sold") {
            if (isLoose) {
                base = []; // Sold tracking for individual loose items not fully implemented yet in DB
            } else {
                base = diamonds.filter(d => d.availability === "sold");
            }
        } else {
            base = diamonds;
        }

        const query = q.trim().toLowerCase();
        if (!query) return base;

        return base.filter((d) => {
            const hay = isLoose ? [
                d.lot_number,
                d.color_category,
                d.size_category,
                d.grade,
                d.supplier_name,
                String(d.carats ?? ""),
            ] : [
                d.certificate_number,
                d.shape,
                d.color,
                d.clarity,
                d.purchase_from,
                String(d.weight ?? ""),
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return hay.includes(query);
        });
    }, [diamonds, activeTab, q, user]);

    const stats = useMemo(() => {
        const isLoose = user?.client_type === "Loose";
        return {
            total: filteredData.length,
            weight: filteredData.reduce((sum, d) => sum + (parseFloat(isLoose ? d.carats : d.weight) || 0), 0),
            value: filteredData.reduce((sum, d) => sum + (parseFloat(isLoose ? d.total_value : d.amount_usd) || 0), 0),
        };
    }, [filteredData, user]);

    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
            <div className="container">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-1 text-dark">Stock Maintenance</h2>
                        <p className="text-muted">Manage current inventory and tracks history</p>
                    </div>
                </div>

                {/* Tabs & Search */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
                    <div className="card-body p-4">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                            <div className="btn-group p-1 bg-light rounded-pill">
                                {["current", "sold", "bought"].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`btn border-0 py-2 px-4 rounded-pill fw-medium ${activeTab === tab ? "bg-white shadow-sm text-primary" : "text-muted"}`}
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)} Stock
                                    </button>
                                ))}
                            </div>

                            <div className="flex-grow-1" style={{ maxWidth: 400 }}>
                                <div className="input-group bg-light rounded-pill px-3">
                                    <span className="input-group-text bg-transparent border-0 pe-2">
                                        <i className="bi bi-search text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control bg-transparent border-0 py-2 ps-0"
                                        placeholder="Search stock..."
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        style={{ boxShadow: "none" }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-3">
                            <div className="p-3 rounded-4 bg-white border flex-grow-1 text-center">
                                <span className="d-block text-muted small text-uppercase fw-bold mb-1">Total {user?.client_type === "Loose" ? "Items" : "Stones"}</span>
                                <h4 className="fw-bold mb-0">{stats.total}</h4>
                            </div>
                            <div className="p-3 rounded-4 bg-white border flex-grow-1 text-center">
                                <span className="d-block text-muted small text-uppercase fw-bold mb-1">Total Weight</span>
                                <h4 className="fw-bold mb-0">{formatNum(stats.weight)} <span className="small text-muted">ct</span></h4>
                            </div>
                            <div className="p-3 rounded-4 bg-white border flex-grow-1 text-center">
                                <span className="d-block text-muted small text-uppercase fw-bold mb-1">Total Value</span>
                                <h4 className="fw-bold mb-0">{formatCurrency(stats.value)}</h4>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: 16, overflow: "hidden" }}>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-4 py-3 text-muted small text-uppercase">{user?.client_type === "Loose" ? "Lot Number" : "Certificate"}</th>
                                    <th className="py-3 text-muted small text-uppercase">Details</th>
                                    <th className="py-3 text-muted small text-uppercase text-end">Weight</th>
                                    <th className="py-3 text-muted small text-uppercase text-end">Price</th>
                                    <th className="py-3 text-muted small text-uppercase text-center">Status</th>
                                    <th className="py-3 text-muted small text-uppercase text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status" />
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-5 text-muted">No stock found in this category.</td>
                                    </tr>
                                ) : (
                                    filteredData.map((d) => {
                                        const isLoose = user?.client_type === "Loose";
                                        return (
                                            <tr key={d.id}>
                                                <td className="px-4">
                                                    <Link 
                                                        href={isLoose ? `/loose-diamonds/${d.loose_diamond_id}` : `/diamonds/show/${d.id}`} 
                                                        className="text-decoration-none fw-semibold text-dark"
                                                    >
                                                        {isLoose ? d.lot_number : (d.certificate_number || "NO CERT")}
                                                    </Link>
                                                    <div className="small text-muted">
                                                        {isLoose ? (d.supplier_name || "Direct") : (d.lab || "-")} | Buying: {isLoose ? (d.purchase_date?.split('T')[0] || "-") : (d.buying_date?.split('T')[0] || "-")}
                                                    </div>
                                                </td>
                                                <td>
                                                    {isLoose ? (
                                                        <>
                                                            <span className="badge bg-light text-dark border me-2">{d.color_category}</span>
                                                            <span className="small text-muted">{d.size_category} / {d.grade}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="badge bg-light text-dark border me-2">{d.shape}</span>
                                                            <span className="small text-muted">{d.color} / {d.clarity} / {d.cut}</span>
                                                        </>
                                                    )}
                                                </td>
                                                <td className="text-end fw-medium">{formatNum(isLoose ? d.carats : d.weight)} ct</td>
                                                <td className="text-end fw-semibold text-dark">{formatCurrency(isLoose ? d.final_price_per_carat : d.amount_usd)}</td>
                                                <td className="text-center">
                                                    <StatusPill status={isLoose ? "available" : d.availability} />
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex justify-content-center gap-2">
                                                        <Link href={isLoose ? `/sales/create?diamond_id=${d.id}` : `/sales/create?diamond_id=${d.id}`} className="btn btn-sm btn-outline-success rounded-pill px-3">Sell</Link>
                                                        <Link href={isLoose ? `/loose-diamonds/edit/${d.loose_diamond_id}` : `/diamonds/edit/${d.id}`} className="btn btn-sm btn-outline-warning rounded-pill px-3">Edit</Link>
                                                        <Link href={isLoose ? `/loose-diamonds/${d.loose_diamond_id}` : `/diamonds/show/${d.id}`} className="btn btn-sm btn-outline-primary rounded-pill px-3">View</Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
