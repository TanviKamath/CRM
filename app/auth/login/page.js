"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Login failed");
      }

      window.location.href = "/";
    } catch (err) {
      setErrors(err.message);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "85vh", background: "#fafafa" }}
    >
      <div
        className="p-4"
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "22px",
          boxShadow: "0 12px 28px rgba(0,0,0,0.08)",
        }}
      >
        <h3
          className="text-center mb-4"
          style={{
            fontWeight: "600",
            fontSize: "26px",
            color: "#111",
          }}
        >
          Login
        </h3>

        {errors && (
          <div
            className="alert alert-danger py-2 text-center"
            style={{ borderRadius: "10px" }}
          >
            {errors}
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <label className="fw-semibold" style={{ color: "#222" }}>
            Password
          </label>
          <input
            type="password"
            className="form-control mb-4"
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
            Login
          </button>
        </form>

        <div className="text-center mt-3">
          <Link
            href="/auth/register"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              color: "#111",
              opacity: 0.7,
            }}
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}