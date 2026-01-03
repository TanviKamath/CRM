// app/sales/edit/[id]/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import SalesForm from "../../SalesForm";

export default function EditSalePage() {
  const router = useRouter();
  const params = useParams();
  const saleId = params.id;

  const [sale, setSale] = useState(null);
  const [diamonds, setDiamonds] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch sale and dropdown data
  useEffect(() => {
    if (!saleId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [saleRes, diamondsRes, clientsRes, brokersRes] = await Promise.all([
          fetch(`/api/sales/${saleId}`),
          fetch("/api/diamonds"),
          fetch("/api/clients"),
          fetch("/api/brokers"),
        ]);

        if (!saleRes.ok) {
          throw new Error("Sale not found");
        }

        const [saleData, diamondsData, clientsData, brokersData] = await Promise.all([
          saleRes.json(),
          diamondsRes.json(),
          clientsRes.json(),
          brokersRes.json(),
        ]);

        setSale(saleData);
        setDiamonds(Array.isArray(diamondsData) ? diamondsData : diamondsData.data || []);
        setClients(Array.isArray(clientsData) ? clientsData : clientsData.data || []);
        setBrokers(Array.isArray(brokersData) ? brokersData : brokersData.data || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [saleId]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      router.push(`/sales/show/${saleId}?success=${encodeURIComponent("Sale updated successfully!")}`);
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
          <Link href="/sales" className="btn btn-secondary">Back to Sales</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row mb-4">
        <div className="col">
          <h2>Edit Sale</h2>
        </div>
        <div className="col text-end">
          <Link href={`/sales/show/${saleId}`} className="btn btn-secondary">
            Back to Sale
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <SalesForm
            initial={sale}
            diamonds={diamonds}
            clients={clients}
            brokers={brokers}
            submitButtonText="Update Sale"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}