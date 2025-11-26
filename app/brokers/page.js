"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BrokersIndex() {
  const [brokers, setBrokers] = useState([]);

  useEffect(() => {
    fetch("/api/brokers")
      .then((res) => res.json())
      .then(setBrokers);
  }, []);

  const deleteBroker = async (id) => {
    if (!confirm("Delete broker?")) return;

    await fetch(`/api/brokers/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between">
        <h2>Brokers</h2>
        <Link href="/brokers/create" className="btn btn-primary">
          Add Broker
        </Link>
      </div>

      <table className="table table-striped mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {brokers.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.name}</td>
              <td>{b.phone}</td>
              <td>{b.email}</td>
              <td>
                <Link href={`/brokers/show/${b.id}`} className="btn btn-info btn-sm me-2">
                  View
                </Link>
                <Link href={`/brokers/edit/${b.id}`} className="btn btn-warning btn-sm me-2">
                  Edit
                </Link>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteBroker(b.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
