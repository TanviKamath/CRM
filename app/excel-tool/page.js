"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ExcelMerger from "../components/ExcelMerger/ExcelMerger";

export default function ExcelToolPage() {
    const [authorized, setAuthorized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetch("/api/auth/me", { credentials: "include" })
            .then((res) => {
                if (!res.ok) throw new Error("Not authenticated");
                return res.json();
            })
            .then((user) => {
                if (user?.subscription !== "Pro" || user?.client_type === "Loose") {
                    router.push("/");
                } else {
                    setAuthorized(true);
                }
            })
            .catch(() => {
                router.push("/auth/login");
            });
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#f8f9fc" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 py-5" style={{ backgroundColor: "#f8f9fc" }}>
            <div className="container">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                    <div>
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: 52,
                                    height: 52,
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    boxShadow: "0 6px 18px rgba(102,126,234,0.25)",
                                }}
                            >
                                <i className="bi bi-file-earmark-spreadsheet text-white" style={{ fontSize: "1.3rem" }} />
                            </div>
                            <div>
                                <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: "-0.3px" }}>
                                    Excel Tool
                                </h2>
                                <div className="text-muted">Merge multiple Excel files and map columns easily.</div>
                            </div>
                        </div>
                    </div>
                </div>

                <ExcelMerger />
            </div>
        </div>
    );
}
