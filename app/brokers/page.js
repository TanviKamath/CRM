// app/brokers/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function BrokersIndex() {
  const searchParams = useSearchParams();

  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch brokers
  const fetchBrokers = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/brokers?page=${currentPage}`);

      if (!res.ok) throw new Error("Failed to fetch brokers");

      const data = await res.json();

      // Handle both array and paginated response
      if (Array.isArray(data)) {
        setBrokers(data);
        setTotalItems(data.length);
        setTotalPages(1);
      } else {
        setBrokers(data.data || []);
        setTotalItems(data.total || data.data?.length || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
      setBrokers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();

    // Check for success message in URL
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(decodeURIComponent(success));
    }
  }, [currentPage, searchParams]);

  // Delete broker
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete broker "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/brokers/${id}`, { method: "DELETE" });

      if (!res.ok) throw new Error("Failed to delete broker");

      setSuccessMessage("Broker deleted successfully!");
      fetchBrokers();
    } catch (err) {
      alert(err.message);
    }
  };

  // Dismiss success message
  const dismissSuccess = () => setSuccessMessage("");

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card">
            {/* Card Header */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Brokers</h5>
              <Link href="/brokers/create" className="btn btn-primary">
                Add New Broker
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
                      <th>Name</th>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Commission Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : brokers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center">No brokers found.</td>
                      </tr>
                    ) : (
                      brokers.map((broker) => (
                        <tr key={broker.id}>
                          <td>{broker.id}</td>
                          <td>{broker.name || "-"}</td>
                          <td>{broker.company_name || "-"}</td>
                          <td>
                            {broker.email ? (
                              <a href={`mailto:${broker.email}`}>{broker.email}</a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            {broker.phone ? (
                              <a href={`tel:${broker.phone}`}>{broker.phone}</a>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>
                            {broker.commission_rate ? `${broker.commission_rate}%` : "-"}
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <Link
                                href={`/brokers/show/${broker.id}`}
                                className="btn btn-sm btn-info text-white"
                              >
                                View
                              </Link>
                              <Link
                                href={`/brokers/edit/${broker.id}`}
                                className="btn btn-sm btn-primary"
                              >
                                Edit
                              </Link>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(broker.id, broker.name)}
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
                <div className="mt-4 d-flex justify-content-center">
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
                  Showing {brokers.length} of {totalItems} brokers
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}