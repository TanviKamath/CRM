"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SalesIndex({ searchParams }) {
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const status = searchParams?.status || "";
      const res = await fetch(`/api/sales?status=${status}`);
      const data = await res.json();
      setSales(data.data || []);
      setTotal(data.total || 0);
    };
    fetchData();
  }, [searchParams]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between">
        <h2>Sales</h2>
        <Link href="/sales/create" className="btn btn-primary">
          New Sale
        </Link>
      </div>

      <table className="table table-striped mt-4">
        <thead>
          <tr>
            <th>ID</th>
            <th>Diamond</th>
            <th>Client</th>
            <th>Amount</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.diamond_certificate}</td>
              <td>{s.client_company}</td>
              <td>{s.sale_amount}</td>
              <td>{s.status}</td>
              <td>
                <Link href={`/sales/show/${s.id}`} className="btn btn-info btn-sm me-2">
                  View
                </Link>
                <Link href={`/sales/edit/${s.id}`} className="btn btn-warning btn-sm me-2">
                  Edit
                </Link>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteSale(s.id)}
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

async function deleteSale(id) {
  if (!confirm("Delete Sale?")) return;
  await fetch(`/api/sales/${id}`, { method: "DELETE" });
  window.location.reload();
}
