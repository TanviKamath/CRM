"use client";

import SalesForm from "../../SalesForm";
import axios from "../../../lib/bootstrap";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function EditSalePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const saleId = searchParams.get("id"); // since no nested /[id], we use query string ?id=

    const [sale, setSale] = useState(null);

    // Fetch sale data
    useEffect(() => {
        if (!saleId) return;

        axios.get(`/sales/${saleId}`)
            .then(res => setSale(res.data))
            .catch(() => {
                alert("Failed to load sale");
                router.push("/frontend/sales/index");
            });
    }, [saleId]);

    const handleSubmit = async (formData) => {
        await axios.get("/sanctum/csrf-cookie");
        await axios.put(`/sales/${saleId}`, formData);
        router.push(`/frontend/sales/show?id=${saleId}`);
    };

    if (!sale) {
        return <div className="container py-4">Loading...</div>;
    }

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2>Edit Sale</h2>
                </div>
                <div className="col text-end">
                    <a 
                        href={`/frontend/sales/show?id=${saleId}`} 
                        className="btn btn-secondary"
                    >
                        Back to Sale
                    </a>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <SalesForm
                        initial={sale}
                        onSuccess={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
}
