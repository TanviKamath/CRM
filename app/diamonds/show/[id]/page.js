// app/diamonds/show/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

function StatusPill({ status }) {
  const map = {
    available: { bg: "success", text: "Available", icon: "bi-check-circle" },
    sold: { bg: "danger", text: "Sold", icon: "bi-bag-check" },
    memo: { bg: "warning", text: "On Memo", icon: "bi-hourglass-split", textClass: "text-dark" },
    subject_to_sale: { bg: "info", text: "Subject to Sale", icon: "bi-info-circle" },
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

const formatCurrency = (value, symbol = "$") => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num)
    ? "-"
    : `${symbol}${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : num.toFixed(decimals);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = parseFloat(value);
  return Number.isNaN(num) ? "-" : `${num.toFixed(2)}%`;
};

const displayValue = (value) => (value === null || value === undefined || value === "" ? "-" : value);

function SectionCard({ title, icon, children }) {
  return (
    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: 16 }}>
      <div className="card-header bg-white border-0 py-4 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="d-flex align-items-center">
          <div
            className="rounded-3 d-flex align-items-center justify-content-center me-3"
            style={{ width: 40, height: 40, backgroundColor: `rgba(102,126,234,0.10)` }}
          >
            <i className={`bi ${icon} text-primary`} style={{ fontSize: "1.1rem" }} />
          </div>
          <div className="fw-bold">{title}</div>
        </div>
      </div>
      <div className="card-body p-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="d-flex align-items-start py-2 border-bottom border-light">
      <div className="text-muted small w-50">{label}</div>
      <div className="fw-medium w-50 text-end">{value}</div>
    </div>
  );
}

export default function ShowDiamond() {
  const params = useParams();
  const id = params.id;

  const [diamond, setDiamond] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/diamonds/${id}`).then(r => {
        if (!r.ok) throw new Error("Diamond not found");
        return r.json();
      }),
      fetch(`/api/diamonds/${id}/history`).then(r => r.ok ? r.json() : [])
    ])
      .then(([data, historyData]) => {
        setDiamond(data);
        setHistory(Array.isArray(historyData) ? historyData : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !diamond) {
    return (
      <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="container">
          <div className="alert alert-danger border-0 shadow-sm rounded-3">
            <h4 className="alert-heading h5">Error</h4>
            <p>{error || "Diamond not found."}</p>
            <Link href="/diamonds" className="btn btn-outline-danger btn-sm">
              Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div className="d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: 52,
                height: 52,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                boxShadow: "0 6px 18px rgba(102,126,234,0.25)",
              }}
            >
              <i className="bi bi-gem text-white" style={{ fontSize: "1.3rem" }} />
            </div>
            <div>
              <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                {diamond.diamond_id || "No ID"}
              </h2>
              <div className="text-muted d-flex align-items-center gap-2">
                <span>{diamond.shape}</span>
                <i className="bi bi-dot" />
                <span>{formatNumber(diamond.weight)} ct</span>
                <i className="bi bi-dot" />
                <StatusPill status={diamond.availability} />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            {diamond.availability === "available" && (
              <Link href={`/sales/create?diamond_id=${diamond.id}`} className="btn btn-success px-4" style={{ borderRadius: 10 }}>
                <i className="bi bi-cart-check me-2" />
                Sell
              </Link>
            )}
            <Link href={`/diamonds/edit/${diamond.id}`} className="btn btn-warning px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-pencil me-2" />
              Edit
            </Link>
            <Link href="/diamonds" className="btn btn-outline-secondary px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-arrow-left me-2" />
              Back
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="row g-4">
          {/* Basic */}
          <div className="col-lg-6">
            <SectionCard title="Basic Information" icon="bi-info-circle">
              <InfoRow label="Stone Type" value={displayValue(diamond.stone_type)} />
              <InfoRow label="Lab" value={displayValue(diamond.lab)} />
              <InfoRow label="Shape" value={displayValue(diamond.shape)} />
              <InfoRow label="Weight" value={diamond.weight ? `${formatNumber(diamond.weight)} carats` : "-"} />
              <InfoRow label="Color" value={displayValue(diamond.color)} />
              <InfoRow label="Clarity" value={displayValue(diamond.clarity)} />
              <InfoRow label="Cut" value={displayValue(diamond.cut)} />
              <InfoRow label="Polish" value={displayValue(diamond.pol)} />
              <InfoRow label="Symmetry" value={displayValue(diamond.sym)} />
              <InfoRow label="Fluorescence" value={displayValue(diamond.flor)} />
              <InfoRow label="Eye Clean" value={displayValue(diamond.eye_clean)} />
              <InfoRow label="No BGM" value={diamond.no_bgm === "yes" ? "Yes" : diamond.no_bgm === "no" ? "No" : "-"} />
            </SectionCard>
          </div>

          {/* Pricing */}
          <div className="col-lg-6">
            <SectionCard title="Pricing & Value" icon="bi-cash-coin">
              <div className="p-3 mb-3 bg-light rounded-3 text-center">
                <div className="text-muted small text-uppercase">Total Amount</div>
                <div className="display-6 fw-bold text-success">{formatCurrency(diamond.amount_usd)}</div>
                <div className="small text-muted">{formatCurrency(diamond.price_per_carat_usd)} / ct</div>
              </div>
              <InfoRow label="Rap Rate" value={formatCurrency(diamond.rap_rate)} />
              <InfoRow label="Rap Discount" value={formatPercent(diamond.rap_discount)} />
              <InfoRow label="Conversion Rate" value={displayValue(diamond.conversion_rate)} />
              <InfoRow label="Amount (INR)" value={formatCurrency(diamond.amount_inr, "₹")} />
              <div className="mt-4 pt-3 border-top">
                <div className="fw-bold mb-2">Purchase Details</div>
                <InfoRow label="Source" value={displayValue(diamond.purchase_from)} />
                <InfoRow label="Purchase Discount" value={formatPercent(diamond.pur_rap_discount)} />
                <InfoRow label="Purchase Price" value={formatCurrency(diamond.purchase_price)} />
              </div>
            </SectionCard>
          </div>

          {/* History Timeline */}
          <div className="col-12">
            <SectionCard title="Movement History" icon="bi-clock-history">
              {history.length === 0 ? (
                <div className="text-center text-muted py-3">No history recorded yet.</div>
              ) : (
                <div className="timeline">
                  {history.map((h, i) => (
                    <div key={h.id} className="d-flex mb-3 position-relative">
                      <div className="me-3 d-flex flex-column align-items-center" style={{ width: 40 }}>
                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${i === 0 ? 'bg-primary text-white' : 'bg-light text-muted'}`} style={{ width: 36, height: 36, zIndex: 1 }}>
                          <i className={`bi ${h.event_type === 'CREATED' ? 'bi-plus-lg' : 'bi-arrow-left-right'}`} />
                        </div>
                        {i !== history.length - 1 && <div className="bg-light" style={{ width: 2, flex: 1, minHeight: 20 }} />}
                      </div>
                      <div>
                        <div className="fw-bold">{h.event_type}</div>
                        <div className="text-muted small">{new Date(h.created_at).toLocaleString()}</div>
                        <div className="mt-1">
                          {h.event_type === 'CREATED' ? (
                            <span>Initialized at <strong>{h.to_place || 'Unknown'}</strong></span>
                          ) : (
                            <span>Moved from <strong>{h.from_place || 'Unknown'}</strong> to <strong>{h.to_place || 'Unknown'}</strong></span>
                          )}
                        </div>
                        {h.notes && <div className="text-muted small fst-italic mt-1">"{h.notes}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Report */}
          <div className="col-lg-6">
            <SectionCard title="Report & Reference" icon="bi-file-earmark-text">
              <InfoRow label="Job No" value={displayValue(diamond.job_no)} />
              <InfoRow label="Control No" value={displayValue(diamond.control_no)} />
              <InfoRow label="Diamond Dossier" value={displayValue(diamond.diamond_dossier)} />
              <InfoRow label="Report No" value={displayValue(diamond.report_no)} />
              <InfoRow label="Report Date" value={displayValue(diamond.report_dt)} />
              <InfoRow label="Client Ref" value={displayValue(diamond.client_ref)} />
              <InfoRow label="Memo No" value={displayValue(diamond.memo_no)} />
            </SectionCard>
          </div>

          {/* Dimensions */}
          <div className="col-lg-6">
            <SectionCard title="Dimensions" icon="bi-arrows-fullscreen">
              <InfoRow label="Measurements" value={displayValue(diamond.measurement)} />
              <div className="row g-2 mt-2">
                <div className="col-4 text-center p-2 bg-light rounded">
                  <div className="small text-muted">Length</div>
                  <div className="fw-bold">{formatNumber(diamond.length)}</div>
                </div>
                <div className="col-4 text-center p-2 bg-light rounded">
                  <div className="small text-muted">Width</div>
                  <div className="fw-bold">{formatNumber(diamond.width)}</div>
                </div>
                <div className="col-4 text-center p-2 bg-light rounded">
                  <div className="small text-muted">Depth</div>
                  <div className="fw-bold">{formatNumber(diamond.depth)}</div>
                </div>
              </div>
              <InfoRow label="Table" value={formatPercent(diamond.table_percentage)} />
              <InfoRow label="Depth %" value={formatPercent(diamond.depth_percentage)} />
              <InfoRow label="Ratio" value={formatNumber(diamond.ratio)} />
            </SectionCard>
          </div>

          {/* Advanced Details */}
          <div className="col-lg-12">
            <div className="accordion shadow-sm border-0" id="advancedAccordion" style={{ borderRadius: 16, overflow: "hidden" }}>
              <div className="accordion-item border-0">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAdvanced">
                    <i className="bi bi-sliders me-2 text-primary"></i>
                    View Advanced Technical Details
                  </button>
                </h2>
                <div id="collapseAdvanced" className="accordion-collapse collapse" data-bs-parent="#advancedAccordion">
                  <div className="accordion-body bg-white p-4">
                    <div className="row g-4">
                      <div className="col-md-4">
                        <h6 className="fw-bold text-muted mb-3">Origin</h6>
                        <InfoRow label="Origin" value={displayValue(diamond.country_of_origin)} />
                        <InfoRow label="Rough Report" value={displayValue(diamond.rough_report_number)} />
                        <InfoRow label="Source" value={displayValue(diamond.disclosed_source)} />
                      </div>
                      <div className="col-md-4">
                        <h6 className="fw-bold text-muted mb-3">Features</h6>
                        <InfoRow label="Polish Feat." value={displayValue(diamond.polish_features)} />
                        <InfoRow label="Symm. Feat." value={displayValue(diamond.symmetry_features)} />
                        <InfoRow label="Inscription" value={displayValue(diamond.inscription)} />
                      </div>
                      <div className="col-md-4">
                        <h6 className="fw-bold text-muted mb-3">Angles</h6>
                        <InfoRow label="Crown Angle" value={formatNumber(diamond.crn_ag)} />
                        <InfoRow label="Pavilion Angle" value={formatNumber(diamond.pav_ag)} />
                        <InfoRow label="Girdle" value={displayValue(diamond.girdle)} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="col-12 text-end mt-4">
            <button
              className="btn btn-outline-danger"
              onClick={() => {
                if (confirm("Delete this diamond? Cannot be undone.")) {
                  fetch(`/api/diamonds/${diamond.id}`, { method: "DELETE" }).then((r) => {
                    if (r.ok) window.location.href = "/diamonds";
                    else alert("Failed to delete");
                  });
                }
              }}
            >
              <i className="bi bi-trash me-2" />
              Delete Diamond
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}