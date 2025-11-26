"use client";

import { useState } from "react";

export default function EmailResetPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Unable to send reset link");
        return;
      }

      setStatus("Password reset link sent to your email.");
    } catch {
      setError("Network error");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">

          <div className="card shadow-sm">
            <div className="card-header fw-bold">Reset Password</div>

            <div className="card-body">

              {status && <div className="alert alert-success">{status}</div>}
              {error && <div className="alert alert-danger">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary">
                  Send Reset Link
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
