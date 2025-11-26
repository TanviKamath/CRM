"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClientsIndex() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then(setClients);
  }, []);

  const deleteClient = async (id) => {
    if (!confirm("Delete client?")) return;

    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    window.location.reload();
  };

  return (
    <div className="container py-4">

      <div className="d-flex justify-content-between">
        <h2>Clients</h2>
        <Link href="/clients/create" className="btn btn-primary">
          Add Client
        </Link>
      </div>

      <table className="table table-striped mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Contact</th>
            <th>Phone</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.company_name}</td>
              <td>{c.contact_name}</td>
              <td>{c.phone}</td>

              <td>
                <Link href={`/clients/show/${c.id}`} className="btn btn-info btn-sm me-2">
                  View
                </Link>

                <Link href={`/clients/edit/${c.id}`} className="btn btn-warning btn-sm me-2">
                  Edit
                </Link>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteClient(c.id)}
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
