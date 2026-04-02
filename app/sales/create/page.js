// app/sales/create/page.js
"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SalesForm from "../SalesForm";
import PageSkeleton from "../../components/PageSkeleton";

function CreateSalePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState(null);
  const [diamonds, setDiamonds] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pre-selected diamond from URL (e.g., from diamonds list "Record Sale" button)
  const preSelectedDiamondId = searchParams.get("diamond_id") || "";

  const preSelectedDiamond = useMemo(() => {
    if (!preSelectedDiamondId) return null;
    return diamonds.find((d) => String(d.id) === String(preSelectedDiamondId)) || null;
  }, [diamonds, preSelectedDiamondId]);

  // Load dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // First get user to know which items to fetch
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) throw new Error("Authentication failed");
        const userData = await userRes.json();
        setUser(userData);

        const itemsEndpoint = userData.client_type === "Loose" 
          ? "/api/loose-diamonds/items?available=true" 
          : "/api/diamonds?availability=available";

        const [itemsRes, clientsRes, brokersRes] = await Promise.all([
          fetch(itemsEndpoint),
          fetch("/api/clients"),
          fetch("/api/brokers"),
        ]);

        if (!itemsRes.ok || !clientsRes.ok || !brokersRes.ok) {
          throw new Error("Failed to load form data");
        }

        const [itemsData, clientsData, brokersData] = await Promise.all([
          itemsRes.json(),
          clientsRes.json(),
          brokersRes.json(),
        ]);

        setDiamonds(Array.isArray(itemsData) ? itemsData : itemsData.data || []);
        setClients(Array.isArray(clientsData) ? clientsData : clientsData.data || []);
        setBrokers(Array.isArray(brokersData) ? brokersData : brokersData.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form submission
  const handleSubmit = async (formData) => {
    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    router.push(`/sales/show/${data.id}?success=${encodeURIComponent("Sale created successfully!")}`);
  };

  // Loading UI
  if (loading) {
    return <PageSkeleton />;
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
                  <h4 className="fw-bold mb-2">Unable to load the form</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-outline-info px-4"
                      style={{ borderRadius: 10 }}
                      onClick={() => window.location.reload()}
                    >
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-info px-4" style={{ borderRadius: 10 }} href="/sales">
                      <i className="bi bi-arrow-left me-2" />
                      Back to Sales
                    </Link>
                  </div>
                </div>
              </div>
              <div className="text-center text-muted small mt-3">
                If this keeps happening, check that Diamonds/Clients/Brokers APIs are working.
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
                      background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                      boxShadow: "0 6px 18px rgba(37,99,235,0.22)",
                    }}
                  >
                    <i className="bi bi-cash-coin text-white" style={{ fontSize: "1.25rem" }} />
                  </div>

                  <div>
                    <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.3px" }}>
                      Create New Sale
                    </h2>
                    <div className="text-muted small">Record a transaction and calculate brokerage automatically</div>
                  </div>
                </div>

                {/* Context pill if pre-selected diamond */}
                {preSelectedDiamond && (
                  <div className="mt-2">
                    <span
                      className="badge bg-info bg-opacity-10 text-info px-3 py-2"
                      style={{ borderRadius: 999 }}
                    >
                      <i className="bi bi-gem me-2" />
                      Pre-selected {user?.client_type === "Loose" ? "Lot Item" : "Diamond"}: {user?.client_type === "Loose" ? `LOT-${preSelectedDiamond.lot_number}` : preSelectedDiamond.certificate_number} 
                      ({user?.client_type === "Loose" 
                        ? `${preSelectedDiamond.color_category} ${preSelectedDiamond.size_category} / ${preSelectedDiamond.grade}` 
                        : `${preSelectedDiamond.shape} ${preSelectedDiamond.weight}ct ${preSelectedDiamond.color}/${preSelectedDiamond.clarity}`})
                    </span>
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
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
                <li className="breadcrumb-item active text-info" aria-current="page">
                  Create
                </li>
              </ol>
            </nav>

            {/* Main Card */}
            <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
              <div
                className="card-header bg-white py-4 px-4"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center me-3"
                    style={{ width: 40, height: 40, backgroundColor: "rgba(14,165,233,0.10)" }}
                  >
                    <i className="bi bi-receipt text-info" style={{ fontSize: "1.1rem" }} />
                  </div>
                  <div>
                    <div className="fw-bold">Sale Information</div>
                    <div className="text-muted small">Select diamond, client and enter discount</div>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                <SalesForm
                  user={user}
                  diamonds={diamonds}
                  clients={clients}
                  brokers={brokers}
                  preSelectedDiamondId={preSelectedDiamondId}
                  submitButtonText="Create Sale"
                  onSubmit={handleSubmit}
                />
              </div>
            </div>

            {/* Tip Card */}
            <div
              className="card border-0 mt-4"
              style={{
                borderRadius: 12,
                background: "linear-gradient(135deg, rgba(14,165,233,0.06) 0%, rgba(37,99,235,0.05) 100%)",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-info-circle text-info" style={{ fontSize: "1.25rem" }} />
                  </div>
                  <div>
                    <h6 className="fw-semibold mb-1">Tip</h6>
                    <p className="text-muted small mb-0">
                      Sale amount is auto-calculated from diamond weight, RAP rate and sale discount. Add conversion rate
                      to compute INR amount.
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

export default function CreateSalePage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <CreateSalePageContent />
    </Suspense>
  );
}
