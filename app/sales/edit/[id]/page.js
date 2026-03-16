// app/sales/edit/[id]/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import SalesForm from "../../SalesForm";

function formatCurrencyINR(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id;

  const [user, setUser] = useState(null);
  const [sale, setSale] = useState(null);
  const [diamonds, setDiamonds] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sale and dropdown data
  useEffect(() => {
    if (!saleId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("Auth failed");
        const userData = await userRes.json();
        setUser(userData);

        const itemsEndpoint = userData.client_type === "Loose" 
          ? "/api/loose-diamonds/items" 
          : "/api/diamonds";

        const [saleRes, itemsRes, clientsRes, brokersRes] = await Promise.all([
          fetch(`/api/sales/${saleId}`),
          fetch(itemsEndpoint),
          fetch("/api/clients"),
          fetch("/api/brokers"),
        ]);

        if (!saleRes.ok) throw new Error("Sale not found");

        const [saleData, itemsData, clientsData, brokersData] = await Promise.all([
          saleRes.json(),
          itemsRes.json(),
          clientsRes.json(),
          brokersRes.json(),
        ]);

        setSale(saleData);
        setDiamonds(Array.isArray(itemsData) ? itemsData : itemsData.data || []);
        setClients(Array.isArray(clientsData) ? clientsData : clientsData.data || []);
        setBrokers(Array.isArray(brokersData) ? brokersData : brokersData.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load sale");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [saleId]);

  const selectedDiamond = useMemo(() => {
    const isLoose = user?.client_type === "Loose";
    const itemId = isLoose ? sale?.loose_diamond_item_id : sale?.diamond_id;
    if (!itemId) return null;
    return diamonds.find((d) => String(d.id) === String(itemId)) || (isLoose ? sale?.loose_item : sale?.diamond) || null;
  }, [diamonds, sale?.diamond_id, sale?.loose_diamond_item_id, sale?.diamond, sale?.loose_item, user]);

  const selectedClient = useMemo(() => {
    if (!sale?.client_id) return null;
    return clients.find((c) => String(c.id) === String(sale.client_id)) || sale?.client || null;
  }, [clients, sale?.client_id, sale?.client]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    const res = await fetch(`/api/sales/${saleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    router.push(`/sales/show/${saleId}?success=${encodeURIComponent("Sale updated successfully!")}`);
  };

  // Loading UI
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem", color: "#f59e0b", borderWidth: "0.2rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted">Loading sale details...</div>
        </div>
      </div>
    );
  }

  // Error UI
  if (error) {
    return (
      <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm text-center" style={{ borderRadius: 16 }}>
                <div className="card-body p-5">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
                    style={{ width: 80, height: 80, backgroundColor: "rgba(220,53,69,0.10)" }}
                  >
                    <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "2rem" }} />
                  </div>
                  <h4 className="fw-bold mb-2">Unable to load sale</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button className="btn btn-outline-warning px-4" style={{ borderRadius: 10 }} onClick={() => window.location.reload()}>
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-warning px-4" style={{ borderRadius: 10 }} href="/sales">
                      <i className="bi bi-arrow-left me-2" />
                      Back to Sales
                    </Link>
                  </div>
                </div>
              </div>
              <div className="text-center text-muted small mt-3">
                If this continues, verify Sales/Diamonds/Clients/Brokers APIs.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-8">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
              <div>
                <div className="d-flex align-items-center mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: 48,
                      height: 48,
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      boxShadow: "0 6px 18px rgba(245,158,11,0.22)",
                    }}
                  >
                    <i className="bi bi-pencil-square text-white" style={{ fontSize: "1.25rem" }} />
                  </div>

                  <div>
                    <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.3px" }}>
                      Edit Sale
                    </h2>
                    <div className="text-muted small">Update discount, brokerage and status</div>
                  </div>
                </div>

                {/* Context pill */}
                <div className="mt-2 d-flex flex-wrap gap-2">
                  <span className="badge bg-warning bg-opacity-10 text-warning px-3 py-2" style={{ borderRadius: 999 }}>
                    <i className="bi bi-hash me-2" />
                    Sale ID: {saleId}
                  </span>

                  {selectedDiamond && (
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2" style={{ borderRadius: 999 }}>
                      <i className="bi bi-gem me-2" />
                      {user?.client_type === "Loose" ? "Lot Item: " : "Diamond: "} 
                      {user?.client_type === "Loose" ? (selectedDiamond.lot_number || sale?.loose_lot_number) : selectedDiamond.certificate_number}
                    </span>
                  )}

                  {selectedClient?.company_name && (
                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2" style={{ borderRadius: 999 }}>
                      <i className="bi bi-building me-2" />
                      Client: {selectedClient.company_name}
                    </span>
                  )}

                  {sale?.sale_amount !== undefined && sale?.sale_amount !== null && (
                    <span className="badge bg-info bg-opacity-10 text-info px-3 py-2" style={{ borderRadius: 999 }}>
                      <i className="bi bi-cash-stack me-2" />
                      Amount: {formatCurrencyINR(sale.sale_amount_inr || sale.sale_amount)}
                    </span>
                  )}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Link
                  href={`/sales/show/${saleId}`}
                  className="btn btn-outline-primary px-4 d-flex align-items-center"
                  style={{ borderRadius: 10 }}
                >
                  <i className="bi bi-eye me-2" />
                  View
                </Link>
                <Link
                  href="/sales"
                  className="btn btn-outline-secondary px-4 d-flex align-items-center"
                  style={{ borderRadius: 10 }}
                >
                  <i className="bi bi-arrow-left me-2" />
                  Back
                </Link>
              </div>
            </div>

            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link href="/" className="text-decoration-none text-muted">
                    <i className="bi bi-house-door me-1" />
                    Dashboard
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href="/sales" className="text-decoration-none text-muted">
                    Sales
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={`/sales/show/${saleId}`} className="text-decoration-none text-muted">
                    Sale #{saleId}
                  </Link>
                </li>
                <li className="breadcrumb-item active text-warning" aria-current="page">
                  Edit
                </li>
              </ol>
            </nav>

            {/* Main Card */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
              <div className="card-header bg-white py-4 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="d-flex align-items-center">
                  <div className="rounded-3 d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40, backgroundColor: "rgba(245,158,11,0.12)" }}>
                    <i className="bi bi-receipt text-warning" style={{ fontSize: "1.1rem" }} />
                  </div>
                  <div>
                    <div className="fw-bold">Sale Information</div>
                    <div className="text-muted small">Review selections and update details</div>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                <SalesForm
                  user={user}
                  initial={sale}
                  diamonds={diamonds}
                  clients={clients}
                  brokers={brokers}
                  submitButtonText="Update Sale"
                  onSubmit={handleSubmit}
                />
              </div>
            </div>

            {/* Tip */}
            <div
              className="card border-0 mt-4"
              style={{
                borderRadius: 12,
                backgroundColor: "rgba(245, 158, 11, 0.05)",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-lightbulb text-warning" style={{ fontSize: "1.25rem" }} />
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Quick Tip</h6>
                    <p className="text-muted small mb-0">
                      Changing discount recalculates the sale amount. If you update brokerage rate, brokerage amount updates automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <style jsx global>{`
              .breadcrumb-item + .breadcrumb-item::before {
                color: rgba(0, 0, 0, 0.35);
              }
              .btn:focus {
                box-shadow: none !important;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}