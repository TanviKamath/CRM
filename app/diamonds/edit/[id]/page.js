// app/diamonds/edit/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DiamondsForm from "../../DiamondsForm";

export default function EditDiamond() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [diamond, setDiamond] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchDiamond = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/diamonds/${id}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Diamond not found");
        }
        const data = await res.json();
        console.log("Fetched diamond data:", data); // Debug log
        setDiamond(data);
      } catch (err) {
        console.error("Error fetching diamond:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDiamond();
  }, [id]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
        <div className="text-center">
          <div
            className="spinner-border mb-3"
            role="status"
            style={{ width: "3rem", height: "3rem", color: "#667eea", borderWidth: "0.2rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="text-muted">Loading diamond details...</div>
        </div>
      </div>
    );
  }

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
                  <h4 className="fw-bold mb-2">Unable to load diamond</h4>
                  <p className="text-muted mb-4">{error}</p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-outline-primary px-4"
                      style={{ borderRadius: 10 }}
                      onClick={() => window.location.reload()}
                    >
                      <i className="bi bi-arrow-clockwise me-2" />
                      Retry
                    </button>
                    <Link className="btn btn-primary px-4" style={{ borderRadius: 10 }} href="/diamonds">
                      <i className="bi bi-arrow-left me-2" />
                      Back to Inventory
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!diamond) {
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
                  <h4 className="fw-bold mb-2">Diamond not found</h4>
                  <p className="text-muted mb-4">The diamond you're looking for doesn't exist.</p>
                  <Link className="btn btn-primary px-4" style={{ borderRadius: 10 }} href="/diamonds">
                    <i className="bi bi-arrow-left me-2" />
                    Back to Inventory
                  </Link>
                </div>
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
          <div className="col-lg-10 col-xl-9">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: 48,
                    height: 48,
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    boxShadow: "0 4px 15px rgba(245,158,11,0.3)",
                  }}
                >
                  <i className="bi bi-pencil-square text-white" style={{ fontSize: "1.2rem" }} />
                </div>
                <div>
                  <h2 className="fw-bold mb-0 text-dark" style={{ letterSpacing: "-0.5px" }}>
                    Edit Diamond
                  </h2>
                  <div className="text-muted small">Update inventory details and pricing</div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <Link
                  href={`/diamonds/show/${id}`}
                  className="btn btn-outline-primary px-3 d-flex align-items-center"
                  style={{ borderRadius: 10 }}
                >
                  <i className="bi bi-eye me-2" />
                  View
                </Link>
                <Link
                  href="/diamonds"
                  className="btn btn-outline-secondary px-3 d-flex align-items-center"
                  style={{ borderRadius: 10 }}
                >
                  <i className="bi bi-arrow-left me-2" />
                  Cancel
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
                  <Link href="/diamonds" className="text-decoration-none text-muted">
                    Diamonds
                  </Link>
                </li>
                <li className="breadcrumb-item">
                  <Link href={`/diamonds/show/${id}`} className="text-decoration-none text-muted">
                    {diamond.certificate_number || `#${id}`}
                  </Link>
                </li>
                <li className="breadcrumb-item active text-warning" aria-current="page">
                  Edit
                </li>
              </ol>
            </nav>

            {/* Form Card */}
            <div className="card border-0 shadow-lg overflow-hidden" style={{ borderRadius: 20 }}>
              <div className="card-header bg-white border-0 py-4 px-4 px-md-5">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded-3 d-flex align-items-center justify-content-center me-3"
                    style={{ width: 42, height: 42, backgroundColor: "rgba(245,158,11,0.10)" }}
                  >
                    <i className="bi bi-gem text-warning" style={{ fontSize: "1.2rem" }} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">Diamond Information</h5>
                    <div className="text-muted small">Modify specifications below</div>
                  </div>
                </div>
              </div>

              <div className="card-body p-4 p-md-5 bg-white">
                <DiamondsForm
                  initial={diamond}
                  isEdit={true}
                  diamondId={id}
                  onSuccess={() => {
                    router.push(`/diamonds/show/${id}?success=${encodeURIComponent("Diamond updated successfully!")}`);
                  }}
                />
              </div>
            </div>

            {/* Quick Tip */}
            <div
              className="card border-0 mt-4 shadow-sm"
              style={{
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(251,191,36,0.06) 100%)",
                borderLeft: "4px solid #f59e0b",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex">
                  <div className="me-3">
                    <i className="bi bi-lightbulb text-warning" style={{ fontSize: "1.4rem" }} />
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1 text-warning-emphasis">Editing Tips</h6>
                    <p className="text-muted small mb-0">
                      Changing Weight or Rap Rate will automatically recalculate total amounts.
                      Ensure you review pricing before saving.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div
              className="card border-0 mt-4 mb-5 shadow-sm"
              style={{
                borderRadius: 16,
                backgroundColor: "rgba(220, 53, 69, 0.02)",
                border: "1px dashed rgba(220, 53, 69, 0.2)",
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3 text-danger">
                      <i className="bi bi-exclamation-octagon" style={{ fontSize: "1.4rem" }} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-danger mb-0">Delete Diamond</h6>
                      <div className="text-muted small">
                        Permanently remove this stone from inventory.
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-danger px-4"
                    style={{ borderRadius: 10 }}
                    onClick={async () => {
                      if (!confirm("Are you sure you want to delete this diamond? This cannot be undone.")) return;
                      try {
                        const res = await fetch(`/api/diamonds/${id}`, { method: "DELETE" });
                        if (res.ok) {
                          router.push("/diamonds?success=" + encodeURIComponent("Diamond deleted successfully!"));
                        } else {
                          const errorData = await res.json();
                          alert(errorData.error || "Failed to delete diamond");
                        }
                      } catch (err) {
                        console.error("Delete error:", err);
                        alert("Failed to delete diamond");
                      }
                    }}
                  >
                    Delete
                  </button>
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