// app/diamonds/show/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Helper function to format numbers
const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : num.toFixed(decimals);
};

// Helper function to format currency
const formatCurrency = (value, currency = "$") => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : `${currency}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Helper function to format percentage
const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return isNaN(num) ? "-" : `${num.toFixed(2)}%`;
};

// Helper to display value or dash
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return value;
};

// Card component for sections
function InfoCard({ title, children }) {
  return (
    <div className="card h-100">
      <div className="card-header bg-light">
        <h5 className="card-title mb-0">{title}</h5>
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}

// Table row component
function InfoRow({ label, value }) {
  return (
    <tr>
      <th className="w-50 bg-light">{label}</th>
      <td>{value}</td>
    </tr>
  );
}

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

export default function ShowDiamond() {
  const params = useParams();
  const id = params.id;
  
  const [diamond, setDiamond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    fetch(`/api/diamonds/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Diamond not found");
        return r.json();
      })
      .then((data) => {
        setDiamond(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

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
          <Link href="/diamonds" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  if (!diamond) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <h4>Not Found</h4>
          <p>Diamond not found.</p>
          <Link href="/diamonds" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <h2>
            Diamond Details 
            <small className="text-muted ms-2">#{diamond.id}</small>
            <span className="ms-3">
              <AvailabilityBadge status={diamond.availability} />
            </span>
          </h2>
        </div>
        <div className="col text-end">
          {diamond.availability === "available" && (
            <Link href={`/sales/create?diamond_id=${diamond.id}`} className="btn btn-success me-2">
              <i className="bi bi-cart-check me-1"></i> Record Sale
            </Link>
          )}
          <Link href={`/diamonds/edit/${diamond.id}`} className="btn btn-warning me-2">
            <i className="bi bi-pencil me-1"></i> Edit Diamond
          </Link>
          <Link href="/diamonds" className="btn btn-secondary">
            <i className="bi bi-arrow-left me-1"></i> Back to List
          </Link>
        </div>
      </div>

      <div className="row">
        {/* Basic Information */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Basic Information">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Stone Type" value={displayValue(diamond.stone_type)} />
                    <InfoRow label="Lab" value={displayValue(diamond.lab)} />
                    <InfoRow label="Certificate Number" value={displayValue(diamond.certificate_number)} />
                    <InfoRow label="Shape" value={displayValue(diamond.shape)} />
                    <InfoRow label="Weight" value={diamond.weight ? `${formatNumber(diamond.weight)} carats` : "-"} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Color" value={displayValue(diamond.color)} />
                    <InfoRow label="Clarity" value={displayValue(diamond.clarity)} />
                    <InfoRow label="Cut" value={displayValue(diamond.cut)} />
                    <InfoRow label="Polish" value={displayValue(diamond.pol)} />
                    <InfoRow label="Symmetry" value={displayValue(diamond.sym)} />
                    <InfoRow label="Fluorescence" value={displayValue(diamond.flor)} />
                    <InfoRow label="Eye Clean" value={displayValue(diamond.eye_clean)} />
                    <InfoRow label="No BGM" value={diamond.no_bgm === "yes" ? "Yes" : diamond.no_bgm === "no" ? "No" : "-"} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Quality Characteristics */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Quality Characteristics">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Color Descriptions" value={displayValue(diamond.color_descriptions)} />
                    <InfoRow label="Clarity Status" value={displayValue(diamond.clarity_status)} />
                    <InfoRow label="Final Cut" value={displayValue(diamond.final_cut)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Fluorescence Intensity" value={displayValue(diamond.fluorescence_intensity)} />
                    <InfoRow label="Fluorescence Color" value={displayValue(diamond.fluorescence_color)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Report & Reference Information */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Report & Reference Information">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Job No" value={displayValue(diamond.job_no)} />
                    <InfoRow label="Control No" value={displayValue(diamond.control_no)} />
                    <InfoRow label="Diamond Dossier" value={displayValue(diamond.diamond_dossier)} />
                    <InfoRow label="Report No" value={displayValue(diamond.report_no)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Report Date" value={displayValue(diamond.report_dt)} />
                    <InfoRow label="Client Reference" value={displayValue(diamond.client_ref)} />
                    <InfoRow label="Memo No" value={displayValue(diamond.memo_no)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Origin & Source Information */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Origin & Source Information">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Country of Origin" value={displayValue(diamond.country_of_origin)} />
                    <InfoRow label="Rough Report Number" value={displayValue(diamond.rough_report_number)} />
                    <InfoRow label="Diamond Type" value={displayValue(diamond.diamond_type)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Disclosed Source" value={displayValue(diamond.disclosed_source)} />
                    <InfoRow label="Kimberley Process No" value={displayValue(diamond.kimberley_process_number)} />
                    <InfoRow label="Rough Invoice No" value={displayValue(diamond.rough_invoice_number)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Price Information */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Price Information">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Rap Rate" value={formatCurrency(diamond.rap_rate)} />
                    <InfoRow label="Rap Discount" value={formatPercent(diamond.rap_discount)} />
                    <InfoRow label="Price/Carat (USD)" value={formatCurrency(diamond.price_per_carat_usd)} />
                    <InfoRow label="Total Amount (USD)" value={formatCurrency(diamond.amount_usd)} />
                    <InfoRow label="Conversion Rate" value={displayValue(diamond.conversion_rate)} />
                    <InfoRow label="Amount (INR)" value={formatCurrency(diamond.amount_inr, "₹")} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Purchase From" value={displayValue(diamond.purchase_from)} />
                    <InfoRow label="Purchase Rap Discount" value={formatPercent(diamond.pur_rap_discount)} />
                    <InfoRow label="Purchase Price (USD)" value={formatCurrency(diamond.purchase_price)} />
                    <InfoRow label="Purchase Conv. Rate" value={displayValue(diamond.purchase_conversion_rate)} />
                    <InfoRow label="Purchase Price (INR)" value={formatCurrency(diamond.purchase_price_inr, "₹")} />
                    <InfoRow label="Availability" value={<AvailabilityBadge status={diamond.availability} />} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Dimensions & Measurements */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Dimensions & Measurements">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Measurement" value={displayValue(diamond.measurement)} />
                    <InfoRow label="Length (mm)" value={formatNumber(diamond.length)} />
                    <InfoRow label="Width (mm)" value={formatNumber(diamond.width)} />
                    <InfoRow label="Depth (mm)" value={formatNumber(diamond.depth)} />
                    <InfoRow label="Table %" value={formatPercent(diamond.table_percentage)} />
                    <InfoRow label="Depth %" value={formatPercent(diamond.depth_percentage)} />
                    <InfoRow label="Ratio" value={formatNumber(diamond.ratio)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Crown Angle" value={formatNumber(diamond.crn_ag)} />
                    <InfoRow label="Crown Height" value={formatNumber(diamond.crn_ht)} />
                    <InfoRow label="Pavilion Angle" value={formatNumber(diamond.pav_ag)} />
                    <InfoRow label="Pavilion Depth" value={formatNumber(diamond.pav_dp)} />
                    <InfoRow label="Star Length" value={formatNumber(diamond.str_ln)} />
                    <InfoRow label="Lower Half" value={formatNumber(diamond.lr_half)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Girdle & Culet */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Girdle & Culet">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Girdle" value={displayValue(diamond.girdle)} />
                    <InfoRow label="Girdle Condition" value={displayValue(diamond.girdle_condition)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Girdle %" value={displayValue(diamond.girdle_pct)} />
                    <InfoRow label="Culet Size" value={displayValue(diamond.culet_size)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Additional Features & Comments */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Additional Features & Comments">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Polish Features" value={displayValue(diamond.polish_features)} />
                    <InfoRow label="Symmetry Features" value={displayValue(diamond.symmetry_features)} />
                    <InfoRow label="Painting" value={displayValue(diamond.painting)} />
                    <InfoRow label="Proportion" value={displayValue(diamond.proportion)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Paint Comments" value={displayValue(diamond.paint_comm)} />
                    <InfoRow label="Key to Symbols" value={displayValue(diamond.key_to_symbols)} />
                    <InfoRow label="Report Comments" value={displayValue(diamond.report_comments)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Additional Technical Details */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Additional Technical Details">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Inscription" value={displayValue(diamond.inscription)} />
                    <InfoRow label="Synthetic Indicator" value={displayValue(diamond.synthetic_indicator)} />
                    <InfoRow label="AGSI/ASET" value={displayValue(diamond.agsi_aset)} />
                    <InfoRow label="Shape Description" value={displayValue(diamond.shape_description)} />
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <table className="table table-bordered table-sm">
                  <tbody>
                    <InfoRow label="Report Type" value={displayValue(diamond.report_type)} />
                    <InfoRow label="Sorting" value={displayValue(diamond.sorting)} />
                    <InfoRow label="Basket Status" value={displayValue(diamond.basket_status)} />
                  </tbody>
                </table>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Timestamps */}
        <div className="col-md-6 mb-4">
          <InfoCard title="Record Information">
            <table className="table table-bordered table-sm">
              <tbody>
                <InfoRow label="Created At" value={diamond.created_at ? new Date(diamond.created_at).toLocaleString() : "-"} />
                <InfoRow label="Updated At" value={diamond.updated_at ? new Date(diamond.updated_at).toLocaleString() : "-"} />
              </tbody>
            </table>
          </InfoCard>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="row mt-4 mb-5">
        <div className="col-12">
          <hr />
          <div className="d-flex justify-content-between">
            <div>
              {diamond.availability === "available" && (
                <>
                  <Link href={`/sales/create?diamond_id=${diamond.id}`} className="btn btn-success me-2">
                    Record Sale
                  </Link>
                  <Link href={`/memos/create?diamond_id=${diamond.id}`} className="btn btn-info me-2">
                    Create Memo
                  </Link>
                </>
              )}
            </div>
            <div>
              <Link href={`/diamonds/edit/${diamond.id}`} className="btn btn-warning me-2">
                Edit Diamond
              </Link>
              <button 
                className="btn btn-danger me-2"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this diamond?")) {
                    fetch(`/api/diamonds/${diamond.id}`, { method: "DELETE" })
                      .then((r) => {
                        if (r.ok) {
                          window.location.href = "/diamonds";
                        } else {
                          alert("Failed to delete diamond");
                        }
                      });
                  }
                }}
              >
                Delete
              </button>
              <Link href="/diamonds" className="btn btn-secondary">
                Back to List
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}