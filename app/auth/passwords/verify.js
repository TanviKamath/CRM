"use client";

import { useState } from "react";

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async (e) => {
    e.preventDefault();
    setError("");
    setResent(false);

    try {
      const res = await fetch("/api/auth/verification/resend", {
        method: "POST",
      });

      if (!res.ok) {
        setError("Unable to resend verification email.");
        return;
      }

      setResent(true);
    } catch {
      setError("Network error");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">

          <div className="card shadow-sm">
            <div className="card-header fw-bold">Verify Your Email</div>

            <div className="card-body">

              {resent && (
                <div className="alert alert-success">
                  A new verification email has been sent.
                </div>
              )}

              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <p>Please check your email for a verification link.</p>

              <form onSubmit={handleResend} className="d-inline">
                <button type="submit" className="btn btn-link p-0">
                  Resend verification email
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
