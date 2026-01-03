// app/brokers/create/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BrokersForm from "../BrokersForm";

export default function CreateBroker() {
  const router = useRouter();

  const handleSubmit = async (formData) => {
    try {
      const res = await fetch("/api/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      const data = await res.json();
      router.push(`/brokers/show/${data.id}?success=${encodeURIComponent("Broker created successfully!")}`);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-12">
          <div className="card">
            {/* Card Header */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Add New Broker</h5>
              <Link href="/brokers" className="btn btn-secondary">
                Back to List
              </Link>
            </div>

            {/* Card Body */}
            <div className="card-body">
              <BrokersForm
                submitButtonText="Create Broker"
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}