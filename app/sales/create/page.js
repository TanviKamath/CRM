// app/sales/create/page.js
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import SalesForm from "../SalesForm";

export default function CreateSalePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [diamonds, setDiamonds] = useState([]);
  const [clients, setClients] = useState([]);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pre-selected diamond from URL (e.g., from diamonds list "Record Sale" button)
  const preSelectedDiamondId = searchParams.get("diamond_id") || "";

  // Load dropdown data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [diamondsRes, clientsRes, brokersRes] = await Promise.all([
          fetch("/api/diamonds?availability=available"),
          fetch("/api/clients"),
          fetch("/api/brokers"),
        ]);

        if (!diamondsRes.ok || !clientsRes.ok || !brokersRes.ok) {
          throw new Error("Failed to load form data");
        }

        const [diamondsData, clientsData, brokersData] = await Promise.all([
          diamondsRes.json(),
          clientsRes.json(),
          brokersRes.json(),
        ]);

        // Handle both array and paginated response
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
  }, []);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      router.push(`/sales/show/${data.id}?success=${encodeURIComponent("Sale created successfully!")}`);
    } catch (err) {
      throw err; // Let the form handle the error
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
          <h2>Create New Sale</h2>
        </div>
        <div className="col text-end">
          <Link href="/sales" className="btn btn-secondary">
            Back to Sales
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <SalesForm
            diamonds={diamonds}
            clients={clients}
            brokers={brokers}
            preSelectedDiamondId={preSelectedDiamondId}
            submitButtonText="Create Sale"
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}