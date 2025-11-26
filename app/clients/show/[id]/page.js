"use client";

import { useEffect, useState } from "react";

export default function ShowClient({ params }) {
  const { id } = params;
  const [client, setClient] = useState(null);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((res) => res.json())
      .then(setClient);
  }, [id]);

  if (!client) return <p>Loading...</p>;

  return (
    <div className="container py-4">
      <h2>Client Details</h2>

      <p><strong>Company:</strong> {client.company_name}</p>
      <p><strong>Contact Name:</strong> {client.contact_name}</p>
      <p><strong>Email:</strong> {client.email}</p>
      <p><strong>Phone:</strong> {client.phone}</p>
      <p><strong>Address:</strong> {client.address}</p>
    </div>
  );
}
