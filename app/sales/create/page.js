"use client";

import SalesForm from "../SalesForm";
import axios from "../../lib/bootstrap";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CreateSalePage() {
    const router = useRouter();

    const [diamonds, setDiamonds] = useState([]);
    const [clients, setClients] = useState([]);
    const [brokers, setBrokers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load dropdown data EXACT like Blade form expects
    useEffect(() => {
        Promise.all([
            axios.get("/diamonds"),
            axios.get("/clients"),
            axios.get("/brokers"),
        ])
            .then(([d, c, b]) => {
                setDiamonds(d.data.data || d.data);
                setClients(c.data.data || c.data);
                setBrokers(b.data.data || b.data);
                setLoading(false);
            })
            .catch(() => {
                alert("Failed to load form data");
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (formData) => {
        await axios.get("/sanctum/csrf-cookie");
        const res = await axios.post("/sales", formData);
        router.push(`/frontend/sales/show?id=${res.data.id}`);
    };

    if (loading) {
        return <div className="container py-4">Loading...</div>;
    }

    return (
        <div className="container py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2>Create New Sale</h2>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <SalesForm
                        diamonds={diamonds}
                        clients={clients}
                        brokers={brokers}
                        onSuccess={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
}
