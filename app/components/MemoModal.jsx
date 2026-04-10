import React, { useState, useEffect } from "react";
import QuickAddEntityModal from "./QuickAddEntityModal";
import MemoEditModal from "./MemoEditModal";
import ActionButton from "./ActionButton";

export default function MemoModal({ show, item, onClose, onRefresh }) {
  const [memos, setMemos] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(false);

  // New Memo form
  const [form, setForm] = useState({ client_id: "", broker_id: "", carats: "", selling_price_per_carat: "" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const availableCarats = item ? (parseFloat(item.carats) - parseFloat(item.total_on_memo_carats || 0)).toFixed(3) : 0;
  const pricePerCarat = parseFloat(item?.final_price_per_carat || 0);
  const estimatedPricePerCarat = parseFloat(form.selling_price_per_carat || pricePerCarat || 0);
  const currentMemoAmount = parseFloat(form.carats || 0) * estimatedPricePerCarat;
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddType, setQuickAddType] = useState("client");
  const [editingMemo, setEditingMemo] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
    if (show && item) {
      setForm(f => ({ ...f, selling_price_per_carat: item.final_price_per_carat || "" }));
      fetchMemos();
      fetchDropdowns();
    }
  }, [show, item]);

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

  const fetchMemos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/memo?item_id=${item.id}`);
      if (res.ok) {
        setMemos(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMemo = async (e) => {
    e.preventDefault();
    setError("");
    if (parseFloat(form.carats) > availableCarats) {
        setError("Cannot give more than available carats.");
        return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loose_diamond_item_id: item.id,
          client_id: form.client_id || null,
          broker_id: form.broker_id || null,
          carats: form.carats,
          selling_price_per_carat: form.selling_price_per_carat || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ client_id: "", broker_id: "", carats: "", selling_price_per_carat: item.final_price_per_carat || "" });
      fetchMemos();
      onRefresh(); // Refresh parent
      setSuccessMsg(true);
      setTimeout(() => {
          setSuccessMsg(false);
          onClose(); // Automatically close modal
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (memo, action) => {
      // For simplicity, we fully return or fully convert the memo right now.
      const confirmMsg = action === 'return' ? "Are you sure you want to return this memo?" : "Mark this memo as sold? \nNote: Please create the actual sale entry via the Sales module.";
      if (!confirm(confirmMsg)) return;

      try {
        const res = await fetch(`/api/memo/${memo.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, carats: memo.carats })
        });
        if (res.ok) {
            fetchMemos();
            onRefresh();
            if (action === 'convert_sale') {
                window.location.href = `/sales/create?diamond_id=${memo.loose_diamond_item_id}`;
            }
        } else {
            const data = await res.json();
            alert(data.error);
        }
      } catch (e) {
          console.error(e);
      }
  };

  const handleEdit = (memo) => {
    setEditingMemo(memo);
    setShowEditModal(true);
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
    <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: showQuickAdd ? 1040 : 1055 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title fw-bold">Memo Details - LOT-{item?.lot_number}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="d-flex flex-wrap gap-4 mb-4 p-3 bg-light rounded">
                <div>
                    <div className="text-muted small text-uppercase">Total Carats</div>
                    <div className="fw-bold fs-5">{parseFloat(item?.carats).toFixed(3)}</div>
                </div>
                <div>
                    <div className="text-muted small text-uppercase">Available</div>
                    <div className="fw-bold fs-5 text-success">{availableCarats}</div>
                </div>
                <div>
                    <div className="text-muted small text-uppercase">On Memo</div>
                    <div className="fw-bold fs-5 text-warning">{parseFloat(item?.total_on_memo_carats || 0).toFixed(3)}</div>
                </div>
                <div className="ms-auto text-end border-start ps-4">
                    <div className="text-muted small text-uppercase">Price / Carat</div>
                    <div className="fw-bold fs-5 text-primary">₹{pricePerCarat.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            {successMsg ? (
                <div className="alert alert-success d-flex align-items-center justify-content-center p-4 mb-4 rounded-3 border-0" style={{ backgroundColor: "#d1e7dd", color: "#0f5132" }}>
                    <i className="bi bi-check-circle-fill me-3" style={{ fontSize: "2rem" }}></i>
                    <div>
                        <h5 className="mb-1 fw-bold">Memo Added Successfully!</h5>
                        <div className="small">Closing window...</div>
                    </div>
                </div>
            ) : (
                <>
                <h6>Give on Memo</h6>
                {error && <div className="alert alert-danger small py-2">{error}</div>}
                <form onSubmit={handleCreateMemo} className="row g-2 mb-4 align-items-end">
                <div className="col-md-2">
                    <label className="form-label small mb-1">Carats</label>
                    <input type="number" step="0.001" min="0.001" max={availableCarats} required className="form-control" value={form.carats} onChange={e=>setForm({...form, carats: e.target.value})} />
                </div>
                <div className="col-md-3">
                    <label className="form-label small mb-1">Client</label>
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
                <div className="col-md-3">
                    <label className="form-label small mb-1">Broker</label>
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
                <div className="col-md-2">
                    <label className="form-label small mb-1">Est Price/ct</label>
                    <input type="number" step="0.01" min="0" className="form-control fw-semibold" value={form.selling_price_per_carat} onChange={e=>setForm({...form, selling_price_per_carat: e.target.value})} placeholder={pricePerCarat} />
                </div>
                <div className="col-md-2">
                    <button type="submit" className="btn btn-primary w-100" disabled={loading || availableCarats <= 0}>Give</button>
                </div>
                {form.carats > 0 && (
                  <div className="col-12 mt-2 text-end text-muted small">
                     Estimated Memo Value: <span className="fw-bold ms-1 text-dark">₹{currentMemoAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
            </form>
            </>
            )}

            <h6>Active Memos</h6>
            <div className="table-responsive">
                <table className="table table-sm align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>Date</th>
                            <th>Carats</th>
                            <th>Amount (Est.)</th>
                            <th>Client / Broker</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {memos.length === 0 ? (
                            <tr><td colSpan="4" className="text-center text-muted small py-3">No active memos</td></tr>
                        ) : memos.map(m => (
                            <tr key={m.id}>
                                <td className="small">{new Date(m.created_at).toLocaleDateString()}</td>
                                <td className="fw-medium">{parseFloat(m.carats).toFixed(3)}</td>
                                <td className="small fw-semibold text-secondary">
                                    ₹{(parseFloat(m.carats) * parseFloat(m.selling_price_per_carat || pricePerCarat)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    <div className="small opacity-50 fw-normal">@ ₹{parseFloat(m.selling_price_per_carat || pricePerCarat).toLocaleString("en-IN")}</div>
                                </td>
                                <td className="small">
                                    {(m.client_name || m.broker_name) ? (
                                        <>
                                            {m.client_name && <div><i className="bi bi-person me-1"></i>{m.client_name}</div>}
                                            {m.broker_name && <div><i className="bi bi-person-badge me-1"></i>{m.broker_name}</div>}
                                        </>
                                    ) : '-'}
                                </td>
                                <td className="text-end">
                                    <div className="d-flex justify-content-end gap-2">
                                        <ActionButton 
                                            onClick={() => handleEdit(m)} 
                                            variant="outline-warning" 
                                            icon="bi-pencil" 
                                            title="Edit Memo" 
                                        />
                                        <ActionButton 
                                            onClick={() => handleAction(m, 'convert_sale')} 
                                            variant="success" 
                                            icon="bi-check-lg" 
                                            title="Mark as Sold" 
                                        />
                                        <ActionButton 
                                            onClick={() => handleAction(m, 'return')} 
                                            variant="outline-danger" 
                                            icon="bi-arrow-return-left" 
                                            title="Return Memo" 
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

          </div>
        </div>
      </div>
    </div>
    
    <MemoEditModal 
      show={showEditModal} 
      memo={editingMemo} 
      onClose={() => setShowEditModal(false)} 
      onRefresh={() => { fetchMemos(); onRefresh(); }} 
    />
    </>
  );
}
