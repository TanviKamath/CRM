import React, { useState, useEffect } from "react";
import QuickAddEntityModal from "./QuickAddEntityModal";

export default function MemoEditModal({ show, memo, onClose, onRefresh }) {
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ client_id: "", broker_id: "", carats: "", selling_price_per_carat: "" });
  const [error, setError] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState("client");

  const openQuickAdd = (type) => {
    setQuickAddType(type);
    setShowQuickAdd(true);
  };

  const handleQuickAddSuccess = (newEntity) => {
    if (quickAddType === "client") {
      setClients((prev) => [newEntity, ...prev]);
      setForm((prev) => ({ ...prev, client_id: newEntity.id }));
    } else {
      setBrokers((prev) => [newEntity, ...prev]);
      setForm((prev) => ({ ...prev, broker_id: newEntity.id }));
    }
    setShowQuickAdd(false);
  };

  useEffect(() => {
    if (show && memo) {
      setForm({
        client_id: memo.client_id || "",
        broker_id: memo.broker_id || "",
        carats: memo.carats || "",
        selling_price_per_carat: memo.selling_price_per_carat || ""
      });
      fetchDropdowns();
    }
  }, [show, memo]);

  const fetchDropdowns = async () => {
    try {
      const [resClients, resBrokers] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/brokers")
      ]);
      const dataC = await resClients.json();
      const dataB = await resBrokers.json();
      setClients(dataC);
      setBrokers(dataB);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/memo/${memo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          client_id: form.client_id || null,
          broker_id: form.broker_id || null,
          carats: form.carats,
          selling_price_per_carat: form.selling_price_per_carat || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onRefresh(); 
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
    <QuickAddEntityModal
        show={showQuickAdd}
        type={quickAddType}
        onClose={() => setShowQuickAdd(false)}
        onSuccess={handleQuickAddSuccess}
    />
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1055 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Edit Memo #{memo?.id}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger small py-2">{error}</div>}
            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label className="form-label small mb-1">Lot Number</label>
                <input type="text" className="form-control bg-light" value={memo?.lot_number} readOnly />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-md-6">
                  <label className="form-label small mb-1">Carats</label>
                  <input type="number" step="0.001" min="0.001" required className="form-control" value={form.carats} onChange={e=>setForm({...form, carats: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small mb-1">Est Price/ct</label>
                  <input type="number" step="0.01" min="0" className="form-control fw-semibold" value={form.selling_price_per_carat} onChange={e=>setForm({...form, selling_price_per_carat: e.target.value})} />
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label small mb-1">Client</label>
                <div className="input-group">
                  <select 
                    className="form-select" 
                    value={form.client_id} 
                    onChange={e=>{
                        if (e.target.value === "ADD_NEW") openQuickAdd("client");
                        else setForm({...form, client_id: e.target.value});
                    }}
                  >
                      <option value="">Select...</option>
                      <option value="ADD_NEW" className="fw-bold text-primary">+ Add New Client</option>
                      <hr />
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company_name} - {c.contact_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small mb-1">Broker</label>
                <div className="input-group">
                  <select 
                    className="form-select" 
                    value={form.broker_id} 
                    onChange={e=>{
                        if (e.target.value === "ADD_NEW") openQuickAdd("broker");
                        else setForm({...form, broker_id: e.target.value});
                    }}
                  >
                      <option value="">Select...</option>
                      <option value="ADD_NEW" className="fw-bold text-primary">+ Add New Broker</option>
                      <hr />
                      {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="mt-4 d-flex gap-2">
                <button type="button" className="btn btn-light flex-grow-1" onClick={onClose} style={{ borderRadius: 10 }}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading} style={{ borderRadius: 10 }}>
                  {loading ? "Updating..." : "Update Memo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
