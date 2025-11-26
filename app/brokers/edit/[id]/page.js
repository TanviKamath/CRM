"use client";

import { useEffect, useState } from "react";
import BrokersForm from "../../BrokersForm";

export default function EditBroker({ params }) {
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
      <h2>Edit Broker</h2>
      <BrokersForm initial={broker} />
    </div>
  );
}
