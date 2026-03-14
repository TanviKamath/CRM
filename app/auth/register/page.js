"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SUBSCRIPTION_OPTIONS = ["Basic", "Basic+", "Pro"];

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [subscription, setSubscription] = useState("Basic");
  const [clientType, setClientType] = useState("Gia");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, subscription, client_type: clientType }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      router.push("/");
    } catch (err) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "90vh", background: "#fafafa" }}
    >
      <div
        className="p-4"
        style={{
          width: "100%",
          maxWidth: "430px",
          background: "#fff",
          borderRadius: "22px",
          boxShadow: "0 12px 26px rgba(0,0,0,0.08)",
        }}
      >
        <h3
          className="text-center mb-4"
          style={{
            fontWeight: 600,
            fontSize: "26px",
            color: "#111",
          }}
        >
          Create Account
        </h3>

        {error && (
          <div
            className="alert alert-danger py-2 text-center"
            style={{ borderRadius: "10px" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <label className="fw-semibold" style={{ color: "#222" }}>
            Name
          </label>
          <input
            type="text"
            className="form-control mb-3"
            style={{
              borderRadius: "14px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              fontSize: "15px",
            }}
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Email */}
          <label className="fw-semibold" style={{ color: "#222" }}>
            Email
          </label>
          <input
            type="email"
            className="form-control mb-3"
            style={{
              borderRadius: "14px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              fontSize: "15px",
            }}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password */}
          <label className="fw-semibold" style={{ color: "#222" }}>
            Password
          </label>
          <input
            type="password"
            className="form-control mb-3"
            style={{
              borderRadius: "14px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              fontSize: "15px",
            }}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Client Type */}
          <label className="fw-semibold" style={{ color: "#222" }}>
            Client Type
          </label>
          <select
            className="form-select mb-3"
            style={{
              borderRadius: "14px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              fontSize: "15px",
            }}
            value={clientType}
            onChange={(e) => setClientType(e.target.value)}
          >
            <option value="Gia">Gia</option>
            <option value="Loose">Loose</option>
          </select>

          {/* Subscription */}
          <label className="fw-semibold" style={{ color: "#222" }}>
            Subscription Plan
          </label>
          <select
            className="form-select mb-3"
            style={{
              borderRadius: "14px",
              padding: "12px 14px",
              border: "1px solid #ddd",
              fontSize: "15px",
            }}
            value={subscription}
            onChange={(e) => setSubscription(e.target.value)}
          >
            {SUBSCRIPTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Final Offer Display */}
          <div
            className="p-3 mb-4 text-center"
            style={{
              background: "rgba(102,126,234,0.06)",
              borderRadius: "14px",
              border: "1px solid rgba(102,126,234,0.15)",
            }}
          >
            <div className="text-muted small mb-1">Your Final Offer:</div>
            <div className="fw-bold text-primary" style={{ fontSize: "18px" }}>
              {clientType} {subscription}
            </div>
          </div>

          <div
            className="form-text mb-3"
            style={{ color: "#555", fontSize: "13px" }}
          >
            <i className="bi bi-info-circle me-1" />
            Pro users get access to the Excel Merger tool.
          </div>

          {/* Register button */}
          <button
            className="w-100"
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              padding: "12px 0",
              fontSize: "16px",
              fontWeight: 600,
              transition: "0.25s",
            }}
            onMouseEnter={(e) => (e.target.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.target.style.opacity = "1")}
          >
            Register
          </button>
        </form>

        <div className="text-center mt-3">
          <a
            href="/auth/login"
            style={{
              fontSize: "14px",
              color: "#111",
              textDecoration: "none",
              opacity: 0.7,
            }}
          >
            Already have an account? Login
          </a>
        </div>
      </div>
    </div>
  );
}