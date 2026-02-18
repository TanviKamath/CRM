// app/account/page.js
"use client";

import { useState } from "react";
import Link from "next/link";

function StatPill({ icon, label, value, tone = "success" }) {
    return (
        <span
            className={`badge bg-${tone} bg-opacity-10 text-${tone} px-3 py-2`}
            style={{ borderRadius: 999 }}
        >
            <i className={`bi ${icon} me-2`} />
            <span className="me-1">{label}:</span>
            <span className="fw-semibold">{value}</span>
        </span>
    );
}

export default function AccountExport() {
    const [selectionType, setSelectionType] = useState("dateRange");
    const [category, setCategory] = useState("all");
    const [clientId, setClientId] = useState("");
    const [clients, setClients] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [financialYear, setFinancialYear] = useState("");
    const [quarter, setQuarter] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch clients on mount
    useState(() => {
        fetch("/api/clients")
            .then(res => res.json())
            .then(data => setClients(data || []))
            .catch(err => console.error("Failed to fetch clients", err));
    }, []);

    const categories = [
        { value: "all", label: "All Transactions", icon: "bi-list-ul", color: "#6366f1" },
        { value: "stock", label: "Stock Summary", icon: "bi-gem", color: "#ec4899" },
        { value: "buy", label: "Diamond Purchases", icon: "bi-cart-check", color: "#f59e0b" },
        // Specific Expense Categories
        { value: "brokerage", label: "Brokerage", icon: "bi-person-badge", color: "#8b5cf6" },
        { value: "salaries", label: "Salaries & Wages", icon: "bi-cash-coin", color: "#ef4444" },
        { value: "rent", label: "Rent & Lease", icon: "bi-building", color: "#06b6d4" },
        { value: "utilities", label: "Utilities", icon: "bi-lightning-charge", color: "#eab308" },
        { value: "office_supplies", label: "Office Supplies", icon: "bi-printer", color: "#64748b" },
        { value: "travel", label: "Travel", icon: "bi-airplane", color: "#3b82f6" },
        { value: "marketing", label: "Marketing", icon: "bi-megaphone", color: "#d946ef" },
        { value: "miscellaneous", label: "Miscellaneous", icon: "bi-question-circle", color: "#94a3b8" },
        // Payment Modes
        { value: "bank", label: "Bank Statement", icon: "bi-bank", color: "#3b82f6" },
        { value: "cash", label: "Cash Statement", icon: "bi-wallet2", color: "#10b981" },
    ];

    const currentYear = new Date().getFullYear();
    const financialYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const quarters = [
        { value: "Q1", label: "Q1", period: "Apr - Jun" },
        { value: "Q2", label: "Q2", period: "Jul - Sep" },
        { value: "Q3", label: "Q3", period: "Oct - Dec" },
        { value: "Q4", label: "Q4", period: "Jan - Mar" },
    ];

    const handleExport = async () => {
        setIsExporting(true);
        setError("");
        setSuccess("");

        try {
            const params = new URLSearchParams();
            params.append("action", "export");
            params.append("selection_type", selectionType);
            params.append("category", category);
            if (clientId) params.append("client_id", clientId);

            if (selectionType === "dateRange") {
                if (!startDate || !endDate) {
                    throw new Error("Please select both start and end dates");
                }
                if (new Date(startDate) > new Date(endDate)) {
                    throw new Error("Start date cannot be after end date");
                }
                params.append("start_date", startDate);
                params.append("end_date", endDate);
            } else if (selectionType === "financialYear") {
                if (!financialYear) {
                    throw new Error("Please select a financial year");
                }
                params.append("financial_year", financialYear);
            } else if (selectionType === "quarter") {
                if (!financialYear || !quarter) {
                    throw new Error("Please select both financial year and quarter");
                }
                params.append("financial_year", financialYear);
                params.append("quarter", quarter);
            }

            const apiUrl = `/api/accounts?${params.toString()}`;
            const response = await fetch(apiUrl);
            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Export failed");
                } else {
                    throw new Error(`Export failed with status: ${response.status}`);
                }
            }

            if (!contentType || !contentType.includes("spreadsheet")) {
                throw new Error("Server returned unexpected response");
            }

            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = "account_statement.xlsx";
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(
                    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
                );
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, "");
                }
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccess(`Successfully exported: ${filename}`);
        } catch (err) {
            setError(err.message || "Failed to export data. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const isExportDisabled = () => {
        if (selectionType === "dateRange") return !startDate || !endDate;
        if (selectionType === "financialYear") return !financialYear;
        if (selectionType === "quarter") return !quarter || !financialYear;
        return true;
    };

    const handleSelectionTypeChange = (type) => {
        setSelectionType(type);
        setError("");
        setSuccess("");
        setFinancialYear("");
        setQuarter("");
        setStartDate("");
        setEndDate("");
    };

    const getSelectedPeriodText = () => {
        if (selectionType === "dateRange" && startDate && endDate) {
            return `${new Date(startDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(endDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}`;
        } else if (selectionType === "financialYear" && financialYear) {
            return `01 Apr ${financialYear} — 31 Mar ${parseInt(financialYear) + 1}`;
        } else if (selectionType === "quarter" && financialYear && quarter) {
            const quarterDates = {
                Q1: `01 Apr — 30 Jun ${financialYear}`,
                Q2: `01 Jul — 30 Sep ${financialYear}`,
                Q3: `01 Oct — 31 Dec ${financialYear}`,
                Q4: `01 Jan — 31 Mar ${parseInt(financialYear) + 1}`,
            };
            return quarterDates[quarter];
        }
        return null;
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
                                    background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                                    boxShadow: "0 6px 18px rgba(34,197,94,0.22)",
                                }}
                            >
                                <i className="bi bi-file-earmark-spreadsheet text-white" style={{ fontSize: "1.3rem" }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                                    Export Account Statement
                                </h2>
                                <div className="text-muted">Generate passbook-style financial reports in Excel format.</div>
                            </div>
                        </div>

                        {getSelectedPeriodText() && (
                            <div className="mt-3">
                                <StatPill icon="bi-calendar-check" label="Period" value={getSelectedPeriodText()} tone="primary" />
                            </div>
                        )}
                    </div>

                </div>

                {/* Success Message */}
                {success && (
                    <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
                        <i className="bi bi-check-circle me-2" />
                        {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess("")} aria-label="Close" />
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
                        <i className="bi bi-exclamation-triangle me-2" />
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError("")} aria-label="Close" />
                    </div>
                )}

                {/* Client Selection (Optional) */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
                    <div className="card-body p-4">
                        <label className="form-label text-muted small mb-3">Filter by Client (Optional)</label>
                        <select
                            className="form-select"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            style={{ borderRadius: 10, padding: "12px 16px" }}
                        >
                            <option value="">All Clients</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.company_name || c.contact_name}
                                </option>
                            ))}
                        </select>
                        <div className="form-text text-muted small mt-2">
                            <i className="bi bi-info-circle me-1"></i>
                            Select a client to see only their sales and transactions.
                        </div>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
                    <div className="card-body p-4">
                        <label className="form-label text-muted small mb-3">Select Account Category</label>
                        <div className="row g-3">
                            {categories.map((cat) => (
                                <div className="col-md-4 col-lg-2" key={cat.value}>
                                    <div
                                        onClick={() => setCategory(cat.value)}
                                        className="p-3 rounded-3 h-100 text-center d-flex flex-column align-items-center justify-content-center"
                                        style={{
                                            cursor: "pointer",
                                            border: category === cat.value ? `2px solid ${cat.color}` : "2px solid #e5e7eb",
                                            backgroundColor: category === cat.value ? `${cat.color}0a` : "#fff",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                                            style={{
                                                width: 40,
                                                height: 40,
                                                background: category === cat.value
                                                    ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}cc 100%)`
                                                    : "#f3f4f6",
                                            }}
                                        >
                                            <i
                                                className={`bi ${cat.icon} ${category === cat.value ? "text-white" : "text-muted"}`}
                                                style={{ fontSize: "1.1rem" }}
                                            />
                                        </div>
                                        <h6 className="fw-semibold mb-0" style={{ fontSize: "0.85rem" }}>{cat.label}</h6>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selection Type Card */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
                    <div className="card-body p-4">
                        <label className="form-label text-muted small mb-3">Select Export Period Type</label>
                        <div className="row g-3">
                            {/* Date Range */}
                            <div className="col-md-4">
                                <div
                                    onClick={() => handleSelectionTypeChange("dateRange")}
                                    className="p-4 rounded-3 h-100"
                                    style={{
                                        cursor: "pointer",
                                        border: selectionType === "dateRange" ? "2px solid #16a34a" : "2px solid #e5e7eb",
                                        backgroundColor: selectionType === "dateRange" ? "rgba(34,197,94,0.06)" : "#fff",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            background: selectionType === "dateRange"
                                                ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
                                                : "#f3f4f6",
                                        }}
                                    >
                                        <i
                                            className={`bi bi-calendar-range ${selectionType === "dateRange" ? "text-white" : "text-muted"}`}
                                            style={{ fontSize: "1.2rem" }}
                                        />
                                    </div>
                                    <h6 className="fw-semibold mb-1">Custom Date Range</h6>
                                    <p className="text-muted small mb-0">Select specific start and end dates</p>
                                </div>
                            </div>

                            {/* Financial Year */}
                            <div className="col-md-4">
                                <div
                                    onClick={() => handleSelectionTypeChange("financialYear")}
                                    className="p-4 rounded-3 h-100"
                                    style={{
                                        cursor: "pointer",
                                        border: selectionType === "financialYear" ? "2px solid #16a34a" : "2px solid #e5e7eb",
                                        backgroundColor: selectionType === "financialYear" ? "rgba(34,197,94,0.06)" : "#fff",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            background: selectionType === "financialYear"
                                                ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
                                                : "#f3f4f6",
                                        }}
                                    >
                                        <i
                                            className={`bi bi-calendar-check ${selectionType === "financialYear" ? "text-white" : "text-muted"}`}
                                            style={{ fontSize: "1.2rem" }}
                                        />
                                    </div>
                                    <h6 className="fw-semibold mb-1">Financial Year</h6>
                                    <p className="text-muted small mb-0">April to March (Indian FY)</p>
                                </div>
                            </div>

                            {/* Quarter */}
                            <div className="col-md-4">
                                <div
                                    onClick={() => handleSelectionTypeChange("quarter")}
                                    className="p-4 rounded-3 h-100"
                                    style={{
                                        cursor: "pointer",
                                        border: selectionType === "quarter" ? "2px solid #16a34a" : "2px solid #e5e7eb",
                                        backgroundColor: selectionType === "quarter" ? "rgba(34,197,94,0.06)" : "#fff",
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center mb-3"
                                        style={{
                                            width: 48,
                                            height: 48,
                                            background: selectionType === "quarter"
                                                ? "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)"
                                                : "#f3f4f6",
                                        }}
                                    >
                                        <i
                                            className={`bi bi-calendar4-week ${selectionType === "quarter" ? "text-white" : "text-muted"}`}
                                            style={{ fontSize: "1.2rem" }}
                                        />
                                    </div>
                                    <h6 className="fw-semibold mb-1">Quarterly</h6>
                                    <p className="text-muted small mb-0">Q1, Q2, Q3, or Q4</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Selection Card */}
                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
                    <div className="card-body p-4">
                        {/* Date Range Fields */}
                        {selectionType === "dateRange" && (
                            <>
                                <div className="d-flex align-items-center mb-4">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                                        }}
                                    >
                                        <i className="bi bi-calendar-range text-white" />
                                    </div>
                                    <div>
                                        <h6 className="fw-semibold mb-0">Select Date Range</h6>
                                        <small className="text-muted">Choose your custom period</small>
                                    </div>
                                </div>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">Start Date</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="form-control"
                                            max={endDate || undefined}
                                            style={{ borderRadius: 10, padding: "12px 16px" }}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small">End Date</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="form-control"
                                            min={startDate || undefined}
                                            style={{ borderRadius: 10, padding: "12px 16px" }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Financial Year Fields */}
                        {selectionType === "financialYear" && (
                            <>
                                <div className="d-flex align-items-center mb-4">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                                        }}
                                    >
                                        <i className="bi bi-calendar-check text-white" />
                                    </div>
                                    <div>
                                        <h6 className="fw-semibold mb-0">Select Financial Year</h6>
                                        <small className="text-muted">April 1st to March 31st</small>
                                    </div>
                                </div>

                                <div className="row g-2">
                                    {financialYears.map((year) => (
                                        <div className="col-6 col-md-4 col-lg" key={year}>
                                            <div
                                                onClick={() => setFinancialYear(String(year))}
                                                className="p-3 text-center rounded-3"
                                                style={{
                                                    cursor: "pointer",
                                                    border: financialYear === String(year) ? "2px solid #16a34a" : "2px solid #e5e7eb",
                                                    backgroundColor: financialYear === String(year) ? "rgba(34,197,94,0.06)" : "#fff",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <div className="fw-semibold">FY {year}-{String(year + 1).slice(-2)}</div>
                                                <small className="text-muted">Apr {year} - Mar {year + 1}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Quarter Fields */}
                        {selectionType === "quarter" && (
                            <>
                                <div className="d-flex align-items-center mb-4">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
                                        }}
                                    >
                                        <i className="bi bi-calendar4-week text-white" />
                                    </div>
                                    <div>
                                        <h6 className="fw-semibold mb-0">Select Quarter</h6>
                                        <small className="text-muted">Choose financial year and quarter</small>
                                    </div>
                                </div>

                                {/* Financial Year Selection */}
                                <div className="mb-4">
                                    <label className="form-label text-muted small">Financial Year</label>
                                    <select
                                        value={financialYear}
                                        onChange={(e) => { setFinancialYear(e.target.value); setQuarter(""); }}
                                        className="form-select"
                                        style={{ borderRadius: 10, padding: "12px 16px" }}
                                    >
                                        <option value="">Select Financial Year</option>
                                        {financialYears.map((year) => (
                                            <option key={year} value={year}>
                                                FY {year}-{year + 1}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quarter Selection */}
                                <label className="form-label text-muted small">Quarter</label>
                                <div className="row g-2">
                                    {quarters.map((q) => (
                                        <div className="col-6 col-md-3" key={q.value}>
                                            <div
                                                onClick={() => financialYear && setQuarter(q.value)}
                                                className="p-3 text-center rounded-3"
                                                style={{
                                                    cursor: financialYear ? "pointer" : "not-allowed",
                                                    opacity: financialYear ? 1 : 0.5,
                                                    border: quarter === q.value ? "2px solid #f59e0b" : "2px solid #e5e7eb",
                                                    backgroundColor: quarter === q.value ? "rgba(245,158,11,0.08)" : "#fff",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <div className="fw-bold" style={{ fontSize: "1.2rem" }}>{q.label}</div>
                                                <small className="text-muted">{q.period}</small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Export Button Card */}
                <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
                    <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div
                                    className="d-flex align-items-center gap-2 px-3 py-2"
                                    style={{
                                        backgroundColor: "rgba(34,197,94,0.06)",
                                        border: "1px solid rgba(34,197,94,0.12)",
                                        borderRadius: 10,
                                    }}
                                >
                                    <i className="bi bi-file-earmark-excel text-success" />
                                    <span className="small text-muted">Export as Excel (.xlsx)</span>
                                </div>

                                {!isExportDisabled() && getSelectedPeriodText() && (
                                    <div className="d-none d-md-flex align-items-center gap-2 px-3 py-2" style={{ backgroundColor: "#f3f4f6", borderRadius: 10 }}>
                                        <i className="bi bi-calendar-check text-primary" />
                                        <span className="small text-muted">{getSelectedPeriodText()}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleExport}
                                disabled={isExportDisabled() || isExporting}
                                className="btn btn-success px-4 py-2"
                                style={{ borderRadius: 10 }}
                            >
                                {isExporting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-download me-2" />
                                        Export to Excel
                                    </>
                                )}
                            </button>
                        </div>

                        {isExportDisabled() && (
                            <div className="text-muted small mt-3">
                                <i className="bi bi-info-circle me-2" />
                                {selectionType === "dateRange" && "Please select both start and end dates to export."}
                                {selectionType === "financialYear" && "Please select a financial year to export."}
                                {selectionType === "quarter" && "Please select both financial year and quarter to export."}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .btn:focus {
                    box-shadow: none !important;
                }
                .form-control:focus,
                .form-select:focus {
                    border-color: #16a34a;
                    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
                }
            `}</style>
        </div>
    );
}