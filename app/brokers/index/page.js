"use client";

import { useEffect, useState } from "react";
import axios from "../../lib/bootstrap";
import Link from "next/link";

export default function BrokersIndex() {
  const [brokers, setBrokers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [success, setSuccess] = useState("");

  const fetchBrokers = async (url = "/brokers") => {
    try {
      const res = await axios.get(url);
      
      setBrokers(res.data.data || res.data); // supports both paginated & plain
      setPagination(res.data.meta || null);

    } catch (error) {
      console.error("Failed to load brokers:", error);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // DELETE handler
  const deleteBroker = async (id) => {
    if (!confirm("Are you sure you want to delete this broker?")) return;

    try {
      await axios.delete(`/brokers/${id}`);

      setSuccess("Broker deleted successfully.");
      fetchBrokers();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card shadow-sm">

            {/* HEADER */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Brokers</h5>

              <Link href="/frontend/brokers/create" className="btn btn-primary">
                Add New Broker
              </Link>
            </div>

            <div className="card-body">

              {/* SUCCESS ALERT */}
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}

              {/* TABLE */}
              <div className="table-responsive">
                <table className="table table-striped">
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
                    {brokers.length > 0 ? (
                      brokers.map((broker) => (
                        <tr key={broker.id}>
                          <td>{broker.id}</td>
                          <td>{broker.name}</td>
                          <td>{broker.company_name || "-"}</td>
                          <td>{broker.email}</td>
                          <td>{broker.phone}</td>
                          <td>{broker.commission_rate}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <Link
                                href={`/frontend/brokers/show?id=${broker.id}`}
                                className="btn btn-info btn-sm"
                              >
                                View
                              </Link>

                              <Link
                                href={`/frontend/brokers/edit?id=${broker.id}`}
                                className="btn btn-primary btn-sm"
                              >
                                Edit
                              </Link>

                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => deleteBroker(broker.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No brokers found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {pagination && (
                <div className="mt-4 d-flex gap-2">
                  {pagination.links.map((link, index) => (
                    <button
                      key={index}
                      className={`btn btn-sm ${
                        link.active ? "btn-primary" : "btn-outline-primary"
                      }`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      onClick={() => fetchBrokers(link.url)}
                      disabled={!link.url}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
