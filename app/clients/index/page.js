"use client";

import { useEffect, useState } from "react";
import axios from "../../lib/bootstrap";
import Link from "next/link";

export default function ClientsIndex() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [success, setSuccess] = useState("");

  const loadClients = async (url = "/clients") => {
    try {
      const res = await axios.get(url);
      setClients(res.data.data || res.data);
      setPagination(res.data.meta || null);
    } catch (err) {
      console.error("Failed to load clients:", err);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const deleteClient = async (id) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    try {
      await axios.delete(`/clients/${id}`);
      setSuccess("Client deleted successfully.");
      loadClients();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-4">
      <div className="card shadow-sm">

        <div className="card-header d-flex justify-content-between">
          <h5>Clients</h5>
          <Link href="/frontend/clients/create" className="btn btn-primary">
            Add New Client
          </Link>
        </div>

        <div className="card-body">

          {success && (
            <div className="alert alert-success">{success}</div>
          )}

          <div className="table-responsive">
            <table className="table table-striped">
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
                {clients.length ? (
                  clients.map((client) => (
                    <tr key={client.id}>
                      <td>{client.id}</td>
                      <td>{client.company_name}</td>
                      <td>{client.contact_name}</td>
                      <td>{client.email}</td>
                      <td>{client.phone || "N/A"}</td>
                      <td>
                        <div className="btn-group">
                          <Link
                            href={`/frontend/clients/show?id=${client.id}`}
                            className="btn btn-info btn-sm"
                          >
                            View
                          </Link>
                          <Link
                            href={`/frontend/clients/edit?id=${client.id}`}
                            className="btn btn-primary btn-sm"
                          >
                            Edit
                          </Link>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteClient(client.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No clients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="mt-3 d-flex gap-2">
              {pagination.links.map((link, index) => (
                <button
                  key={index}
                  className={`btn btn-sm ${
                    link.active ? "btn-primary" : "btn-outline-primary"
                  }`}
                  disabled={!link.url}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                  onClick={() => loadClients(link.url)}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
