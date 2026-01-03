// app/diamonds/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// Availability badge component
function AvailabilityBadge({ status }) {
  const badges = {
    available: { class: "bg-success", text: "Available" },
    sold: { class: "bg-danger", text: "Sold" },
    memo: { class: "bg-warning text-dark", text: "Out on Memo" },
    subject_to_sale: { class: "bg-info", text: "Subject to Prior Sale" },
  };
  
  const badge = badges[status] || { class: "bg-secondary", text: status || "Unknown" };
  
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
}

// Format currency
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format number
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : num.toFixed(decimals);
};

export default function DiamondsIndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch diamonds
  const fetchDiamonds = async () => {
    setLoading(true);
    
    try {
      const availability = searchParams.get("availability") || "";
      const res = await fetch(`/api/diamonds?availability=${availability}`);
      
      if (!res.ok) throw new Error("Failed to fetch diamonds");
      
      const data = await res.json();
      
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setDiamonds(data);
      } else {
        setDiamonds(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setDiamonds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiamonds();
    
    // Check for success message in URL
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [searchParams]);

  // Delete diamond
  const handleDelete = async (id, certificateNumber) => {
    if (!confirm(`Are you sure you want to delete this diamond?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/diamonds/${id}`, { method: "DELETE" });
      
      if (!res.ok) throw new Error("Failed to delete diamond");
      
      setSuccessMessage("Diamond deleted successfully!");
      fetchDiamonds();
    } catch (err) {
      alert(err.message);
    }
  };

  // Dismiss success message
  const dismissSuccess = () => setSuccessMessage("");

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Diamonds</h2>
        </div>
        <div className="col text-end">
          <Link href="/diamonds/create" className="btn btn-primary">
            Add New Diamond
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
            onClick={dismissSuccess}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Certificate #</th>
              <th>Stone Type</th>
              <th>Shape</th>
              <th>Weight</th>
              <th>Color</th>
              <th>Clarity</th>
              <th>Cut</th>
              <th>Price (USD)</th>
              <th>Availability</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : diamonds.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center">No diamonds found.</td>
              </tr>
            ) : (
              diamonds.map((diamond) => (
                <tr key={diamond.id}>
                  <td>{diamond.certificate_number || "-"}</td>
                  <td>{diamond.stone_type || "-"}</td>
                  <td>{diamond.shape || "-"}</td>
                  <td>{formatNumber(diamond.weight)}</td>
                  <td>{diamond.color || "-"}</td>
                  <td>{diamond.clarity || "-"}</td>
                  <td>{diamond.cut || "-"}</td>
                  <td>{formatCurrency(diamond.amount_usd)}</td>
                  <td>
                    <AvailabilityBadge status={diamond.availability} />
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      <Link 
                        href={`/diamonds/show/${diamond.id}`} 
                        className="btn btn-sm btn-info text-white"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/diamonds/edit/${diamond.id}`} 
                        className="btn btn-sm btn-warning text-white"
                      >
                        Edit
                      </Link>
                      {diamond.availability === "available" && (
                        <Link 
                          href={`/sales/create?diamond_id=${diamond.id}`} 
                          className="btn btn-sm btn-success text-white"
                        >
                          Record Sale
                        </Link>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(diamond.id, diamond.certificate_number)}
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