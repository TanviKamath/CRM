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
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch clients
  const fetchClients = async () => {
    setLoading(true);
    
    try {
      const res = await fetch(`/api/clients?page=${currentPage}`);
      
      if (!res.ok) throw new Error("Failed to fetch clients");
      
      const data = await res.json();
      
      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setClients(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else {
        setClients(data.data || []);
        setTotalItems(data.total || data.data?.length || 0);
        setTotalPages(data.totalPages || 1);
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
  }, [currentPage, searchParams]);

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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${currentPage === pageNum ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}

                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}

          {/* Page Info */}
          {totalItems > 0 && (
            <div className="text-center text-muted mt-2">
              Showing {clients.length} of {totalItems} clients
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}