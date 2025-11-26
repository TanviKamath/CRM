"use client";

import { useEffect, useState } from "react";

export default function DiamondsIndexPage({ searchParams }) {
  const [diamonds, setDiamonds] = useState([]);

  useEffect(() => {
    const fetchDiamonds = async () => {
      const availability = searchParams?.availability || "";

      const res = await fetch(`/api/diamonds?availability=${availability}`);
      const data = await res.json();

      setDiamonds(data);
    };

    fetchDiamonds();
  }, [searchParams]);

  return (
    <div className="container py-4">
      <h2>Diamonds List</h2>

      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Certificate</th>
            <th>Weight</th>
            <th>Color</th>
            <th>Availability</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
