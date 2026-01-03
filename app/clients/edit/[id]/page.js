// app/clients/edit/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ClientsForm from "../../ClientsForm";

export default function EditClient() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch client data
  useEffect(() => {
    if (!id) return;

    const fetchClient = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/clients/${id}`);
        
        if (!res.ok) {
          throw new Error("Client not found");
        }

        const data = await res.json();
        setClient(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      router.push(`/clients/show/${id}?success=${encodeURIComponent("Client updated successfully!")}`);
    } catch (err) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">
          <h4>Error</h4>
          <p>{error}</p>
          <Link href="/clients" className="btn btn-secondary">Back to List</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Edit Client</h5>
              <Link href="/clients" className="btn btn-secondary">
                Back to List
              </Link>
            </div>

            <div className="card-body">
              <ClientsForm
                initial={client}
                submitButtonText="Update Client"
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}