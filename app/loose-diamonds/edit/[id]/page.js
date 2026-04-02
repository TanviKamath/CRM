"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageSkeleton from "../../../components/PageSkeleton";

const COLOR_CATEGORIES = ["White", "White Natts", "Off-White LB. Natts", "Off-White LC. Natts", "LB", "LC", "Fancy", "Cap Color", "Green"];
const SIZES = ["-0", "+0", "-2", "+2", "-6.5", "+6.5", "-8", "+8", "-11", "+11", "-14", "+14", "-15", "+15", "-18", "+18"];

const GRADE_MAP = {
  White: ["D", "EF", "GH", "HI", "I"],
  "White Natts": ["Spotted. Natts", "Dark Natts"],
  "Off-White LB. Natts": [
    "Ttlb. Natts",
    "Tlb. Natts",
    "Lb. Natts"
  ],
  "Off-White LC. Natts": [
    "Tttlc. Natts",
    "Tlc. Natts",
    "Lc. Natts"
  ],
  LB: [
    "HI (Top Water Shade)",
    "I (Water Shade)",
    "Off White TTLB",
    "TTLB",
    "TLB",
    "LB",
    "DB",
    "DDB"
  ],
  LC: [
    "HI (Top Water Shade)",
    "I (Water Shade)",
    "Off White TTLC",
    "TTLC",
    "TLC",
    "LC"
  ],
  Fancy: ["Standard"],
  "Cap Color": ["Standard"],
  Green: ["Standard"],
};

