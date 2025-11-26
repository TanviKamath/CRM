// app/diamonds/DiamondsForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiamondsForm({ initial = {}, onSuccess = () => {} }) {
  const router = useRouter();

  const [form, setForm] = useState({
    certificate_number: initial.certificate_number || "",
    shape: initial.shape || "",
    weight: initial.weight || "",
    color: initial.color || "",
    clarity: initial.clarity || "",
    cut: initial.cut || "",
    availability: initial.availability || "available",
  });

  const [error, setError] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const method = initial.id ? "PUT" : "POST";
    const url = initial.id ? `/api/diamonds/${initial.id}` : `/api/diamonds`;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      const data = await res.json();
      onSuccess(data);
      router.push("/diamonds");
    } catch (err) {
      setError(err.message || "Failed to save");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="mb-3">
        <label>Certificate Number</label>
        <input name="certificate_number" value={form.certificate_number} onChange={change} required className="form-control" />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label>Shape</label>
          <input name="shape" value={form.shape} onChange={change} required className="form-control" />
        </div>

        <div className="col-md-4 mb-3">
          <label>Weight</label>
          <input name="weight" value={form.weight} onChange={change} required type="number" step="0.01" className="form-control" />
        </div>

        <div className="col-md-4 mb-3">
          <label>Color</label>
          <input name="color" value={form.color} onChange={change} required className="form-control" />
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label>Clarity</label>
          <input name="clarity" value={form.clarity} onChange={change} required className="form-control" />
        </div>

        <div className="col-md-4 mb-3">
          <label>Cut</label>
          <input name="cut" value={form.cut} onChange={change} required className="form-control" />
        </div>

        <div className="col-md-4 mb-3">
          <label>Availability</label>
          <select name="availability" value={form.availability} onChange={change} className="form-select">
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="memo">Out on Memo</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary">Save Diamond</button>
    </form>
  );
}
