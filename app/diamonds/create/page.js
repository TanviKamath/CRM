// app/diamonds/create/page.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DiamondsForm from "../DiamondsForm";

export default function CreateDiamond() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);

  useEffect(() => {
    // Fetch user and check client type
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((userData) => {
        if (userData.client_type?.toLowerCase() === "loose") {
          router.replace("/loose-diamonds/create");
        }
      })
      .catch((err) => console.error("Failed to fetch user context:", err));

    // Fetch clients and brokers
    Promise.all([
      fetch("/api/clients").then((res) => res.json()),
      fetch("/api/brokers").then((res) => res.json()),
    ])
      .then(([c, b]) => {
        setClients(Array.isArray(c) ? c : c.data || []);
        setBrokers(Array.isArray(b) ? b : b.data || []);
      })
      .catch((err) => console.error("Failed to fetch dependencies:", err));
  }, [router]);

  const handleSuccess = (data) => {
    router.push(`/diamonds/show/${data.id}?success=${encodeURIComponent("Diamond added successfully!")}`);
  };

  return (
    <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
                  }}
                >
                  <i className="bi bi-gem text-white" style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.5px" }}>
                    Add Diamond
                  </h2>
                  <div className="text-muted small">Enter stone details to add to inventory</div>
                </div>
              </div>

              <Link
                href="/diamonds"
                className="btn btn-outline-secondary px-4 d-flex align-items-center"
                style={{ borderRadius: 10 }}
              >
                <i className="bi bi-arrow-left me-2" />
                Back to List
              </Link>
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
                  <Link href="/diamonds" className="text-decoration-none text-muted">
                    Diamonds
                  </Link>
                </li>
                <li className="breadcrumb-item active text-primary" aria-current="page">
                  New Entry
                </li>
              </ol>
            </nav>

            {/* Form Card */}
            <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: 20 }}>
              <div className="card-header bg-white border-0 py-4 px-4 px-md-5">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center me-3"
                    style={{ width: 42, height: 42, backgroundColor: "rgba(102,126,234,0.10)" }}
                  >
                    <i className="bi bi-plus-lg text-primary" style={{ fontSize: "1.2rem" }} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">New Diamond Entry</h5>
                    <div className="text-muted small">Fill out the specifications below</div>
                  </div>
                </div>
              </div>

              <div className="card-body p-4 p-md-5 bg-white">
                <DiamondsForm onSuccess={handleSuccess} clients={clients} brokers={brokers} />
              </div>
            </div>

            {/* Helper Tip */}
            <div
              className="card border-0 mt-4 mb-5 shadow-sm"
              style={{
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)",
                borderLeft: "4px solid #667eea",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-info-circle text-primary" style={{ fontSize: "1.4rem" }} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-primary-emphasis">Pro Tip</h6>
                    <p className="text-muted small mb-0">
                      Entering <strong>Rap Rate</strong>, <strong>Rap Discount</strong>, and <strong>Weight</strong> will automatically calculate the total price. Make sure to double-check derived values.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .breadcrumb-item + .breadcrumb-item::before {
          color: rgba(0, 0, 0, 0.3);
        }
        .btn:focus {
          box-shadow: none !important;
        }
      `}</style>
    </div>
  );
}