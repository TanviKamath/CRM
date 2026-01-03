// app/brokers/show/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
};

// Display value or N/A
const displayValue = (value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return value;
};

export default function ShowBroker() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;

  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchBroker = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/brokers/${id}`);

        if (!res.ok) {
          throw new Error("Broker not found");
        }

        const data = await res.json();
        setBroker(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBroker();

    // Check for success message
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Link href="/brokers" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <h4>Not Found</h4>
          <p>Broker not found.</p>
          <Link href="/brokers" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card">
            {/* Card Header */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Broker Details</h5>
              <div>
                <Link href={`/brokers/edit/${broker.id}`} className="btn btn-primary me-2">
                  Edit
                </Link>
                <Link href="/brokers" className="btn btn-secondary">
                  Back to List
                </Link>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Name:</strong> {displayValue(broker.name)}
                  </p>
                  <p>
                    <strong>Company Name:</strong> {displayValue(broker.company_name)}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {broker.email ? (
                      <a href={`mailto:${broker.email}`}>{broker.email}</a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                    {broker.phone ? (
                      <a href={`tel:${broker.phone}`}>{broker.phone}</a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                  <p>
                    <strong>Commission Rate:</strong>{" "}
                    {broker.commission_rate ? `${broker.commission_rate}%` : "N/A"}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Tax Number:</strong> {displayValue(broker.tax_number)}
                  </p>
                  <p>
                    <strong>Address:</strong> {displayValue(broker.address)}
                  </p>
                  <p>
                    <strong>Bank Details:</strong> {displayValue(broker.bank_details)}
                  </p>
                  <p>
                    <strong>Created At:</strong> {formatDate(broker.created_at)}
                  </p>
                </div>
              </div>

              {/* Notes Section */}
              {broker.notes && (
                <div className="row mt-4">
                  <div className="col-12">
                    <h6>Notes:</h6>
                    <p className="mb-0">{broker.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-danger"
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this broker?")) return;
                try {
                  const res = await fetch(`/api/brokers/${broker.id}`, { method: "DELETE" });
                  if (res.ok) {
                    window.location.href = "/brokers?success=" + encodeURIComponent("Broker deleted successfully!");
                  } else {
                    throw new Error("Failed to delete");
                  }
                } catch (err) {
                  alert("Failed to delete broker");
                }
              }}
            >
              Delete Broker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}