// app/clients/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function initialsOf(company, contact) {
  const base = (company || contact || "").trim();
  if (!base) return "C";
  return base.charAt(0).toUpperCase();
}

function ClientAvatar({ company_name, contact_name }) {
  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 38,
        height: 38,
        background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
        boxShadow: "0 6px 18px rgba(34,197,94,0.20)",
      }}
      aria-hidden="true"
    >
      <span className="text-white fw-bold" style={{ fontSize: "0.95rem" }}>
        {initialsOf(company_name, contact_name)}
      </span>
    </div>
  );
}

function StatPill({ icon, label, value, tone = "success" }) {
  return (
    <span
      className={`badge bg-${tone} bg-opacity-10 text-${tone} px-3 py-2`}
      style={{ borderRadius: 999 }}
    >
      <i className={`bi ${icon} me-2`} />
      <span className="me-1">{label}:</span>
      <span className="fw-semibold">{value}</span>
    </span>
  );
}

export default function ClientsIndex() {
  const searchParams = useSearchParams();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // local quick search
  const [q, setQ] = useState("");

  const fetchClients = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch clients");

      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
      else setClients(data.data || []);
    } catch (err) {
      console.error(err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    const success = searchParams.get("success");
    if (success) setSuccessMessage(decodeURIComponent(success));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleDelete = async (id, companyName) => {
    if (!confirm(`Are you sure you want to delete client "${companyName}"?`)) return;

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete client");

      setSuccessMessage("Client deleted successfully!");
      fetchClients();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredClients = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((c) => {
      const hay = [c.company_name, c.contact_name, c.email, c.phone, String(c.id ?? "")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [clients, q]);

  const dismissSuccess = () => setSuccessMessage("");

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                style={{
                  width: 52,
                  height: 52,
                  background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
                  boxShadow: "0 6px 18px rgba(34,197,94,0.22)",
                }}
              >
                <i className="bi bi-people-fill text-white" style={{ fontSize: "1.3rem" }} />
              </div>
              <div>
                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                  Clients
                </h2>
                <div className="text-muted">Manage client KYC records and contact details.</div>
              </div>
            </div>

            <div className="mt-3 d-flex flex-wrap gap-2">
              <StatPill icon="bi-collection" label="Total" value={clients.length} tone="success" />
              <StatPill icon="bi-eye" label="Showing" value={filteredClients.length} tone="primary" />
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href="/clients/create" className="btn btn-success px-4" style={{ borderRadius: 10 }}>
              <i className="bi bi-person-plus-fill me-2" />
              Add Client
            </Link>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show border-0 shadow-sm" role="alert" style={{ borderRadius: 14 }}>
            <i className="bi bi-check-circle me-2" />
            {successMessage}
            <button type="button" className="btn-close" onClick={dismissSuccess} aria-label="Close" />
          </div>
        )}

        {/* Controls */}
        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: 16 }}>
          <div className="card-body p-4">
            <div className="row g-3 align-items-end">
              <div className="col-lg-7">
                <label className="form-label text-muted small mb-2">Quick Search</label>
                <div className="input-group" style={{ borderRadius: 12, overflow: "hidden" }}>
                  <span className="input-group-text bg-white border-0">
                    <i className="bi bi-search text-muted" />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="form-control border-0"
                    placeholder="Search by company, contact, email, phone..."
                    style={{ boxShadow: "none" }}
                  />
                  {q && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary border-0"
                      onClick={() => setQ("")}
                      title="Clear"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}
                </div>
                <div className="text-muted small mt-2">Filters results already loaded from the server.</div>
              </div>

              <div className="col-lg-5 d-flex justify-content-lg-end">
                <div
                  className="d-flex align-items-center gap-2 p-2"
                  style={{
                    backgroundColor: "rgba(34,197,94,0.06)",
                    border: "1px solid rgba(34,197,94,0.12)",
                    borderRadius: 14,
                  }}
                >
                  <i className="bi bi-info-circle text-success ms-2" />
                  <div className="small text-muted me-2">Click a client name to open details.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="card border-0 shadow-sm" style={{ borderRadius: 16 }}>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#ffffff" }}>
                  <tr>
                    <th className="px-4 py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Client
                    </th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Contact
                    </th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Email
                    </th>
                    <th className="py-3 text-muted" style={{ fontSize: "0.85rem" }}>
                      Phone
                    </th>
                    <th className="py-3 text-muted text-center" style={{ width: 220, fontSize: "0.85rem" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div className="spinner-border" role="status" style={{ color: "#22c55e" }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="text-muted mt-2">Loading clients...</div>
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5">
                        <div
                          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                          style={{ width: 70, height: 70, backgroundColor: "rgba(108,117,125,0.08)" }}
                        >
                          <i className="bi bi-inbox text-muted" style={{ fontSize: "1.8rem" }} />
                        </div>
                        <div className="fw-semibold">No clients found</div>
                        <div className="text-muted small mb-3">Try clearing the search or add a new client.</div>
                        <Link href="/clients/create" className="btn btn-success px-4" style={{ borderRadius: 10 }}>
                          <i className="bi bi-person-plus-fill me-2" />
                          Add Client
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => (
                      <tr key={client.id}>
                        {/* Client */}
                        <td className="px-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <ClientAvatar company_name={client.company_name} contact_name={client.contact_name} />
                            <div>
                              <div className="fw-semibold">
                                <Link className="text-decoration-none" href={`/clients/show/${client.id}`}>
                                  {client.company_name || "-"}
                                </Link>
                              </div>
                              <div className="text-muted small">
                                <i className="bi bi-hash me-1" />
                                {client.id}
                                {client.address ? (
                                  <>
                                    <span className="mx-2">•</span>
                                    <i className="bi bi-geo-alt me-1" />
                                    {String(client.address).slice(0, 42)}
                                    {String(client.address).length > 42 ? "…" : ""}
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3">
                          <div className="fw-medium">{client.contact_name || "-"}</div>
                          <div className="text-muted small">
                            <i className="bi bi-building me-1" />
                            {client.company_name || "-"}
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3">
                          {client.email ? (
                            <a className="text-decoration-none" href={`mailto:${client.email}`}>
                              <i className="bi bi-envelope me-2 text-muted" />
                              {client.email}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3">
                          {client.phone ? (
                            <a className="text-decoration-none" href={`tel:${client.phone}`}>
                              <i className="bi bi-telephone me-2 text-muted" />
                              {client.phone}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-center">
                          <div className="btn-group" role="group" aria-label="Actions">
                            <Link
                              href={`/clients/show/${client.id}`}
                              className="btn btn-sm btn-outline-success"
                              style={{ borderRadius: "10px 0 0 10px" }}
                              title="View"
                            >
                              <i className="bi bi-eye me-1" />
                              View
                            </Link>
                            <Link href={`/clients/edit/${client.id}`} className="btn btn-sm btn-outline-warning" title="Edit">
                              <i className="bi bi-pencil me-1" />
                              Edit
                            </Link>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              style={{ borderRadius: "0 10px 10px 0" }}
                              title="Delete"
                              onClick={() => handleDelete(client.id, client.company_name)}
                            >
                              <i className="bi bi-trash me-1" />
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

            {/* Footer */}
            <div
              className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-4 py-3"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#fff" }}
            >
              <div className="text-muted small">
                Showing <span className="fw-semibold">{filteredClients.length}</span> clients
              </div>

              <div className="text-muted small">
                <i className="bi bi-shield-check me-2" />
                Data is stored securely.
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .btn:focus {
            box-shadow: none !important;
          }
          .page-link:focus {
            box-shadow: none !important;
          }
        `}</style>
      </div>
    </div>
  );
}