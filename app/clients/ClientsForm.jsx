"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientsForm({ initial = {}, onSuccess = () => {} }) {
  const router = useRouter();

  const [form, setForm] = useState({
    company_name: initial.company_name || "",
    contact_name: initial.contact_name || "",
    phone: initial.phone || "",
    email: initial.email || "",
    address: initial.address || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const method = initial.id ? "PUT" : "POST";
    const url = initial.id ? `/api/clients/${initial.id}` : `/api/clients`;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) return alert("Error saving client");

    onSuccess();
    router.push("/clients");
  };

  return (
    <form onSubmit={handleSubmit}>

      <div className="mb-3">
        <label>Company Name</label>
        <input
          className="form-control"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="mb-3">
        <label>Contact Person</label>
        <input
          className="form-control"
          name="contact_name"
          value={form.contact_name}
          onChange={handleChange}
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

      <button className="btn btn-primary">Save Client</button>
    </form>
  );
}
