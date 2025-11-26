"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BrokersForm({ initial = {}, onSuccess = () => {} }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: initial.name || "",
    phone: initial.phone || "",
    email: initial.email || "",
    address: initial.address || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = initial.id ? "PUT" : "POST";
    const url = initial.id ? `/api/brokers/${initial.id}` : `/api/brokers`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      alert("Error saving broker");
      return;
    }

    onSuccess();
    router.push("/brokers");
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label>Name</label>
        <input
          className="form-control"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label>Phone</label>
        <input
          className="form-control"
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label>Email</label>
        <input
          className="form-control"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
      </div>

      <div className="mb-3">
        <label>Address</label>
        <textarea
          className="form-control"
          name="address"
          value={form.address}
          onChange={handleChange}
        />
      </div>

      <button className="btn btn-primary">Save Broker</button>
    </form>
  );
}
