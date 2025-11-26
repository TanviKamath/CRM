"use client";

import { useEffect, useState } from "react";
import ClientsForm from "../../ClientsForm";

export default function EditClient({ params }) {
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
      <h2>Edit Client</h2>
      <ClientsForm initial={client} />
    </div>
  );
}
