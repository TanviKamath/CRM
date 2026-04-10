"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from "recharts";

const CHART_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ff7300"];
import Skeleton from "../../components/Skeleton";

export default function LooseDiamondDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/loose-diamonds/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setLot)
      .catch(() => router.push("/loose-diamonds"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const exportCSV = () => {
    if (!lot || !lot.items) return;
    const headers = ["Lot Number", "Color", "Size", "Grade", "Carats", "Base Price", "Discount"];
    const rows = lot.items.map(i => [
      lot.lot_number, i.color_category, i.size_category, i.grade, i.carats, i.base_price, i.discount_pct + "%"
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Lot_${lot.lot_number}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this lot and all its sub-lots?")) return;
    
    const res = await fetch(`/api/loose-diamonds/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/loose-diamonds");
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100 py-5" style={{ background: "#f8f9fc" }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-start mb-4">
             <div className="d-flex align-items-center gap-3">
               <Skeleton width="40px" height="40px" style={{ borderRadius: "50%" }} />
               <Skeleton width="56px" height="56px" style={{ borderRadius: "50%" }} />
               <div>
                 <Skeleton width="150px" height="28px" className="mb-2" />
                 <Skeleton width="200px" height="16px" />
               </div>
             </div>
          </div>
          <Skeleton width="250px" height="20px" className="mb-5 ms-1" />
          
          <div className="row g-4 mb-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="col-md-3">
                <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "20px" }}>
                  <Skeleton width="100px" height="14px" className="mb-2" />
                  <Skeleton width="120px" height="28px" />
                </div>
              </div>
            ))}
          </div>

          <div className="card border-0 shadow-lg mb-5" style={{ borderRadius: "25px", overflow: "hidden" }}>
             <div className="card-header bg-white border-0 p-4 px-md-5">
               <Skeleton width="200px" height="24px" />
             </div>
             <div className="p-4">
               {Array.from({ length: 5 }).map((_, i) => (
                 <Skeleton key={i} width="100%" height="40px" className="mb-3" />
               ))}
             </div>
          </div>
        </div>
      </div>
    );
  }
  if (!lot) return null;

  const totalSaleValue = lot.items?.reduce((acc, i) => acc + parseFloat(i.total_value), 0) || 0;
  const profitLoss = totalSaleValue - parseFloat(lot.total_purchase_value);
  const avgPrice = lot.items?.length > 0 ? totalSaleValue / parseFloat(lot.total_carats) : 0;

  // Prepare Chart Data
  const caratDistribution = lot.items?.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.color_category);
    if (existing) {
        existing.value += parseFloat(item.carats);
    } else {
        acc.push({ name: item.color_category, value: parseFloat(item.carats) });
    }
    return acc;
  }, []) || [];

  const priceComparison = lot.items?.map(item => ({
    name: `${item.color_category} (${item.size_category})`,
    Base: parseFloat(item.base_price),
    Final: parseFloat(item.final_price_per_carat)
  })) || [];

  return (
    <div className="min-vh-100 py-5" style={{ background: "#f8f9fc" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div className="d-flex align-items-center gap-3">
             <Link href="/loose-diamonds" className="btn btn-light rounded-circle d-flex align-items-center justify-content-center shadow-sm hover-primary me-2" style={{ width: 40, height: 40 }}>
                <i className="bi bi-arrow-left text-primary"></i>
             </Link>
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
               <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-1px" }}>Lot: LOT-{lot.lot_number}</h2>
               <div className="text-muted small">
                  Supplier: <span className="text-dark fw-bold">{lot.supplier_name || "Unknown"}</span> | 
                  Date: <span className="text-dark fw-bold">{lot.purchase_date ? new Date(lot.purchase_date).toLocaleDateString() : "-"}</span>
               </div>
             </div>
          </div>
          <div className="d-flex gap-2 pt-2">
            <button className="btn btn-outline-primary px-3 shadow-sm border-0 bg-white" onClick={exportCSV} style={{ borderRadius: "10px" }}>
              <i className="bi bi-file-earmark-arrow-down me-2"></i>Export CSV
            </button>
            <button className="btn btn-outline-danger px-3 shadow-sm border-0 bg-white" onClick={handleDelete} style={{ borderRadius: "10px" }}>
              <i className="bi bi-trash"></i>
            </button>
            <Link href={`/loose-diamonds/edit/${id}`} className="btn btn-outline-primary px-3 shadow-sm border-0 bg-white" style={{ borderRadius: "10px" }}>
              <i className="bi bi-pencil me-2"></i>Edit Lot
            </Link>
            <button className="btn btn-primary px-3 shadow-lg" onClick={() => window.print()} style={{ borderRadius: "10px" }}>
              <i className="bi bi-printer me-2"></i>Print PDF
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-5 ms-1">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item"><Link href="/" className="text-decoration-none text-muted">Dashboard</Link></li>
            <li className="breadcrumb-item"><Link href="/loose-diamonds" className="text-decoration-none text-muted">Loose Diamonds</Link></li>
            <li className="breadcrumb-item active text-primary" aria-current="page">LOT-{lot.lot_number} Details</li>
          </ol>
        </nav>

        {/* Financial Summary */}
        <div className="row g-4 mb-5">
            <div className="col-md-3">
                <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "20px" }}>
                    <div className="text-muted small fw-bold text-uppercase mb-2">Total Carats</div>
                    <div className="h3 fw-bold mb-0 text-dark">{parseFloat(lot.total_carats).toFixed(3)} <span className="fs-6 text-muted fw-normal">cts</span></div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "20px" }}>
                    <div className="text-muted small fw-bold text-uppercase mb-2">Purchase Value</div>
                    <div className="h3 fw-bold mb-0 text-dark">${parseFloat(lot.total_purchase_value).toLocaleString()}</div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "20px" }}>
                    <div className="text-muted small fw-bold text-uppercase mb-2">Sale Value (Split)</div>
                    <div className="h3 fw-bold mb-0 text-primary">${totalSaleValue.toLocaleString()}</div>
                </div>
            </div>
            <div className="col-md-3">
                <div className={`card border-0 shadow-lg p-4 h-100 text-white ${profitLoss >= 0 ? 'bg-success' : 'bg-danger'}`} style={{ borderRadius: "20px" }}>
                    <div className="text-white-50 small fw-bold text-uppercase mb-2">Profit / Loss</div>
                    <div className="h3 fw-bold mb-0">${Math.abs(profitLoss).toLocaleString()}</div>
                </div>
            </div>
        </div>

        {/* Visual Analytics Dashboard */}
        <div className="row g-4 mb-5">
            <div className="col-lg-5">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "25px" }}>
                    <div className="card-header bg-white border-0 p-4">
                        <h6 className="fw-bold mb-0">Carat Distribution (%)</h6>
                    </div>
                    <div className="card-body" style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={caratDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {caratDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            <div className="col-lg-7">
                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "25px" }}>
                    <div className="card-header bg-white border-0 p-4">
                        <h6 className="fw-bold mb-0">Price Comparison (Base vs Final)</h6>
                    </div>
                    <div className="card-body" style={{ height: "300px" }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceComparison}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <RechartsTooltip />
                                <Legend />
                                <Bar dataKey="Base" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Final" fill="#0071e3" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>

        {/* Bifurcation Details Container */}
        <div className="card border-0 shadow-lg mb-5" style={{ borderRadius: "25px", overflow: "hidden" }}>
          <div className="card-header bg-white border-0 p-4 px-md-5">
            <div className="d-flex align-items-center">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: 42, height: 42, backgroundColor: "rgba(102,126,234,0.10)" }}
              >
                <i className="bi bi-collection-fill text-primary" style={{ fontSize: "1.2rem" }} />
              </div>
              <h5 className="fw-bold mb-0">Bifurcation Items</h5>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="text-muted small fw-bold text-uppercase">
                  <th className="px-5 py-3 border-0">Lot Number</th>
                  <th className="px-4 py-3 border-0">Color</th>
                  <th className="px-4 py-3 border-0">Size</th>
                  <th className="px-4 py-3 border-0">Grade</th>
                  <th className="px-4 py-3 border-0">Carats</th>
                  <th className="px-4 py-3 border-0">Base Price</th>
                  <th className="px-4 py-3 border-0">Discount</th>
                  <th className="px-4 py-3 border-0">Final Price</th>
                  <th className="px-5 py-3 border-0 text-end">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {lot.items?.map((item, idx) => (
                  <tr key={idx} className="border-bottom">
                    <td className="px-5 py-4 fw-bold text-dark">LOT-{lot.lot_number}</td>
                    <td className="px-4 py-4 fw-semibold">{item.color_category}</td>
                    <td className="px-4 py-4">{item.size_category}</td>
                    <td className="px-4 py-4 fw-bold text-muted">{item.grade}</td>
                    <td className="px-4 py-4">
                        <div className="fw-bold">
                          {parseFloat(item.carats - (item.total_on_memo_carats || 0)).toFixed(3)}
                          <span className="small text-muted ms-1">cts</span>
                        </div>
                        {parseFloat(item.total_on_memo_carats || 0) > 0 && (
                          <div className="text-warning small" style={{ fontSize: '0.7rem' }}>
                            <i className="bi bi-hourglass-split me-1"></i>
                            {parseFloat(item.total_on_memo_carats).toFixed(3)} on memo
                          </div>
                        )}
                        <div className="text-muted extra-small" style={{ fontSize: '0.65rem' }}>
                          Total: {parseFloat(item.carats).toFixed(3)}
                        </div>
                    </td>
                    <td className="px-4 py-4 fw-bold text-dark">${parseFloat(item.base_price).toLocaleString()}</td>
                    <td className="px-4 py-4">
                        <span className={`badge ${item.discount_pct >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                            {item.discount_pct >= 0 ? '+' : ''}{item.discount_pct}%
                        </span>
                    </td>
                    <td className="px-4 py-4 fw-bold text-dark">${parseFloat(item.final_price_per_carat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 fw-bold text-primary text-end fs-5">${parseFloat(item.total_value).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-light-subtle">
                <tr className="fw-bold">
                    <td colSpan="4" className="px-5 py-4">Weighted Average Price</td>
                    <td className="px-4 py-4">{parseFloat(lot.total_carats).toFixed(3)} cts</td>
                    <td colSpan="3"></td>
                    <td className="px-5 py-4 text-primary text-end fs-5">${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ct</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {lot.remarks && (
          <div className="p-4 px-md-5 bg-white shadow-sm rounded-4 mb-5 border-start border-4 border-primary">
            <h6 className="fw-bold text-muted small mb-2 text-uppercase ls-1">Traders Remarks</h6>
            <p className="mb-0 text-dark opacity-75">{lot.remarks}</p>
          </div>
        )}
      </div>
      <style jsx>{`
        .ls-1 { letter-spacing: 1px; }
        .breadcrumb-item + .breadcrumb-item::before { color: #ccc; }
      `}</style>
    </div>
  );
}
