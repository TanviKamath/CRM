// app/clients/create/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientsForm from "../ClientsForm";

export default function CreateClient() {
  const router = useRouter();
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      router.push(`/clients/show/${data.id}?success=${encodeURIComponent("Client created successfully!")}`);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add New Client</h5>
              <Link href="/clients" className="btn btn-secondary">
                Back to List
              </Link>
            </div>

            <div className="card-body">
              <ClientsForm 
                submitButtonText="Create Client"
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}