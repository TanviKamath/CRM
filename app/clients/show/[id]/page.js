// app/clients/show/[id]/page.js
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

export default function ShowClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/clients/${id}`);

        if (!res.ok) {
          throw new Error("Client not found");
        }

        const data = await res.json();
        setClient(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();

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
          <Link href="/clients" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">
          <h4>Not Found</h4>
          <p>Client not found.</p>
          <Link href="/clients" className="btn btn-secondary">Back to List</Link>
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
              <h5 className="mb-0">Client Details</h5>
              <div>
                <Link href={`/clients/edit/${client.id}`} className="btn btn-primary me-2">
                  Edit
                </Link>
                <Link href="/clients" className="btn btn-secondary">
                  Back to List
                </Link>
              </div>
            </div>

            {/* Card Body */}
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <p>
                    <strong>Company Name:</strong> {displayValue(client.company_name)}
                  </p>
                  <p>
                    <strong>Contact Name:</strong> {displayValue(client.contact_name)}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    {client.email ? (
                      <a href={`mailto:${client.email}`}>{client.email}</a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
                <div className="col-md-6">
                  <p>
                    <strong>Phone:</strong>{" "}
                    {client.phone ? (
                      <a href={`tel:${client.phone}`}>{client.phone}</a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                  <p>
                    <strong>Address:</strong> {displayValue(client.address)}
                  </p>
                  <p>
                    <strong>Created At:</strong> {formatDate(client.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="d-flex justify-content-end">
            <button
              className="btn btn-danger me-2"
              onClick={async () => {
                if (!confirm("Are you sure you want to delete this client?")) return;
                try {
                  const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
                  if (res.ok) {
                    window.location.href = "/clients?success=" + encodeURIComponent("Client deleted successfully!");
                  } else {
                    throw new Error("Failed to delete");
                  }
                } catch (err) {
                  alert("Failed to delete client");
                }
              }}
            >
              Delete Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}