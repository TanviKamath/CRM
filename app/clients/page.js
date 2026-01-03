// app/clients/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function ClientsIndex() {
  const searchParams = useSearchParams();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/clients");

      if (!res.ok) throw new Error("Failed to fetch clients");

      const data = await res.json();

      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setClients(data);
      } else {
        setClients(data.data || []);
      }
    } catch (err) {
      console.error(err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();

    // Check for success message in URL
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [searchParams]);

  // Delete client
  const handleDelete = async (id, companyName) => {
    if (!confirm(`Are you sure you want to delete client "${companyName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });

      if (!res.ok) throw new Error("Failed to delete client");

      setSuccessMessage("Client deleted successfully!");
      fetchClients();
    } catch (err) {
      alert(err.message);
    }
  };

  // Dismiss success message
  const dismissSuccess = () => setSuccessMessage("");

  return (
    <div className="container py-4">
      <div className="card shadow-sm">
        {/* Card Header */}
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Clients</h5>
          <Link href="/clients/create" className="btn btn-primary">
            Add New Client
          </Link>
        </div>

        {/* Card Body */}
        <div className="card-body">
          {/* Success Message */}
          {successMessage && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {successMessage}
              <button
                type="button"
                className="btn-close"
                onClick={dismissSuccess}
                aria-label="Close"
              ></button>
            </div>
          )}

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Company Name</th>
                  <th>Contact Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No clients found.</td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td>{client.id}</td>
                      <td>{client.company_name || "-"}</td>
                      <td>{client.contact_name || "-"}</td>
                      <td>
                        {client.email ? (
                          <a href={`mailto:${client.email}`}>{client.email}</a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        {client.phone ? (
                          <a href={`tel:${client.phone}`}>{client.phone}</a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Link
                            href={`/clients/show/${client.id}`}
                            className="btn btn-sm btn-info text-white"
                          >
                            View
                          </Link>
                          <Link
                            href={`/clients/edit/${client.id}`}
                            className="btn btn-sm btn-warning text-white"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(client.id, client.company_name)}
                          >
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
        </div>
      </div>
    </div>
  );
}