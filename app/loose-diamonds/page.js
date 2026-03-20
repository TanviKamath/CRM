"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Skeleton from "../components/Skeleton";

export default function LooseDiamondDashboard() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
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
        if (user.client_type !== "Loose") {
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
        <div className="row g-4 mb-5">
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
              <div className="h2 fw-bold mb-0">${lots.reduce((acc, lot) => acc + parseFloat(lot.total_purchase_value), 0).toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Lots List */}
        <div className="bg-white shadow-lg border-0" style={{ borderRadius: "25px", overflow: "hidden" }}>
          <div className="px-4 py-4 border-bottom bg-white d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">Active Loose Inventory</h5>
            <div className="badge bg-light text-muted p-2 rounded-3 border">{lots.length} Records Found</div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="bg-light">
                <tr className="text-muted small fw-bold text-uppercase">
                  <th className="px-4 py-3 border-0">Lot Number</th>
                  <th className="px-4 py-3 border-0">Supplier</th>
                  <th className="px-4 py-3 border-0">Carats</th>
                  <th className="px-4 py-3 border-0">Purchase Value</th>
                  <th className="px-4 py-3 border-0">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4">
                        <Skeleton width="100px" height="20px" /><br/><Skeleton width="80px" height="14px" style={{ marginTop: 6 }} />
                      </td>
                      <td className="px-4 py-4"><Skeleton width="120px" height="18px" /></td>
                      <td className="px-4 py-4"><Skeleton width="60px" height="20px" /></td>
                      <td className="px-4 py-4"><Skeleton width="90px" height="24px" /></td>
                      <td className="px-4 py-4"><Skeleton width="80px" height="26px" style={{ borderRadius: 999 }} /></td>
                    </tr>
                  ))
                ) : lots.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5">
                        <div className="py-2">
                            <i className="bi bi-inboxes text-muted opacity-25" style={{ fontSize: "3rem" }}></i>
                            <p className="mt-3 text-muted">No lots found. Creation your first loose diamond lot!</p>
                            <Link href="/loose-diamonds/create" className="btn btn-sm btn-outline-primary rounded-pill">Add Lot</Link>
                        </div>
                    </td>
                  </tr>
                ) : (
                  lots.map((lot) => (
                    <tr key={lot.id} style={{ cursor: "pointer" }} onClick={() => router.push(`/loose-diamonds/${lot.id}`)}>
                      <td className="px-4 py-4">
                        <div className="fw-bold text-dark">{lot.lot_number}</div>
                        <div className="text-muted small">{lot.purchase_date ? new Date(lot.purchase_date).toLocaleDateString() : "-"}</div>
                      </td>
                      <td className="px-4 py-4 text-muted">{lot.supplier_name || "Direct Purchase"}</td>
                      <td className="px-4 py-4">
                        <span className="fw-semibold">{parseFloat(lot.total_carats).toFixed(2)}</span>
                        <span className="text-muted small ms-1">cts</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="fw-bold text-primary">${parseFloat(lot.total_purchase_value).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`badge rounded-pill px-3 py-2 ${lot.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                          {lot.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style jsx>{`
        .ls-1 { letter-spacing: 1px; }
        .hover-primary:hover { background: #f0f7ff !important; border-color: #0071e3 !important; }
      `}</style>
    </div>
  );
}
