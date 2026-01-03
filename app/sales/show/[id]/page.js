// app/sales/show/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// Format currency
const formatCurrency = (value, symbol = "$") => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format number
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : num.toFixed(decimals);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

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

// Display value or dash
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

export default function SalesShow() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;

  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchSale = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/sales/${id}`);
        
        if (!res.ok) {
          throw new Error("Sale not found");
        }

        const data = await res.json();
        setSale(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSale();

    // Check for success message
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Link href="/sales" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <h4>Not Found</h4>
          <p>Sale not found.</p>
          <Link href="/sales" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  const diamond = sale.diamond || {};
  const client = sale.client || {};
  const broker = sale.broker || {};

  return (
    <div className="container py-4">
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

      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>Sale Details</h2>
        </div>
        <div className="col text-end">
          <Link href={`/sales/edit/${sale.id}`} className="btn btn-warning me-2">
            Edit Sale
          </Link>
          <Link href="/sales" className="btn btn-secondary">
            Back to List
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Diamond Information */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Diamond Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <table className="table table-bordered table-sm">
                    <tbody>
                      <tr>
                        <th className="bg-light">Certificate #</th>
                        <td>
                          {diamond.id ? (
                            <Link href={`/diamonds/show/${diamond.id}`}>
                              {displayValue(diamond.certificate_number)}
                            </Link>
                          ) : (
                            displayValue(diamond.certificate_number)
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th className="bg-light">Stone Type</th>
                        <td>{displayValue(diamond.stone_type)}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Shape</th>
                        <td>{displayValue(diamond.shape)}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Weight</th>
                        <td>{diamond.weight ? `${formatNumber(diamond.weight)} carats` : "-"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <table className="table table-bordered table-sm">
                    <tbody>
                      <tr>
                        <th className="bg-light">Color</th>
                        <td>{displayValue(diamond.color)}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Clarity</th>
                        <td>{displayValue(diamond.clarity)}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Cut</th>
                        <td>{displayValue(diamond.cut)}</td>
                      </tr>
                      <tr>
                        <th className="bg-light">Polish</th>
                        <td>{displayValue(diamond.pol)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Client Information</h5>
            </div>
            <div className="card-body">
              <table className="table table-bordered table-sm">
                <tbody>
                  <tr>
                    <th className="bg-light w-50">Company Name</th>
                    <td>
                      {client.id ? (
                        <Link href={`/clients/show/${client.id}`}>
                          {displayValue(client.company_name)}
                        </Link>
                      ) : (
                        displayValue(client.company_name)
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-light">Contact Name</th>
                    <td>{displayValue(client.contact_name)}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Email</th>
                    <td>
                      {client.email ? (
                        <a href={`mailto:${client.email}`}>{client.email}</a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-light">Phone</th>
                    <td>
                      {client.phone ? (
                        <a href={`tel:${client.phone}`}>{client.phone}</a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Broker Information - Only show if broker exists */}
        {sale.broker && (
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Broker Information</h5>
              </div>
              <div className="card-body">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <tr>
                      <th className="bg-light w-50">Name</th>
                      <td>
                        {broker.id ? (
                          <Link href={`/brokers/show/${broker.id}`}>
                            {displayValue(broker.name)}
                          </Link>
                        ) : (
                          displayValue(broker.name)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-light">Company</th>
                      <td>{displayValue(broker.company_name)}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Email</th>
                      <td>
                        {broker.email ? (
                          <a href={`mailto:${broker.email}`}>{broker.email}</a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-light">Phone</th>
                      <td>
                        {broker.phone ? (
                          <a href={`tel:${broker.phone}`}>{broker.phone}</a>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sale Details */}
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Sale Details</h5>
            </div>
            <div className="card-body">
              <table className="table table-bordered table-sm">
                <tbody>
                  <tr>
                    <th className="bg-light w-50">Sale Date</th>
                    <td>{formatDate(sale.created_at)}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Sale Amount (USD)</th>
                    <td><strong>{formatCurrency(sale.sale_amount)}</strong></td>
                  </tr>
                  <tr>
                    <th className="bg-light">RAP Discount</th>
                    <td>{formatNumber(sale.sale_rap_discount)}%</td>
                  </tr>

                  {sale.conversion_rate && (
                    <tr>
                      <th className="bg-light">Conversion Rate</th>
                      <td>{formatNumber(sale.conversion_rate)}</td>
                    </tr>
                  )}

                  {sale.sale_amount_inr && (
                    <tr>
                      <th className="bg-light">Sale Amount (INR)</th>
                      <td><strong>{formatCurrency(sale.sale_amount_inr, "₹")}</strong></td>
                    </tr>
                  )}

                  {sale.brokerage_rate && (
                    <tr>
                      <th className="bg-light">Brokerage Rate</th>
                      <td>{formatNumber(sale.brokerage_rate)}%</td>
                    </tr>
                  )}

                  {sale.brokerage_amount && (
                    <tr>
                      <th className="bg-light">Brokerage Amount</th>
                      <td>{formatCurrency(sale.brokerage_amount)}</td>
                    </tr>
                  )}

                  <tr>
                    <th className="bg-light">Status</th>
                    <td><StatusBadge status={sale.status} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notes - Only show if notes exist */}
        {sale.notes && (
          <div className="col-md-12 mb-4">
            <div className="card">
              <div className="card-header bg-light">
                <h5 className="card-title mb-0">Notes</h5>
              </div>
              <div className="card-body">
                <p className="mb-0">{sale.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0">Record Information</h5>
            </div>
            <div className="card-body">
              <table className="table table-bordered table-sm">
                <tbody>
                  <tr>
                    <th className="bg-light w-50">Created At</th>
                    <td>{sale.created_at ? new Date(sale.created_at).toLocaleString() : "-"}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Updated At</th>
                    <td>{sale.updated_at ? new Date(sale.updated_at).toLocaleString() : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="row mt-4 mb-5">
        <div className="col-12">
          <hr />
          <div className="d-flex justify-content-between">
            <div>
              {sale.status === "pending" && (
                <button
                  className="btn btn-success me-2"
                  onClick={async () => {
                    if (!confirm("Mark this sale as completed?")) return;
                    try {
                      const res = await fetch(`/api/sales/${sale.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...sale, status: "completed" }),
                      });
                      if (res.ok) {
                        window.location.reload();
                      }
                    } catch (err) {
                      alert("Failed to update status");
                    }
                  }}
                >
                  Mark as Completed
                </button>
              )}
              {sale.status === "pending" && (
                <button
                  className="btn btn-danger me-2"
                  onClick={async () => {
                    if (!confirm("Cancel this sale?")) return;
                    try {
                      const res = await fetch(`/api/sales/${sale.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ ...sale, status: "cancelled" }),
                      });
                      if (res.ok) {
                        window.location.reload();
                      }
                    } catch (err) {
                      alert("Failed to update status");
                    }
                  }}
                >
                  Cancel Sale
                </button>
              )}
            </div>
            <div>
              <Link href={`/sales/edit/${sale.id}`} className="btn btn-warning me-2">
                Edit Sale
              </Link>
              <button
                className="btn btn-danger me-2"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this sale?")) return;
                  try {
                    const res = await fetch(`/api/sales/${sale.id}`, { method: "DELETE" });
                    if (res.ok) {
                      window.location.href = "/sales?success=" + encodeURIComponent("Sale deleted successfully!");
                    }
                  } catch (err) {
                    alert("Failed to delete sale");
                  }
                }}
              >
                Delete
              </button>
              <Link href="/sales" className="btn btn-secondary">
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}