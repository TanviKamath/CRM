// app/sales/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Status badge component
function StatusBadge({ status }) {
  const badges = {
    pending: { class: "bg-warning text-dark", text: "Pending" },
    completed: { class: "bg-success", text: "Completed" },
    cancelled: { class: "bg-danger", text: "Cancelled" },
  };
  
  const badge = badges[status] || { class: "bg-secondary", text: status || "Unknown" };
  
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
}

// Format currency
const formatCurrency = (value, symbol = "$") => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function SalesIndex() {
  const searchParams = useSearchParams();
  
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch sales
  const fetchSales = async () => {
    setLoading(true);
    try {
      const status = searchParams.get("status") || "";
      const res = await fetch(`/api/sales?status=${status}`);
      const data = await res.json();
      setSales(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error(err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [searchParams]);

  // Delete sale
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sale");
      
      setSuccessMessage("Sale deleted successfully!");
      fetchSales();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Sales</h2>
        </div>
        <div className="col text-end">
          <Link href="/sales/create" className="btn btn-primary">
            New Sale
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={searchParams.get("status") || ""}
                onChange={(e) => {
                  const url = new URL(window.location);
                  if (e.target.value) {
                    url.searchParams.set("status", e.target.value);
                  } else {
                    url.searchParams.delete("status");
                  }
                  window.location.href = url.toString();
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>ID</th>
              <th>Diamond</th>
              <th>Client</th>
              <th>Sale Amount (USD)</th>
              <th>Sale Amount (INR)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">No sales found.</td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.id}</td>
                  <td>
                    {sale.diamond ? (
                      <Link href={`/diamonds/show/${sale.diamond_id}`}>
                        {sale.diamond.certificate_number || "-"}
                      </Link>
                    ) : (
                      sale.diamond_certificate || "-"
                    )}
                  </td>
                  <td>
                    {sale.client ? (
                      <Link href={`/clients/show/${sale.client_id}`}>
                        {sale.client.company_name || "-"}
                      </Link>
                    ) : (
                      sale.client_company || "-"
                    )}
                  </td>
                  <td>{formatCurrency(sale.sale_amount)}</td>
                  <td>{formatCurrency(sale.sale_amount_inr, "₹")}</td>
                  <td><StatusBadge status={sale.status} /></td>
                  <td>
                    <div className="btn-group" role="group">
                      <Link 
                        href={`/sales/show/${sale.id}`} 
                        className="btn btn-sm btn-info text-white"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/sales/edit/${sale.id}`} 
                        className="btn btn-sm btn-warning text-white"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(sale.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}