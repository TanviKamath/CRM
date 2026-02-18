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
                if (user?.subscription !== "Pro") {
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

    return <ExcelMerger />;
}
