// app/diamonds/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DiamondsIndex({ searchParams }) {
  const [diamonds, setDiamonds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const filter = searchParams?.availability || "";
      const q = filter ? `?availability=${encodeURIComponent(filter)}` : "";
      const res = await fetch(`/api/diamonds${q}`);
      if (!res.ok) {
        console.error("Failed to load diamonds", await res.text());
        setDiamonds([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setDiamonds(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchData();
  }, [searchParams]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between">
        <h2>Diamonds</h2>
        <Link href="/diamonds/create" className="btn btn-primary">Add New</Link>
      </div>

      {loading ? <p>Loading...</p> : (
        <table className="table table-striped mt-4">
          <thead>
            <tr>
              <th>ID</th>
              <th>Certificate</th>
              <th>Weight</th>
              <th>Color</th>
              <th>Availability</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {diamonds.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.certificate_number}</td>
                <td>{d.weight}</td>
                <td>{d.color}</td>
                <td>{d.availability}</td>
                <td>
                  <Link href={`/diamonds/show/${d.id}`} className="btn btn-info btn-sm me-2">View</Link>
                  <Link href={`/diamonds/edit/${d.id}`} className="btn btn-warning btn-sm me-2">Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={async () => {
                    if (!confirm("Delete this diamond?")) return;
                    await fetch(`/api/diamonds/${d.id}`, { method: "DELETE" });
                    window.location.reload();
                  }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
