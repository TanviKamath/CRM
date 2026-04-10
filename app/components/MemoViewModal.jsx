import React from "react";

export default function MemoViewModal({ show, memo, onClose }) {
  if (!show || !memo) return null;

  const formatINR = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = parseFloat(value);
    return Number.isNaN(num) ? "-" : `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">Memo Details #{memo.id}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body p-4">
            {/* Diamond Info Section */}
            <div className="mb-4">
              <h6 className="text-muted small text-uppercase fw-bold ls-1 mb-3">Diamond Specifications</h6>
              <div className="p-3 bg-light rounded-3">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-muted small">Lot Number</div>
                    <div className="fw-bold text-dark">LOT-{memo.lot_number}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Color Category</div>
                    <div className="fw-bold text-dark">{memo.color_category || "N/A"}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Size / Sieve</div>
                    <div className="fw-bold text-dark">{memo.size_category || "N/A"}</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Grade / Purity</div>
                    <div className="fw-bold text-dark">{memo.grade || "N/A"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Memo Transaction Section */}
            <div className="mb-4">
              <h6 className="text-muted small text-uppercase fw-bold ls-1 mb-3">Memo Transaction</h6>
              <div className="p-3 border rounded-3">
                <div className="row g-3">
                  <div className="col-6">
                    <div className="text-muted small">Carats Given</div>
                    <div className="fw-bold text-primary fs-5">{parseFloat(memo.carats).toFixed(3)} ct</div>
                  </div>
                  <div className="col-6">
                    <div className="text-muted small">Price / Carat</div>
                    <div className="fw-bold text-dark">{formatINR(memo.selling_price_per_carat)}</div>
                  </div>
                  <div className="col-12 border-top pt-3">
                    <div className="text-muted small">Estimated Total Value</div>
                    <div className="fw-bold text-success fs-4">
                      {formatINR(parseFloat(memo.carats) * parseFloat(memo.selling_price_per_carat || 0))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parties Section */}
            <div className="mb-2">
              <h6 className="text-muted small text-uppercase fw-bold ls-1 mb-3">Parties Involved</h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center p-2 border rounded-3 bg-white">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                    <i className="bi bi-person-fill text-primary"></i>
                  </div>
                  <div>
                    <div className="text-muted small">Client</div>
                    <div className="fw-semibold">{memo.client_name || "Direct Sale"}</div>
                  </div>
                </div>
                {memo.broker_name && (
                  <div className="d-flex align-items-center p-2 border rounded-3 bg-white">
                    <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                      <i className="bi bi-person-badge-fill text-info"></i>
                    </div>
                    <div>
                      <div className="text-muted small">Broker</div>
                      <div className="fw-semibold">{memo.broker_name}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
               <button className="btn btn-dark w-100 py-2 border-0 shadow-sm" style={{ borderRadius: 12 }} onClick={onClose}>
                 Close View
               </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .ls-1 { letter-spacing: 0.5px; }
      `}</style>
    </div>
  );
}
