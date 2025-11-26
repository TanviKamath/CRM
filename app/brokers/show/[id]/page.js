"use client";

import { useEffect, useState } from "react";

export default function ShowBroker({ params }) {
  const { id } = params;
  const [broker, setBroker] = useState(null);

  useEffect(() => {
    fetch(`/api/brokers/${id}`)
      .then((res) => res.json())
      .then(setBroker);
  }, [id]);

  if (!broker) return <p>Loading...</p>;

  return (
    <div className="container py-4">
      <h2>Broker Details</h2>

      <p><strong>Name:</strong> {broker.name}</p>
      <p><strong>Email:</strong> {broker.email}</p>
      <p><strong>Phone:</strong> {broker.phone}</p>
      <p><strong>Address:</strong> {broker.address}</p>
    </div>
  );
}