export default function EditLooseDiamondLot() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Lot Info
  const [lotInfo, setLotInfo] = useState({
    lot_number: "",
    supplier_name: "",
    total_carats: "",
    original_price_per_carat: "",
    total_purchase_value: 0,
    purchase_date: "", // Initialize as empty to avoid hydration mismatch
    remarks: "",
  });

  const [lotNumberError, setLotNumberError] = useState("");

  // Bifurcation Items
  const [items, setItems] = useState([]);
  const [targetProfitInput, setTargetProfitInput] = useState("");

  useEffect(() => {
    fetch(`/api/loose-diamonds/${id}`)
      .then(res => res.json())
      .then(data => {
        setLotInfo({
          lot_number: data.lot_number,
          supplier_name: data.supplier_name,
          total_carats: data.total_carats,
          original_price_per_carat: data.original_price_per_carat,
          total_purchase_value: data.total_purchase_value,
          purchase_date: data.purchase_date ? new Date(data.purchase_date).toISOString().split("T")[0] : "",
          remarks: data.remarks || "",
        });
        setItems(data.items.map(i => ({
          ...i,
          id: i.id || Date.now() + Math.random() // Ensure local unique ID
        })));
      })
      .catch(() => router.push("/loose-diamonds"))
      .finally(() => setFetching(false));
  }, [id, router]);

  // Real-time Lot Number Validation
  useEffect(() => {
    if (!lotInfo.lot_number || fetching) {
      setLotNumberError("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/loose-diamonds/validate-lot?lot_number=${lotInfo.lot_number}&excludeId=${id}`);
        if (res.ok) {
          const { available } = await res.json();
          if (!available) {
            setLotNumberError(`Lot number ${lotInfo.lot_number} already exists. Please use a unique number.`);
          } else {
            setLotNumberError("");
          }
        }
      } catch (err) {
        console.error("Validation error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [lotInfo.lot_number, id, fetching]);

  // Auto-calculate Total Purchase Value
  useEffect(() => {
    const carats = parseFloat(lotInfo.total_carats || 0);
    const price = parseFloat(lotInfo.original_price_per_carat || 0);
    setLotInfo((prev) => ({ ...prev, total_purchase_value: carats * price }));
  }, [lotInfo.total_carats, lotInfo.original_price_per_carat]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        color_category: "White",
        size_category: "+6.5",
        grade: "D",
        carats: "",
        base_price: lotInfo.original_price_per_carat || "",
        discount_pct: 0,
        final_price_per_carat: lotInfo.original_price_per_carat || 0,
        total_value: 0,
      },
    ]);
  };

  const removeItem = (id) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Reset grade if color category changes
          if (field === "color_category") {
            updated.grade = GRADE_MAP[value][0];
          }

          // Recalculate prices
          const base = parseFloat(updated.base_price || 0);
          const disc = parseFloat(updated.discount_pct || 0);
          updated.final_price_per_carat = base * (1 + disc / 100);
          updated.total_value = updated.final_price_per_carat * parseFloat(updated.carats || 0);

          return updated;
        }
        return item;
      })
    );
  };

  // Calculations
  const splitCarats = useMemo(() => items.reduce((acc, i) => acc + parseFloat(i.carats || 0), 0), [items]);
  const splitTotalValue = useMemo(() => items.reduce((acc, i) => acc + parseFloat(i.total_value || 0), 0), [items]);
  const profitLoss = splitTotalValue - lotInfo.total_purchase_value;
  const avgPrice = splitCarats > 0 ? splitTotalValue / splitCarats : 0;
  const caratBalance = parseFloat(lotInfo.total_carats || 0) - splitCarats;

  const hasDuplicates = useMemo(() => {
    const seen = new Set();
    for (const item of items) {
      if (!item.color_category || !item.size_category || !item.grade) continue;
      const combo = `${item.color_category}|${item.size_category}|${item.grade}`;
      if (seen.has(combo)) return true;
      seen.add(combo);
    }
    return false;
  }, [items]);

  // Smart Balancing Tool Logic
  const applyTargetProfit = (targetVal) => {
    const targetProfit = parseFloat(targetVal);
    if (isNaN(targetProfit) || items.length === 0) return;

    const lotCostPrice = parseFloat(lotInfo.original_price_per_carat || 0);

    setItems(prevItems => {
      // 1. Prepare items: ensured base_price exists for calc
      const preparedItems = prevItems.map(item => ({
        ...item,
        base_price: parseFloat(item.base_price) || lotCostPrice
      }));

      const targetTotalValue = parseFloat(lotInfo.total_purchase_value) + targetProfit;
      const sumBaseValue = preparedItems.reduce((acc, item) => acc + (parseFloat(item.base_price) * parseFloat(item.carats || 0)), 0);
      
      if (sumBaseValue === 0) {
        alert("Please enter a 'Base Price' for your categories or an 'Original Price' for the lot first, so the engine has a baseline to calculate from.");
        return prevItems;
      }

      const targetMultiplier = targetTotalValue / sumBaseValue;
      const targetDisc = (targetMultiplier - 1) * 100;

      return preparedItems.map(item => {
        const base = parseFloat(item.base_price);
        const finalPrice = base * targetMultiplier;
        return {
          ...item,
          discount_pct: parseFloat(targetDisc.toFixed(2)),
          final_price_per_carat: finalPrice,
          total_value: finalPrice * parseFloat(item.carats || 0)
        };
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/loose-diamonds/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lotInfo, items }),
      });

      if (res.ok) {
        router.push(`/loose-diamonds/${id}`);
      } else {
        const err = await res.text();
        alert("Error: " + err);
      }
    } catch (err) {
      alert("Failed to update lot");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <PageSkeleton />;

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-12 col-xl-11">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <Link href="/loose-diamonds" className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm hover-primary me-2" style={{ width: 40, height: 40 }}>
                   <i className="bi bi-arrow-left text-primary"></i>
                </Link>
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <i className="bi bi-pencil-square text-white" style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.5px" }}>
                    Edit Loose Diamond Lot: {lotInfo.lot_number}
                  </h2>
                  <div className="text-muted small">Update parcel details and bifurcations</div>
                </div>
              </div>

              <Link
                href={`/loose-diamonds/${id}`}
                className="btn btn-outline-secondary px-4 d-flex align-items-center"
                style={{ borderRadius: 10 }}
              >
                <i className="bi bi-arrow-left me-2" />
                Cancel Edit
              </Link>
            </div>

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-muted">Dashboard</Link></li>
                <li className="breadcrumb-item"><Link href="/loose-diamonds" className="text-decoration-none text-muted">Loose Diamonds</Link></li>
                <li className="breadcrumb-item"><Link href={`/loose-diamonds/${id}`} className="text-decoration-none text-muted">{lotInfo.lot_number}</Link></li>
                <li className="breadcrumb-item active text-primary" aria-current="page">Edit</li>
              </ol>
            </nav>

            <form onSubmit={handleSubmit}>
              {/* Lot Info Card */}
              <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: 20, overflow: "hidden" }}>
                <div className="card-header bg-white border-0 py-4 px-4 px-md-5">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center me-3"
                      style={{ width: 42, height: 42, backgroundColor: "rgba(102,126,234,0.10)" }}
                    >
                      <i className="bi bi-clipboard-data text-primary" style={{ fontSize: "1.2rem" }} />
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0">Lot Information</h5>
                      <div className="text-muted small">Primary purchase details</div>
                    </div>
                  </div>
                </div>

                <div className="card-body p-4 p-md-5 pt-0 bg-white">
                  <div className="row g-4">
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Lot Number <span className="text-danger">*</span></label>
                      <div className="input-group" style={{ 
                        borderRadius: "10px", 
                        overflow: "hidden", 
                        border: `1px solid ${lotNumberError ? '#ff3b30' : '#e1e1e1'}`,
                        transition: "border-color 0.2s ease"
                      }}>
                        <span className="input-group-text bg-light border-0 text-muted fw-bold pe-2">LOT-</span>
                        <input 
                          type="number" 
                          className="form-control border-0 ps-1 shadow-none no-spinner" 
                          required 
                          placeholder="245" 
                          value={lotInfo.lot_number} 
                          onChange={(e) => setLotInfo({ ...lotInfo, lot_number: e.target.value })} 
                          style={{ padding: "12px 12px 12px 0" }} 
                          suppressHydrationWarning
                          onFocus={(e) => e.target.parentElement.style.borderColor = lotNumberError ? '#ff3b30' : '#0071e3'}
                          onBlur={(e) => e.target.parentElement.style.borderColor = lotNumberError ? '#ff3b30' : '#e1e1e1'}
                        />
                      </div>
                      {lotNumberError && (
                        <div className="text-danger mt-1 fw-medium" style={{ fontSize: "0.75rem" }}>
                          <i className="bi bi-exclamation-circle me-1"></i>
                          {lotNumberError}
                        </div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Supplier Name</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter supplier name"
                        value={lotInfo.supplier_name} 
                        onChange={(e) => setLotInfo({ ...lotInfo, supplier_name: e.target.value })} 
                        style={{ borderRadius: "10px", padding: "12px" }} 
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Purchase Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={lotInfo.purchase_date} 
                        onChange={(e) => setLotInfo({ ...lotInfo, purchase_date: e.target.value })} 
                        style={{ borderRadius: "10px", padding: "12px" }} 
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Total Carats <span className="text-danger">*</span></label>
                      <div className="input-group" style={{ borderRadius: "10px", overflow: "hidden" }}>
                        <input 
                          type="number" 
                          step="0.001" 
                          className="form-control" 
                          required 
                          placeholder="0.000"
                          value={lotInfo.total_carats} 
                          onChange={(e) => setLotInfo({ ...lotInfo, total_carats: e.target.value })} 
                          style={{ padding: "12px" }}
                          suppressHydrationWarning
                        />
                        <span className="input-group-text bg-light text-muted small">cts</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Original Price / Carat <span className="text-danger">*</span></label>
                      <div className="input-group" style={{ borderRadius: "10px", overflow: "hidden" }}>
                        <span className="input-group-text bg-light text-muted small">₹</span>
                        <input 
                          type="number" 
                          step="0.01" 
                          className="form-control" 
                          required 
                          placeholder="0.00"
                          value={lotInfo.original_price_per_carat} 
                          onChange={(e) => setLotInfo({ ...lotInfo, original_price_per_carat: e.target.value })} 
                          style={{ padding: "12px" }}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-medium">Total Purchase Value</label>
                      <div className="input-group" style={{ borderRadius: "10px", overflow: "hidden" }}>
                        <span className="input-group-text bg-light text-muted small">₹</span>
                        <input 
                          type="text" 
                          className="form-control bg-light border-0 fw-bold" 
                          readOnly 
                          value={lotInfo.total_purchase_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                          style={{ padding: "12px" }}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-medium">Remarks</label>
                      <textarea 
                        className="form-control" 
                        rows="2"
                        placeholder="Add any internal notes here..."
                        value={lotInfo.remarks} 
                        onChange={(e) => setLotInfo({ ...lotInfo, remarks: e.target.value })} 
                        style={{ borderRadius: "10px", padding: "12px" }}
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bifurcation Section */}
              <div className="card border-0 shadow-lg mb-4" style={{ borderRadius: 20, overflow: "hidden" }}>
                <div className="card-header bg-white border-0 py-4 px-4 px-md-5 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center me-3"
                      style={{ width: 42, height: 42, backgroundColor: "rgba(52,199,89,0.10)" }}
                    >
                      <i className="bi bi-diagram-3 text-success" style={{ fontSize: "1.2rem" }} />
                    </div>
                    <div>
                      <h5 className="fw-bold mb-0">Diamond Bifurcation Engine</h5>
                      <div className="text-muted small">Split the lot into categories</div>
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary d-flex align-items-center gap-2 px-4 shadow-sm" onClick={addItem} style={{ borderRadius: 10 }} suppressHydrationWarning>
                    <i className="bi bi-plus-lg"></i>
                    Add Sub-Lot
                  </button>
                </div>

                <div className="card-body p-0 bg-white">
                  {items.length === 0 ? (
                    <div className="text-center py-5 px-4">
                      <div className="mb-3">
                        <i className="bi bi-box-seam text-muted" style={{ fontSize: "3rem", opacity: 0.3 }}></i>
                      </div>
                      <h6 className="fw-bold text-muted">No bifurcations yet</h6>
                      <p className="text-muted small mb-4">Click "Add Sub-Lot" to start splitting this purchase.</p>
                      <button type="button" className="btn btn-outline-primary px-4" onClick={addItem} style={{ borderRadius: 10 }} suppressHydrationWarning>Add First Split</button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="bg-light">
                          <tr className="text-muted small fw-bold">
                            <th className="ps-5 border-0 py-3">Color / Type</th>
                            <th className="border-0 py-3">Size</th>
                            <th className="border-0 py-3">Grade</th>
                            <th className="border-0 py-3" style={{ width: "130px" }}>Carats</th>
                            <th className="border-0 py-3" style={{ width: "130px" }}>Base Price (₹)</th>
                            <th className="border-0 py-3" style={{ width: "120px" }}>Disc/Prem%</th>
                            <th className="border-0 py-3" style={{ width: "130px" }}>Final Price (₹)</th>
                            <th className="border-0 py-3">Total Value</th>
                            <th className="pe-5 border-0 py-3 text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.id} className="border-bottom">
                              <td className="ps-5 py-3">
                                <select className="form-select border-0 bg-light" value={item.color_category} onChange={(e) => updateItem(item.id, "color_category", e.target.value)} style={{ borderRadius: "8px", fontSize: "14px" }} suppressHydrationWarning>
                                  {COLOR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </td>
                              <td className="py-3">
                                <select className="form-select border-0 bg-light" value={item.size_category} onChange={(e) => updateItem(item.id, "size_category", e.target.value)} style={{ borderRadius: "8px", fontSize: "14px" }} suppressHydrationWarning>
                                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              <td className="py-3">
                                <select className="form-select border-0 bg-light" value={item.grade} onChange={(e) => updateItem(item.id, "grade", e.target.value)} style={{ borderRadius: "8px", fontSize: "14px" }} suppressHydrationWarning>
                                  {GRADE_MAP[item.color_category].map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </td>
                              <td className="py-3">
                                <input type="number" step="0.001" className="form-control border-0 bg-light" placeholder="0.000" value={item.carats} onChange={(e) => updateItem(item.id, "carats", e.target.value)} style={{ borderRadius: "8px", fontSize: "14px" }} suppressHydrationWarning />
                              </td>
                              <td className="py-3">
                                <input type="number" step="0.01" className="form-control border-0 bg-light" value={item.base_price} onChange={(e) => updateItem(item.id, "base_price", e.target.value)} style={{ borderRadius: "8px", fontSize: "14px" }} suppressHydrationWarning />
                              </td>
                              <td className="py-3">
                                <input type="number" step="0.1" className="form-control border-0 bg-light" value={item.discount_pct} onChange={(e) => updateItem(item.id, "discount_pct", e.target.value)} style={{ borderRadius: "8px", fontSize: "14px" }} suppressHydrationWarning />
                              </td>
                              <td className="py-3 fw-bold text-dark">
                                ₹{parseFloat(item.final_price_per_carat || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3">
                                <div className="fw-bold text-primary">₹{(item.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                              </td>
                              <td className="pe-5 py-3 text-end">
                                <button type="button" className="btn btn-light btn-sm rounded-circle shadow-sm" onClick={() => removeItem(item.id)} style={{ width: 32, height: 32 }} suppressHydrationWarning>
                                  <i className="bi bi-x-lg text-danger"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Dashboard - Temporarily Commented Out
              <div className="row g-4 mb-4">
                <div className="col-lg-8">
                  <div className="card border-0 shadow-lg h-100" style={{ borderRadius: 20, background: "linear-gradient(to bottom right, #ffffff, #fdfdfd)" }}>
                    <div className="card-body p-4 p-md-5">
                      <h5 className="fw-bold mb-4 d-flex align-items-center">
                        <i className="bi bi-calculator text-primary me-2"></i>
                        Profit Balancing Dashboard
                      </h5>
                      <div className="row g-4">
                        <div className="col-md-4">
                          <div className="p-4 rounded-4 bg-light border-0">
                            <div className="text-muted small fw-bold text-uppercase mb-1">Split Carats</div>
                            <div className={`h3 fw-bold mb-0 ${Math.abs(caratBalance) > 0.001 ? 'text-danger' : 'text-success'}`}>
                                {splitCarats.toFixed(3)}
                            </div>
                            <div className="small text-muted mt-1">
                              {caratBalance > 0 ? `Unassigned: ${caratBalance.toFixed(3)} ct` : Math.abs(caratBalance) < 0.001 ? "Matching perfectly" : `Over by: ${Math.abs(caratBalance).toFixed(3)} ct`}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-4 rounded-4 bg-light border-0">
                            <div className="text-muted small fw-bold text-uppercase mb-1">Total Sale Value</div>
                            <div className="h3 fw-bold mb-0 text-primary">₹{splitTotalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            <div className="small text-muted mt-1">Estimated revenue</div>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="p-4 rounded-4 bg-light border-0">
                            <div className="text-muted small fw-bold text-uppercase mb-1">Avg Sale Price</div>
                            <div className="h3 fw-bold mb-0">₹{avgPrice.toFixed(0)}</div>
                            <div className="small text-muted mt-1">Per carat</div>
                          </div>
                        </div>
                      </div>
                      
                      {Math.abs(caratBalance) > 0.001 && (
                        <div className="alert alert-warning mt-4 mb-0 border-0 rounded-4 d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle-fill fs-5 me-3"></i>
                          <div className="small">
                            <strong>Inventory Warning:</strong> Split carats must equal original lot carats ({lotInfo.total_carats || "0.000"}) before saving.
                          </div>
                        </div>
                      )}

                      <hr className="my-5 opacity-10" />
                      <div className="bg-primary-subtle p-4 rounded-4 border-primary border-start border-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                                <h6 className="fw-bold text-primary mb-1"><i className="bi bi-magic me-2"></i>Smart Profit Balancer</h6>
                                <p className="text-muted small mb-0">Set your target profit and we'll adjust the discounts for you.</p>
                            </div>
                            <div className="d-flex gap-2">
                                <div className="input-group" style={{ width: "200px" }}>
                                    <span className="input-group-text bg-white border-0">₹</span>
                                    <input 
                                        type="number" 
                                        className="form-control border-0" 
                                        placeholder="Target Profit" 
                                        value={targetProfitInput}
                                        onChange={(e) => setTargetProfitInput(e.target.value)}
                                        style={{ height: "45px" }}
                                        suppressHydrationWarning
                                    />
                                </div>
                                <button 
                                    type="button" 
                                    className="btn btn-primary px-4"
                                    onClick={() => applyTargetProfit(targetProfitInput)}
                                    style={{ borderRadius: "10px" }}
                                    suppressHydrationWarning
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-lg-4">
                  <div className={`card border-0 shadow-lg h-100 p-2 ${profitLoss >= 0 ? "bg-primary" : "bg-danger"}`} style={{ borderRadius: 20 }}>
                    <div className="card-body p-4 d-flex flex-column justify-content-center text-white">
                      <div className="text-white-50 small fw-bold text-uppercase mb-2">Estimated Gross Profit</div>
                      <div className="display-5 fw-bold mb-1">
                        {profitLoss >= 0 ? "+" : ""}₹{Math.abs(profitLoss).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-white-50 small">
                        {profitLoss >= 0 
                          ? "Current bifurcation represents a healthy margin over purchase cost." 
                          : "Warning: Current sale prices are below total purchase value."}
                      </div>
                      
                      <hr className="my-4 opacity-25" />
                      
                      <div className="d-flex justify-content-between small text-white-50">
                        <span>Original Cost</span>
                        <span className="text-white fw-bold">₹{lotInfo.total_purchase_value.toLocaleString()}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-white-50 mt-2">
                        <span>Bifurcated Value</span>
                        <span className="text-white fw-bold">₹{splitTotalValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              */}

              {/* Actions */}
              {(Math.abs(caratBalance) > 0.001 || hasDuplicates) && (
                <div className="alert alert-warning border-0 shadow-sm d-flex align-items-start mb-4" style={{ borderRadius: 14, backgroundColor: "rgba(255,159,10,0.08)", color: "#ff9f0a" }}>
                  <i className="bi bi-exclamation-triangle-fill fs-5 me-3"></i>
                  <div className="small fw-medium">
                    {Math.abs(caratBalance) > 0.001 && <div className="mb-1"><strong>Carat Mismatch:</strong> Split carats do not perfectly equal total lot carats.</div>}
                    {hasDuplicates && <div><strong>Duplicate Check:</strong> Multiple sub-lots have the exact same Color, Size, and Grade.</div>}
                  </div>
                </div>
              )}
              <div className="d-flex justify-content-end align-items-center gap-3 mb-5">
                <Link href={`/loose-diamonds/${id}`} className="btn btn-light px-5 py-3 fw-bold shadow-sm" style={{ borderRadius: 15, border: "0.5px solid #eee" }}>
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="btn btn-primary px-5 py-3 fw-bold shadow-lg" 
                  disabled={loading || items.length === 0 || !!lotNumberError} 
                  style={{ borderRadius: 15, background: "linear-gradient(135deg, #0071e3 0%, #0077ed 100%)" }}
                  suppressHydrationWarning
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Updating Lot...
                    </>
                  ) : (
                    "Update Loose Diamond Lot"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .breadcrumb-item + .breadcrumb-item::before {
          color: rgba(0, 0, 0, 0.3);
        }
        .form-control:focus, .form-select:focus {
          border-color: #0071e3;
          box-shadow: 0 0 0 4px rgba(0, 113, 227, 0.1);
        }
        .btn-primary {
          border: none;
        }
        /* Hide number input spinners */
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
