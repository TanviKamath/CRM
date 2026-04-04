// app/sales/PaymentModeModal.jsx
"use client";

import { useState } from "react";

const ONLINE_SUBMETHODS = [
  { value: "UPI", label: "UPI" },
  { value: "Net Banking", label: "Net Banking" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "RTGS", label: "RTGS" },
  { value: "NEFT", label: "NEFT" },
];

export default function PaymentModeModal({ show, onClose, onConfirm, loading = false }) {
  const [step, setStep] = useState(1); // 1 = mode select, 2 = online sub-method
  const [mode, setMode] = useState(null); // "Cash" | "Online" | "Export"
  const [subMethod, setSubMethod] = useState("");

  const reset = () => {
    setStep(1);
    setMode(null);
    setSubMethod("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleModeSelect = (selected) => {
    setMode(selected);
    if (selected === "Online") {
      setStep(2);
    } else {
      // Cash or Export — confirm immediately
      onConfirm(selected);
      reset();
    }
  };

  const handleOnlineConfirm = () => {
    if (!subMethod) return;
    onConfirm(`Online - ${subMethod}`);
    reset();
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 1060 }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="position-fixed top-50 start-50 translate-middle"
        style={{ zIndex: 1070, width: "100%", maxWidth: 460 }}
      >
        <div
          className="bg-white shadow-lg"
          style={{ borderRadius: 20, overflow: "hidden", animation: "pmModalIn 0.25s ease-out" }}
        >
          {/* Header */}
          <div
            className="px-4 py-4"
            style={{ background: "linear-gradient(135deg, #374151 0%, #111827 100%)" }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.18)" }}
                >
                  <i className="bi bi-file-earmark-pdf-fill text-white" style={{ fontSize: "1.3rem" }} />
                </div>
                <div>
                  <h5 className="fw-bold text-white mb-0">Generate Invoice</h5>
                  <div className="text-white-50 small">
                    {step === 1 ? "Select mode of payment" : "Select online method"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link text-white p-0"
                onClick={handleClose}
                style={{ opacity: 0.75 }}
              >
                <i className="bi bi-x-lg" style={{ fontSize: "1.2rem" }} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4">
            {step === 1 && (
              <>
                <p className="text-muted small mb-4">
                  The selected payment mode will appear on the invoice.
                </p>

                <div className="d-flex flex-column gap-3">
                  {/* Cash */}
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-3 text-start px-4 py-3"
                    style={{
                      borderRadius: 14,
                      border: "2px solid rgba(0,0,0,0.12)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleModeSelect("Cash")}
                    disabled={loading}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44, backgroundColor: "rgba(0,0,0,0.06)" }}
                    >
                      <i className="bi bi-cash-stack text-dark opacity-50" style={{ fontSize: "1.2rem" }} />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Cash</div>
                      <div className="text-muted small">Physical cash payment</div>
                    </div>
                    <i className="bi bi-chevron-right text-muted ms-auto" />
                  </button>

                  {/* Online */}
                  <button
                    type="button"
                    className="btn d-flex align-items-center gap-3 text-start px-4 py-3"
                    style={{
                      borderRadius: 14,
                      border: "2px solid rgba(0,0,0,0.12)",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      transition: "all 0.2s",
                    }}
                    onClick={() => handleModeSelect("Online")}
                    disabled={loading}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 44, height: 44, backgroundColor: "rgba(0,0,0,0.06)" }}
                    >
                      <i className="bi bi-phone-fill text-dark opacity-50" style={{ fontSize: "1.2rem" }} />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">Online</div>
                      <div className="text-muted small">UPI · Net Banking · Bank Transfer · RTGS · NEFT</div>
                    </div>
                    <i className="bi bi-chevron-right text-muted ms-auto" />
                  </button>

                </div>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  className="btn btn-link text-muted p-0 mb-3 d-flex align-items-center gap-1"
                  onClick={() => setStep(1)}
                  style={{ fontSize: "0.9rem" }}
                >
                  <i className="bi bi-arrow-left" />
                  Back
                </button>

                <p className="text-muted small mb-3">Choose the online payment method:</p>

                <div className="d-flex flex-column gap-2 mb-4">
                  {ONLINE_SUBMETHODS.map((m) => (
                    <label
                      key={m.value}
                      className="d-flex align-items-center gap-3 px-4 py-3 cursor-pointer"
                      style={{
                        borderRadius: 12,
                        border: `2px solid ${subMethod === m.value ? "rgba(37,99,235,0.5)" : "rgba(0,0,0,0.08)"}`,
                        backgroundColor: subMethod === m.value ? "rgba(37,99,235,0.06)" : "#fff",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <input
                        type="radio"
                        name="subMethod"
                        value={m.value}
                        checked={subMethod === m.value}
                        onChange={() => setSubMethod(m.value)}
                        className="form-check-input m-0"
                        style={{ accentColor: "#2563eb" }}
                      />
                      <span className="fw-medium">{m.label}</span>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn w-100 py-3 text-white fw-semibold"
                  style={{
                    borderRadius: 12,
                    background: subMethod ? "linear-gradient(135deg, #374151 0%, #111827 100%)" : "#adb5bd",
                    border: "none",
                    transition: "all 0.2s",
                  }}
                  disabled={!subMethod || loading}
                  onClick={handleOnlineConfirm}
                >
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Generating...</>
                  ) : (
                    <><i className="bi bi-file-earmark-pdf-fill me-2" />Generate Invoice — Online - {subMethod || "..."}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pmModalIn {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .btn:focus { box-shadow: none !important; }
      `}</style>
    </>
  );
}